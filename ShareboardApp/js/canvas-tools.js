// js/canvas-tools.js

import { saveCanvasToHistory, undo, redo } from './canvas-history.js';
import { uploadImageAndAddToCanvas } from './document-manager.js';

// Referencia al canvas de Fabric.js proporcionada externamente
let canvas = null;

let brushColorInput;
let brushSizeInput;
let boldBtn;
let italicBtn;
let underlineBtn;
let fontSizeSelect;

// Inicializa la referencia al canvas. Debe llamarse una vez que el lienzo esté creado.
export function initTools(canvasInstance) {
    canvas = canvasInstance;
}

// Bandera para controlar el modo de edición de texto (interna al módulo)
let isTextEditingInternal = false;

// Función para inicializar los event listeners de las herramientas
export function initializeTools(toolBtns, isTextEditingFlagCallback) {
    if (!canvas) {
        console.error('Tools: Canvas no inicializado. No se pueden inicializar las herramientas.');
        return;
    }

    brushColorInput = document.getElementById('brushColor');
    brushSizeInput = document.getElementById('brushSize');
    boldBtn = document.getElementById('boldBtn');
    italicBtn = document.getElementById('italicBtn');
    underlineBtn = document.getElementById('underlineBtn');
    fontSizeSelect = document.getElementById('fontSizeSelect');

    brushColorInput.addEventListener('change', () => {
        if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = brushColorInput.value;
        }
    });

    brushSizeInput.addEventListener('input', () => {
        if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = parseInt(brushSizeInput.value, 10);
        }
    });

    const applyFormat = (prop, value) => {
        const obj = canvas.getActiveObject();
        if (obj && obj.isType('i-text')) {
            obj.set(prop, value);
            canvas.renderAll();
            saveCanvasToHistory();
        }
    };

    boldBtn.addEventListener('click', () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.isType('i-text')) {
            const newVal = obj.fontWeight === 'bold' ? 'normal' : 'bold';
            applyFormat('fontWeight', newVal);
        }
    });

    italicBtn.addEventListener('click', () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.isType('i-text')) {
            const newVal = obj.fontStyle === 'italic' ? 'normal' : 'italic';
            applyFormat('fontStyle', newVal);
        }
    });

    underlineBtn.addEventListener('click', () => {
        const obj = canvas.getActiveObject();
        if (obj && obj.isType('i-text')) {
            applyFormat('underline', !obj.underline);
        }
    });

    fontSizeSelect.addEventListener('change', () => {
        const size = parseInt(fontSizeSelect.value, 10);
        applyFormat('fontSize', size);
    });

    // Eventos de Fabric.js para controlar el modo de edición de texto
    canvas.on('text:editing:entered', () => {
        isTextEditingInternal = true;
        isTextEditingFlagCallback(true); // Notificar a main-app que estamos editando texto
        console.log('Tools: Entrando en modo de edición de texto.');
    });
    canvas.on('text:editing:exited', () => {
        isTextEditingInternal = false;
        isTextEditingFlagCallback(false); // Notificar a main-app que salimos de edición de texto
        console.log('Tools: Saliendo del modo de edición de texto.');
        saveCanvasToHistory(); // Guardar el estado final del texto editado
    });

    // Manejo de Eventos de Teclado Globales (para deshacer/rehacer/borrar)
    // El paneo con Spacebar se manejará en main-app.js
    document.addEventListener('keydown', (e) => {
        // Si estamos editando texto, NO interceptar las teclas de Z, Y, Delete/Backspace
        if (isTextEditingInternal) { // Usar la bandera interna
            return; 
        }
        
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            undo(); // Llamar a la función undo del módulo history
            e.preventDefault();
        } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
            redo(); // Llamar a la función redo del módulo history
            e.preventDefault();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
            if (!canvas.isDrawingMode && canvas.getActiveObject()) {
                canvas.remove(canvas.getActiveObject());
                canvas.discardActiveObject().renderAll();
                saveCanvasToHistory();
                e.preventDefault();
            }
        }
    });


    // Función para añadir objeto de texto (se llama desde la herramienta 'text')
    function addTextOnClick(options) {
        if (options.target) return; // Si clic en un objeto existente, no añadir texto

        const pointer = canvas.getPointer(options.e);
        const iText = new fabric.IText('Haz doble clic para editar', {
            left: pointer.x,
            top: pointer.y,
            fontFamily: 'Roboto',
            fill: '#000000',
            fontSize: parseInt(fontSizeSelect.value, 10) || 24,
            selectable: true,
            editable: true // Asegurarse de que sea editable
        });
        canvas.add(iText);
        canvas.setActiveObject(iText);
        canvas.renderAll();
        
        // Después de añadir el texto, volver a la herramienta de selección
        toolBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-tool="select"]').classList.add('active'); // Activar selector
        canvas.off('mouse:down', addTextOnClick); // Desactivar este listener
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'pointer';
        saveCanvasToHistory(); // Guardar en historial y Firestore
    }


    // Event listeners para los botones de herramientas
    toolBtns.forEach(button => {
        button.addEventListener('click', () => {
            toolBtns.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const toolName = button.dataset.tool; 
            console.log('Tools: Herramienta seleccionada:', toolName);
            
            // Desactivar la edición de texto activa si se cambia de herramienta
            if (canvas.getActiveObject() && canvas.getActiveObject().isType('i-text')) {
                canvas.getActiveObject().exitEditing();
            }

            // Desactivar todos los listeners previos de herramientas específicas
            canvas.off('mouse:down', addTextOnClick); // Para la herramienta de texto

            // Restablecer el estado del canvas por defecto para la nueva herramienta
            canvas.isDrawingMode = false;
            canvas.selection = true;
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'pointer';

            // Asegurarse de que el composite operation se reinicie si no es borrador
            if (canvas.freeDrawingBrush) {
                canvas.freeDrawingBrush.globalCompositeOperation = 'source-over';
            }

            switch(toolName) {
                case 'edit': // Lápiz
                    console.log('Tools: Activando Lápiz');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                    canvas.freeDrawingBrush.width = parseInt(brushSizeInput.value, 10) || 5;
                    canvas.freeDrawingBrush.color = brushColorInput.value || '#000000';
                    brushSizeInput.value = canvas.freeDrawingBrush.width;
                    brushColorInput.value = canvas.freeDrawingBrush.color;
                    canvas.defaultCursor = 'crosshair';
                    canvas.hoverCursor = 'crosshair';
                    break;
                case 'brush': // Marcador
                    console.log('Tools: Activando Marcador');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas); // Usar PencilBrush
                    canvas.freeDrawingBrush.width = parseInt(brushSizeInput.value, 10) || 15;
                    canvas.freeDrawingBrush.color = brushColorInput.value || 'rgba(0, 255, 0, 0.3)';
                    brushSizeInput.value = canvas.freeDrawingBrush.width;
                    brushColorInput.value = canvas.freeDrawingBrush.color;
                    canvas.defaultCursor = 'crosshair';
                    canvas.hoverCursor = 'crosshair';
                    break;
                case 'erase': // Borrador
                    console.log('Tools: Activando Borrador');
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas); // Usar PencilBrush
                    canvas.freeDrawingBrush.width = parseInt(brushSizeInput.value, 10) || 20;
                    canvas.freeDrawingBrush.globalCompositeOperation = 'destination-out'; // Modo borrador
                    brushSizeInput.value = canvas.freeDrawingBrush.width;
                    break;
                case 'select': // Selector (cursor)
                    console.log('Tools: Activando Selector');
                    canvas.isDrawingMode = false;
                    canvas.selection = true;
                    break;
                case 'text': // Texto
                    console.log('Tools: Activando Texto');
                    canvas.isDrawingMode = false;
                    canvas.selection = false; // Para que no seleccione objetos al clic
                    canvas.defaultCursor = 'text';
                    canvas.hoverCursor = 'text';
                    canvas.on('mouse:down', addTextOnClick); // Activar listener para añadir texto
                    break;
                case 'image': // Imagen (SUBIR Y AÑADIR DIRECTO AL LIENZO)
                    console.log('Tools: Activando Herramienta Imagen - Abrir diálogo de archivo.');
                    let imageInputTool = document.createElement('input'); 
                    imageInputTool.type = 'file';
                    imageInputTool.accept = 'image/jpeg,image/png,image/gif,image/webp';
                    imageInputTool.style.display = 'none';
                    imageInputTool.multiple = false;
                    imageInputTool.addEventListener('change', (event) => {
                        if (event.target.files && event.target.files.length > 0) {
                            const file = event.target.files[0];
                            console.log('Tools: Imagen seleccionada desde herramienta Imagen:', file.name);
                            const canvasCenter = canvas.getCenter(); // Posición inicial en el centro del lienzo
                            uploadImageAndAddToCanvas(file, canvasCenter.left, canvasCenter.top);
                        }
                    });
                    imageInputTool.click(); // Disparar el diálogo de selección
                    break;
                case 'mic': // Audio
                    console.log('Tools: Activando Audio');
                    canvas.isDrawingMode = false;
                    canvas.selection = false;
                    alert('Clic en Añadir Audio. Esto se integrará con el panel de documentos.');
                    break;
                case 'more': // Más opciones
                    console.log('Tools: Activando Más opciones');
                    alert('Clic en "Más opciones". Aquí irían configuraciones avanzadas.');
                    canvas.isDrawingMode = false;
                    canvas.selection = true;
                    break;
                case 'undo': // Deshacer
                    console.log('Tools: Deshacer');
                    undo(); // Llamar a la función undo del módulo history
                    break;
                case 'redo': // Rehacer
                    console.log('Tools: Rehacer');
                    redo(); // Llamar a la función redo del módulo history
                    break;
                default:
                    console.log('Tools: Herramienta por defecto (Selector)');
                    canvas.isDrawingMode = false;
                    canvas.selection = true;
                    break;
            }
        });
    });
}

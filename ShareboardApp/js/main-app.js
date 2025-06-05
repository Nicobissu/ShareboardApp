// js/main-app.js

// Importar módulos
import { initializeCanvas, canvas, viewport } from './canvas-core.js'; 
import { saveCanvasState, loadCanvasState, setPersistenceUserId, currentSubjectId } from './canvas-persistence.js'; 
import { saveCanvasToHistory, undo, redo } from './canvas-history.js'; 
import { initializeTools, initTools } from './canvas-tools.js'; // isTextEditingGlobal ya no se importa aquí
import { updateUserStorageUsage, uploadImageAndAddToCanvas, loadDocumentsForCurrentSubject, handleLocalDocument, addDocumentToCanvas } from './document-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main-App.js cargado y DOM completamente cargado.');

    // Obtener referencias a elementos del DOM
    const appContainer = document.querySelector('.app-container');
    const mainCanvasContainer = document.getElementById('mainCanvasContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    const subjectSelect = document.getElementById('subjectSelect');
    const newSubjectBtn = document.querySelector('.btn-new-subject');
    const sidebarLeft = document.getElementById('sidebarLeft');
    const toggleSidebarLeftBtn = document.getElementById('toggleSidebarLeft');
    const toolBtns = document.querySelectorAll('.toolbar-right .tool-btn');
    const localDocInput = document.getElementById('localDocInput');
    const loadLocalDocBtn = document.getElementById('loadLocalDocBtn');
    const documentListContainer = document.querySelector('.document-list');
    const localFilesSection = documentListContainer.querySelector('.local-files');
    const canvasArea = document.getElementById('canvasArea');

    // Bandera para controlar el modo de edición de texto (en main-app)
    let isTextEditingFromTools = false; // Nueva bandera local

    // Observador de estado de autenticación de Firebase
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            setPersistenceUserId(user.uid); 
            console.log('Main-App: Usuario autenticado:', user.email, user.displayName, 'UID:', firebase.auth().currentUser.uid);
            
            if (appContainer) { 
                appContainer.style.display = 'flex'; 
            } else {
                console.error('Main-App: appContainer no encontrado en el DOM. La aplicación no se mostrará correctamente.');
                return; 
            }

            // Inicializar el canvas de Fabric.js
            initializeCanvas(mainCanvasContainer);
            // Proporcionar el canvas a las herramientas una vez creado
            initTools(canvas);
            
            // Cargar el lienzo inicial y su historial
            loadCanvasState(currentSubjectId); 
            
            // Callback para que canvas-tools actualice el estado de isTextEditingFromTools
            const isTextEditingFlagCallback = (isEditing) => {
                isTextEditingFromTools = isEditing; // Actualizar la bandera local de main-app
            };
            initializeTools(toolBtns, isTextEditingFlagCallback); 

            // Cargar documentos del panel lateral (solo los locales en esta versión)
            loadDocumentsForCurrentSubject(currentSubjectId, localFilesSection);
            updateUserStorageUsage();

            // Manejar la imagen capturada del visor de PDF si existe en sessionStorage
            const capturedImage = sessionStorage.getItem('capturedImage');
            if (capturedImage && canvas) {
                console.log('Main-App: Detectada imagen capturada de PDF en sessionStorage. Añadiendo al lienzo.');
                fabric.Image.fromURL(capturedImage, (img) => {
                    const canvasCenter = canvas.getCenter();
                    img.set({
                        left: canvasCenter.left,
                        top: canvasCenter.top,
                        originX: 'center',
                        originY: 'center',
                        scaleX: 0.5,
                        scaleY: 0.5,
                        selectable: true,
                        evented: true
                    });
                    canvas.add(img);
                    canvas.setActiveObject(img);
                    canvas.renderAll();
                    saveCanvasToHistory(); 
                    sessionStorage.removeItem('capturedImage'); 
                }, { crossOrigin: 'anonymous' });
            }

        } else {
            console.log('Main-App: Ningún usuario autenticado en el lienzo, redirigiendo a login...');
            window.location.href = 'index.html';
        }
    });

    // --- Funcionalidad de la barra superior ---
    subjectSelect.addEventListener('change', (event) => {
        const newSubjectId = event.target.value;
        const newSubjectName = event.target.options[event.target.selectedIndex].text;
        
        saveCanvasState(); 
        
        console.log('Main-App: Materia cambiada a:', newSubjectName, 'ID:', newSubjectId);
        alert(`Cambiando a la materia: ${newSubjectName}`);
        
        loadCanvasState(newSubjectId);
        loadDocumentsForCurrentSubject(newSubjectId, localFilesSection);
    });

    newSubjectBtn.addEventListener('click', async () => {
        const subjectName = prompt('Introduce el nombre de la nueva materia:');
        if (subjectName) {
            const newSubjectId = subjectName.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '');
            
            saveCanvasState();

            console.log('Main-App: Nueva materia creada:', subjectName, 'ID:', newSubjectId);
            alert(`Creando nueva materia: ${subjectName}`);
            
            const newOption = document.createElement('option');
            newOption.value = newSubjectId;
            newOption.textContent = subjectName;
            subjectSelect.appendChild(newOption);
            subjectSelect.value = newSubjectId;
            
            canvas.clear();
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            viewport.x = 0; viewport.y = 0; viewport.zoom = 1; 
            canvas.renderAll();
            saveCanvasToHistory();
            saveCanvasState();
            loadDocumentsForCurrentSubject(newSubjectId, localFilesSection);
        }
    });

    // 3. Funcionalidad del panel lateral izquierdo
    toggleSidebarLeftBtn.addEventListener('click', () => {
        sidebarLeft.classList.toggle('collapsed');
        if (sidebarLeft.classList.contains('collapsed')) {
            toggleSidebarLeftBtn.textContent = 'chevron_right';
        } else {
            toggleSidebarLeftBtn.textContent = 'chevron_left';
        }
    });

    // --- Manejo de Subida de Archivos y Documentos Locales (Delegado a DocumentManager) ---
    loadLocalDocBtn.addEventListener('click', () => {
        console.log('Main-App: Clic en botón Cargar PDF/TXT local.');
        localDocInput.click();
    });

    localDocInput.addEventListener('change', (event) => {
        console.log('Main-App: Evento change en localDocInput detectado.');
        const files = event.target.files;
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                handleLocalDocument(files[i], localFilesSection); 
            }
        } else {
            console.log('Main-App: Ningún documento local seleccionado.');
        }
        localDocInput.value = '';
    });

    // --- Manejo de Drag & Drop de Documentos al Lienzo (Delegado a DocumentManager) ---
    canvasArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        console.log('Main-App: Dragover en canvasArea. Drop permitido.');
    });

    canvasArea.addEventListener('drop', (event) => {
        event.preventDefault();
        console.log('Main-App: Drop en canvasArea detectado.');
        const data = event.dataTransfer.getData('application/json');
        
        const clientX = event.clientX;
        const clientY = event.clientY;

        if (data) {
            try {
                const fileData = JSON.parse(data);
                console.log('Main-App: Datos de archivo de panel recibidos en drop:', fileData);
                if (fileData.type === 'application/pdf' && fileData.isLocalPdf) {
                    alert('Para incrustar un PDF del panel, usa la herramienta de captura después de cargarlo en el visor. No se incrusta directamente.');
                } else if (fileData.type.startsWith('image/') || fileData.type === 'text/plain' || fileData.type.startsWith('audio/mpeg')) {
                    addDocumentToCanvas(fileData, clientX, clientY); 
                } else {
                    alert(`Tipo de archivo no soportado para incrustar directamente desde el panel: ${fileData.type}.`);
                }

            } catch (e) {
                console.error('Main-App: Error al parsear datos de drop del panel:', e);
            }
        }
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const droppedFile = event.dataTransfer.files[0];
            console.log('Main-App: Archivo arrastrado directamente al lienzo desde el escritorio:', droppedFile.name, droppedFile.type);
            
            if (droppedFile.type.startsWith('image/')) {
                uploadImageAndAddToCanvas(droppedFile, clientX, clientY);
            } else {
                alert('Arrastrar y soltar archivos directamente al lienzo (desde el escritorio) solo soporta imágenes. Usa los botones del panel izquierdo para cargar otros tipos de documento.');
            }
        }
    });



    // 6. Funcionalidad de Cerrar Sesión
    logoutBtn.addEventListener('click', async () => {
        try {
            await firebase.auth().signOut();
            console.log('Main-App: Sesión cerrada. onAuthStateChanged se encargará de la redirección.');
        } catch (error) {
            console.error('Main-App: Error al cerrar sesión:', error);
            alert('No se pudo cerrar la sesión.');
        }
    });

    // Manejo de eventos de teclado globales (para Spacebar)
    document.addEventListener('keydown', (e) => {
        // Si estamos editando texto (controlado por canvas-tools), NO interceptar la barra espaciadora
        if (isTextEditingFromTools) {
            return;
        }

        if (e.code === 'Space' && !e.repeat) { 
            if (canvas) { // Asegurarse de que canvas esté inicializado
                // La lógica de paneo está en canvas-core.js
                // Aquí solo se cambia el cursor y se previene el scroll
                canvas.defaultCursor = 'grab'; 
                canvas.hoverCursor = 'grab';
                e.preventDefault(); 
            }
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            if (canvas) { // Asegurarse de que canvas esté inicializado
                canvas.defaultCursor = 'default'; 
                canvas.hoverCursor = 'pointer';
            }
        }
    });
});

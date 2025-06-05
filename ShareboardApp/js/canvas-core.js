// js/canvas-core.js

// Exportamos la instancia del canvas para que otros módulos puedan usarla
export let canvas;
export let viewport = { x: 0, y: 0, zoom: 1 }; // Estado del viewport (posición y zoom)

// Función para inicializar el lienzo de Fabric.js
export function initializeCanvas(mainCanvasContainer) {
    if (canvas) {
        console.warn('CanvasCore: Canvas ya inicializado. Saltando inicialización duplicada.');
        return;
    }

    // Asegurarse de que el elemento canvas existe en el DOM antes de inicializar Fabric.js
    const htmlCanvasElement = document.getElementById('mainCanvas');
    if (!htmlCanvasElement) {
        console.error('CanvasCore: Elemento <canvas id="mainCanvas"> no encontrado en el DOM.');
        return; // Detener la inicialización si el elemento no está
    }

    canvas = new fabric.Canvas('mainCanvas', {
        isDrawingMode: false, // Por defecto, el selector está activo
        selection: true,
        backgroundColor: '#ffffff',
        perPixelTargetFind: true,
        targetFindTolerance: 10,
        willReadFrequently: true // Para la advertencia de rendimiento
    });

    // Inicializar un pincel por defecto (necesario incluso si no estamos dibujando)
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.width = 1; 
    canvas.freeDrawingBrush.color = '#000000';
    canvas.freeDrawingBrush.globalCompositeOperation = 'source-over';

    // --- TEST: Añadir un rectángulo para verificar interactividad ---
    const testRect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'rgba(255,0,0,0.5)', // Rojo semi-transparente
        width: 80,
        height: 80,
        selectable: true,
        evented: true
    });
    canvas.add(testRect);
    canvas.renderAll();
    console.log('CanvasCore: TEST: Rectángulo rojo añadido al lienzo. Intenta seleccionarlo y moverlo.');
    // --- FIN TEST ---

    // Función para redimensionar el canvas
    function resizeCanvas() {
        if (mainCanvasContainer) {
            const containerWidth = mainCanvasContainer.offsetWidth;
            const containerHeight = mainCanvasContainer.offsetHeight;
            canvas.setDimensions({ width: containerWidth, height: containerHeight });
            canvas.renderAll();
            console.log(`CanvasCore: Canvas redimensionado a: ${containerWidth}x${containerHeight}`);
        } else {
            console.warn('CanvasCore: mainCanvasContainer no encontrado para redimensionar el canvas.');
        }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    console.log('CanvasCore: Lienzo de Fabric.js inicializado.');

    // --- Funcionalidad de Paneo y Zoom ---
    canvas.on('mouse:wheel', function(opt) {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20; // Zoom máximo
        if (zoom < 0.1) zoom = 0.1; // Zoom mínimo

        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        
        viewport.zoom = zoom;
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });

    let isPanning = false;
    canvas.on('mouse:down', function(opt) {
        if (opt.e.altKey === true || opt.e.button === 1) { // Paneo con ALT o botón central del ratón
            if (!canvas.isDrawingMode) { 
                isPanning = true;
                canvas.selection = false;
                canvas.lastPosX = opt.e.clientX;
                canvas.lastPosY = opt.e.clientY;
                canvas.defaultCursor = 'grab';
                canvas.hoverCursor = 'grab';
            }
        }
    });

    canvas.on('mouse:move', function(opt) {
        if (isPanning) {
            const e = opt.e;
            const vpt = canvas.viewportTransform;
            vpt[4] += e.clientX - canvas.lastPosX;
            vpt[5] += e.clientY - canvas.lastPosY;
            canvas.requestRenderAll();
            canvas.lastPosX = e.clientX;
            canvas.lastPosY = e.clientY;
            viewport.x = vpt[4];
            viewport.y = vpt[5];
        }
    });

    canvas.on('mouse:up', function(opt) {
        if (isPanning) {
            isPanning = false;
            canvas.selection = true;
            if (!canvas.isDrawingMode) {
                canvas.defaultCursor = 'default';
                canvas.hoverCursor = 'pointer';
            }
        }
    });

    // Keydown/Keyup para Spacebar se manejará en main-app.js para controlar isTextEditingGlobal
    // y luego llamará a estas funciones de paneo si es necesario.

    canvas.on('mouse:down', function() {
        if (canvas.isDrawingMode) {
            canvas.defaultCursor = 'crosshair';
            canvas.hoverCursor = 'crosshair';
        } else if (!isPanning) {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'pointer';
        }
    });
    canvas.on('mouse:up', function() {
        if (!canvas.isDrawingMode && !isPanning) {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'pointer';
        }
    });
}

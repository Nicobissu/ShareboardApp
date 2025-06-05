// js/pdf-viewer-page.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('PDF Viewer Page cargado y DOM completamente cargado.');

    // Referencias a elementos del DOM del visor
    const pdfViewerCanvas = document.getElementById('pdfViewerCanvas');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfoTop = document.getElementById('pageInfoTop');
    const pageInfoBottom = document.getElementById('pageInfoBottom');
    const capturePageBtnTop = document.getElementById('capturePageBtnTop');
    const backToCanvasBtn = document.getElementById('backToCanvasBtn');
    const pdfCanvasContainer = document.querySelector('.pdf-canvas-container'); // Contenedor del canvas PDF
    const localPdfInput = document.getElementById('localPdfInput');

    let pdfDoc = null;
    let pageNum = 1;
    let pdfRenderingContext = null;
    // Aumentar la escala de resolución para mejorar la definición (ej. 2.0 o 2.5 para más nitidez)
    let pdfCanvasResolutionScale = 2.5; 

    // Establecer workerSrc para PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // Verifica si un archivo existe antes de cargarlo
    async function checkFileExists(url) {
        try {
            const resp = await fetch(url, { method: 'HEAD' });
            return resp.ok;
        } catch (e) {
            return false;
        }
    }

    // Función para cargar y renderizar el PDF
    async function loadAndRenderPdf(loadParam) {
        try {
            if (loadParam.url) {
                const exists = await checkFileExists(loadParam.url);
                if (!exists) {
                    alert('El archivo PDF no se encontró en la ruta especificada.');
                    return;
                }
            }
            pdfDoc = await pdfjsLib.getDocument(loadParam).promise;
            console.log('PDF Viewer: PDF cargado. Número de páginas:', pdfDoc.numPages);
            pageNum = 1; // Siempre empezar en la página 1 al cargar un nuevo PDF
            pageInfoTop.textContent = `Página: ${pageNum} / ${pdfDoc.numPages}`;
            pageInfoBottom.textContent = `Página: ${pageNum} / ${pdfDoc.numPages}`;
            renderPage(pageNum);
        } catch (error) {
            console.error('PDF Viewer: Error al cargar PDF:', error);
            alert('Error al cargar el PDF. Asegúrate de que es un archivo PDF válido y no está corrupto.');
            // Redirigir de vuelta al lienzo si hay un error al cargar
            window.location.href = 'canvas.html'; 
        }
    }

    // Función para renderizar una página específica del PDF
    async function renderPage(num) {
        if (!pdfDoc) return;
        pageNum = num;
        if (pageNum < 1) pageNum = 1;
        if (pageNum > pdfDoc.numPages) pageNum = pdfDoc.numPages;

        const page = await pdfDoc.getPage(pageNum);
        
        // Obtener dimensiones actuales del contenedor del visor
        const viewerWidth = pdfCanvasContainer.offsetWidth;
        const viewerHeight = pdfCanvasContainer.offsetHeight; 
        
        // Obtener el viewport original de la página con la escala de resolución deseada
        // Esto es la resolución interna a la que PDF.js renderiza la página
        const viewport = page.getViewport({ scale: pdfCanvasResolutionScale }); 

        console.log(`PDF Viewer: Viewport original (resolución interna): ${viewport.width}x${viewport.height}`);
        console.log(`PDF Viewer: Contenedor del visor: ${viewerWidth}x${viewerHeight}`);

        // Calcular la escala para ajustar la página al ancho del visor, manteniendo la proporción
        let displayScale = viewerWidth / viewport.width; 
        
        // Si la página escalada por ancho es más alta que el visor, ajustar por altura también
        // Esto asegura que la página se vea completa inicialmente sin scroll horizontal
        if (viewport.height * displayScale > viewerHeight && viewerHeight > 0) {
            console.log('PDF Viewer: Ajustando por altura también.');
            displayScale = viewerHeight / viewport.height;
        }
        
        const scaledViewport = page.getViewport({ scale: displayScale }); // Viewport final para mostrar

        console.log(`PDF Viewer: Escala de visualización calculada: ${displayScale}`);
        console.log(`PDF Viewer: Viewport final (para mostrar): ${scaledViewport.width}x${scaledViewport.height}`);

        const canvasContext = pdfViewerCanvas.getContext('2d', { willReadFrequently: true });
        
        // Ajustar el tamaño del canvas del PDF al viewport final escalado
        pdfViewerCanvas.height = scaledViewport.height;
        pdfViewerCanvas.width = scaledViewport.width;

        const renderContext = {
            canvasContext: canvasContext,
            viewport: scaledViewport // Usar el viewport final escalado
        };
        await page.render(renderContext).promise;
        pageInfoTop.textContent = `Página: ${pageNum} / ${pdfDoc.numPages}`;
        pageInfoBottom.textContent = `Página: ${pageNum} / ${pdfDoc.numPages}`;
        console.log(`PDF Viewer: Página ${pageNum} renderizada. Dimensiones del Canvas PDF: ${pdfViewerCanvas.width}x${pdfViewerCanvas.height}`);
    }

    // --- Event Listeners para Controles del Visor ---
    prevPageBtn.addEventListener('click', () => {
        if (pdfDoc && pageNum > 1) {
            renderPage(pageNum - 1);
        }
    });
    nextPageBtn.addEventListener('click', () => {
        if (pdfDoc && pageNum < pdfDoc.numPages) {
            renderPage(pageNum + 1);
        }
    });

    // Botón para volver al lienzo
    backToCanvasBtn.addEventListener('click', () => {
        window.location.href = 'canvas.html'; // Redirigir de vuelta al lienzo
    });

    // Botón para capturar la página actual del PDF
    capturePageBtnTop.addEventListener('click', () => {
        if (!pdfDoc || !pdfViewerCanvas) {
            alert('No hay un PDF cargado en el visor para capturar.');
            return;
        }
        const dataURL = pdfViewerCanvas.toDataURL('image/png');

        // Almacenar la Data URL en sessionStorage y redirigir al lienzo
        sessionStorage.setItem('capturedImage', dataURL);
        window.location.href = 'canvas.html'; // Redirigir al lienzo
    });

    // Selección de PDF local
    localPdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert('Selecciona un archivo PDF válido.');
            localPdfInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const typedArray = new Uint8Array(ev.target.result);
            loadAndRenderPdf({ data: typedArray });
        };
        reader.onerror = () => {
            alert('Error al leer el archivo seleccionado.');
        };
        reader.readAsArrayBuffer(file);
    });

    // --- Cargar el PDF al iniciar la página ---
    const pdfDataString = sessionStorage.getItem('currentPdfData');
    if (pdfDataString) {
        let objectUrlToRevoke = null;
        try {
            const pdfData = JSON.parse(pdfDataString);
            if (pdfData.type === 'ArrayBuffer') {
                const arrayBuffer = new Uint8Array(pdfData.data).buffer;
                loadAndRenderPdf({ data: arrayBuffer });
            } else if (pdfData.type === 'ObjectURL') {
                objectUrlToRevoke = pdfData.url;
                loadAndRenderPdf({ url: pdfData.url });
            } else {
                console.error('PDF Viewer: Tipo de datos de PDF no reconocido en sessionStorage.');
                alert('Error al cargar el PDF desde la sesión. Formato no reconocido.');
                window.location.href = 'canvas.html';
            }
        } catch (e) {
            console.error('PDF Viewer: Error al parsear PDF data de sessionStorage:', e);
            alert('Error al cargar el PDF desde la sesión. Datos corruptos.');
            window.location.href = 'canvas.html';
        } finally {
            sessionStorage.removeItem('currentPdfData');
            if (objectUrlToRevoke) {
                URL.revokeObjectURL(objectUrlToRevoke);
            }
        }
    } else {
        alert('No se encontró ningún PDF para mostrar. Volviendo al lienzo.');
        window.location.href = 'canvas.html';
    }

    // Ajustar el tamaño del canvas del PDF al redimensionar la ventana
    window.addEventListener('resize', () => {
        if (pdfDoc) {
            renderPage(pageNum); // Volver a renderizar la página actual con el nuevo tamaño
        }
    });
});

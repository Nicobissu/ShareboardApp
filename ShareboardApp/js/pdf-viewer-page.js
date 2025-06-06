// js/pdf-viewer-page.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('PDF Viewer Page cargado y DOM completamente cargado.');

    function base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

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
    // Aumentar la escala de resolución para mejorar la definición (ej. 2.0 o 2.5 para más nitidez)
    // Escala interna para mejorar la definición del renderizado
    // Valores mayores implican más píxeles por punto de la pantalla
    let pdfCanvasResolutionScale = 2;

    // Tarea de renderizado actual para evitar superposiciones
    let renderTask = null;

    // Establecer workerSrc para PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    // Verifica si un archivo existe antes de cargarlo
    async function checkFileExists(url) {
        // Las URLs generadas con URL.createObjectURL empiezan con "blob:" y no
        // requieren una petición adicional para verificar su existencia.
        if (url.startsWith('blob:')) {
            return true;
        }
        try {
            const resp = await fetch(url, { method: 'HEAD' });
            if (resp.ok) {
                return true;
            }
            // Algunos servidores de desarrollo (por ejemplo, extensiones que
            // sirven archivos locales) no permiten solicitudes HEAD y devuelven
            // un código 405. En ese caso asumimos que el archivo existe y
            // permitimos que PDF.js lo cargue mediante GET.
            if (resp.status === 405) {
                return true;
            }
            return false;
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

        // Cancelar cualquier render previo para evitar solapamientos
        if (renderTask) {
            renderTask.cancel();
            try {
                await renderTask.promise;
            } catch (e) {
                if (!(e instanceof pdfjsLib.RenderingCancelledException)) {
                    console.error('PDF Viewer: error al cancelar render', e);
                }
            }
        }

        pageNum = num;
        if (pageNum < 1) pageNum = 1;
        if (pageNum > pdfDoc.numPages) pageNum = pdfDoc.numPages;

        const page = await pdfDoc.getPage(pageNum);

        // Viewports para renderizado de alta resolución y visualización sin escalado CSS
        const displayViewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale: pdfCanvasResolutionScale });

        console.log(`PDF Viewer: Viewport display: ${displayViewport.width}x${displayViewport.height}`);
        console.log(`PDF Viewer: Viewport render (escala ${pdfCanvasResolutionScale}): ${renderViewport.width}x${renderViewport.height}`);

        const canvasContext = pdfViewerCanvas.getContext('2d', { willReadFrequently: true });

        // Ajustar tamaño interno para alta resolución y tamaño visual sin escalado
        pdfViewerCanvas.width = renderViewport.width;
        pdfViewerCanvas.height = renderViewport.height;
        pdfViewerCanvas.style.width = `${displayViewport.width}px`;
        pdfViewerCanvas.style.height = `${displayViewport.height}px`;

        const renderContext = {
            canvasContext: canvasContext,
            viewport: renderViewport
        };
        renderTask = page.render(renderContext);
        try {
            await renderTask.promise;
        } finally {
            renderTask = null;
        }
        pageInfoTop.textContent = `Página: ${pageNum} / ${pdfDoc.numPages}`;
        pageInfoBottom.textContent = `Página: ${pageNum} / ${pdfDoc.numPages}`;
        console.log(`PDF Viewer: Página ${pageNum} renderizada. Dimensiones del Canvas PDF: ${pdfViewerCanvas.width}x${pdfViewerCanvas.height}`);
    }

    // --- Event Listeners para Controles del Visor ---
    prevPageBtn.addEventListener('click', async () => {
        if (pdfDoc && pageNum > 1) {
            await renderPage(pageNum - 1);
        }
    });
    nextPageBtn.addEventListener('click', async () => {
        if (pdfDoc && pageNum < pdfDoc.numPages) {
            await renderPage(pageNum + 1);
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
                const arrayBuffer = base64ToArrayBuffer(pdfData.data);
                loadAndRenderPdf({ data: arrayBuffer });
            } else if (pdfData.type === 'ObjectURL') {
                objectUrlToRevoke = pdfData.url;
                loadAndRenderPdf({ url: pdfData.url });
            } else if (pdfData.type === 'URL') {
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
            renderPage(pageNum);
        }
    });
});

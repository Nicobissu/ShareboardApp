// js/document-manager.js

import { canvas } from './canvas-core.js'; // Importa el canvas
import { saveCanvasToHistory } from './canvas-history.js'; // Importa la función de historial
import { currentUserId } from './canvas-persistence.js'; // Importar ID de usuario persistente

// Asumimos que firebase.firestore() y firebase.storage() son globales o se pasan desde main-app.js
const db = firebase.firestore();
const storage = firebase.storage();

export let userStorageUsedBytes = 0; // Almacenamiento usado por el usuario en Storage
export const USER_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024; // Límite de 50 MB

// --- Funciones de Gestión de Documentos (Firebase Storage y Firestore) ---

// Función para actualizar el uso de almacenamiento del usuario
export async function updateUserStorageUsage() {
    if (!currentUserId) return;
    try {
        const userDocRef = db.collection('users').doc(currentUserId);
        const doc = await userDocRef.get();
        if (doc.exists && doc.data().totalStorageUsedBytes !== undefined) {
            userStorageUsedBytes = doc.data().totalStorageUsedBytes;
        } else {
            userStorageUsedBytes = 0;
            await userDocRef.set({ totalStorageUsedBytes: 0 }, { merge: true }); 
        }
        console.log(`DocumentManager: Uso de almacenamiento del usuario: ${(userStorageUsedBytes / (1024 * 1024)).toFixed(2)} MB de ${(USER_STORAGE_LIMIT_BYTES / (1024 * 1024)).toFixed(2)} MB`);
    }
    catch (error) {
        console.error('DocumentManager: Error al obtener uso de almacenamiento:', error);
    }
}

// Función para subir una IMAGEN a Storage y añadirla al lienzo
export async function uploadImageAndAddToCanvas(file, clientX, clientY) {
    console.log('DocumentManager: Iniciando uploadImageAndAddToCanvas para:', file.name);
    if (!currentUserId || !canvas) {
        alert('Error: usuario no autenticado o lienzo no inicializado.');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('Solo se permite subir archivos de imagen (JPG, PNG, GIF, WEBP) al lienzo.');
        return;
    }

    const MAX_FILE_SIZE_MB_CANVAS = 5; 
    if (file.size > MAX_FILE_SIZE_MB_CANVAS * 1024 * 1024) {
        alert(`La imagen '${file.name}' excede el tamaño máximo permitido de ${MAX_FILE_SIZE_MB_CANVAS} MB para incrustar.`);
        return;
    }

    if (userStorageUsedBytes + file.size > USER_STORAGE_LIMIT_BYTES) {
        alert(`Has alcanzado tu límite de almacenamiento de ${(USER_STORAGE_LIMIT_BYTES / (1024 * 1024)).toFixed(2)} MB. No se puede subir esta imagen.`);
        return;
    }

    const storageRef = storage.ref();
    const fileName = `${Date.now()}_${file.name}`; 
    const filePath = `users/${currentUserId}/files/${fileName}`; 
    const fileRef = storageRef.child(filePath);

    try {
        console.log(`DocumentManager: Subiendo imagen a Storage: ${file.name}`);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        console.log(`DocumentManager: Imagen subida a Storage. URL: ${downloadURL}`);

        userStorageUsedBytes += file.size;
        await db.collection('users').doc(currentUserId).set({ totalStorageUsedBytes: userStorageUsedBytes }, { merge: true });

        // Añadir al lienzo
        addDocumentToCanvas({ url: downloadURL, type: file.type, name: file.name }, clientX, clientY);
        
    } catch (error) {
        console.error('DocumentManager: Error al subir imagen al lienzo:', error);
        alert(`Error al subir la imagen '${file.name}': ${error.message}`);
    }
}

// Cargar documentos para la materia actual (ahora solo PDFs/TXT locales)
export async function loadDocumentsForCurrentSubject(currentSubjectId, localFilesSection) {
    if (!currentUserId) {
        console.warn('DocumentManager: loadDocumentsForCurrentSubject: No se pueden cargar documentos: usuario no autenticado.');
        return;
    }
    
    localFilesSection.innerHTML = '';
    localFilesSection.innerHTML = '<p class="empty-list-message">Carga un PDF o TXT para ver.</p>';
}

export function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('audio/')) return 'volume_up';
    if (fileType === 'application/pdf') return 'description';
    if (fileType === 'text/plain') return 'article';
    return 'attach_file';
}

// --- Funciones para arrastrar y soltar documentos al lienzo ---
export function addDocumentToCanvas(fileData, clientX, clientY) { 
    const { url, type, name, isLocalPdf } = fileData;
    
    const canvasRect = canvas.getElement().getBoundingClientRect();
    const canvasX = clientX - canvasRect.left;
    const canvasY = clientY - canvasRect.top;

    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    const x = (canvasX / zoom) - (vpt[4] / zoom);
    const y = (canvasY / zoom) - (vpt[5] / zoom);

    let objectToAdd;

    switch (type) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
            fabric.Image.fromURL(url, (img) => {
                // Escalar la imagen para que no sea demasiado grande o pequeña
                const maxCanvasWidth = canvas.width * 0.8; // 80% del ancho del canvas
                const maxCanvasHeight = canvas.height * 0.8; // 80% de la altura del canvas
                let scaleFactor = 1;

                if (img.width > maxCanvasWidth || img.height > maxCanvasHeight) {
                    scaleFactor = Math.min(maxCanvasWidth / img.width, maxCanvasHeight / img.height);
                }
                
                img.set({
                    left: x,
                    top: y,
                    originX: 'left',
                    originY: 'top',
                    scaleX: scaleFactor, 
                    scaleY: scaleFactor,
                    selectable: true,
                    evented: true
                });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                saveCanvasToHistory();
            }, { crossOrigin: 'anonymous' });
            break;
        case 'application/pdf': 
            alert('Para PDFs, no se incrustan directamente en el lienzo. Usa la herramienta de captura después de cargarlos en el visor.');
            break;
        case 'text/plain':
            const textObject = new fabric.IText(name + '\n(Haz doble clic para editar)', {
                left: x,
                top: y,
                fontFamily: 'Roboto',
                fontSize: 24,
                fill: '#000000',
                selectable: true,
                editable: true
            });
            canvas.add(textObject);
            canvas.setActiveObject(textObject);
            canvas.renderAll();
            saveCanvasToHistory();
            break;
        case 'audio/mpeg': 
        case 'audio/wav':
        case 'audio/ogg':
            const audioIcon = new fabric.IText('🎵 Audio: ' + name, {
                left: x,
                top: y,
                fontFamily: 'Roboto',
                fontSize: 20,
                fill: '#000000',
                selectable: true,
                evented: true,
                data: { url: url, type: 'audio' }
            });
            canvas.add(audioIcon);
            canvas.setActiveObject(audioIcon);
            canvas.renderAll();
            saveCanvasToHistory();
            alert('Objeto de audio añadido. En una implementación completa, esto sería un un reproductor.');
            break;
        default:
            alert(`Tipo de archivo no soportado para incrustar directamente en el lienzo: ${type}.`);
            break;
    }
}

// Exportamos la función para manejar documentos locales
export function handleLocalDocument(file, localFilesSection) {
    if (!file) return;

    const MAX_LOCAL_FILE_SIZE_MB = 10;
    if (file.size > MAX_LOCAL_FILE_SIZE_MB * 1024 * 1024) {
        alert(`El documento '${file.name}' excede el tamaño máximo permitido de ${MAX_LOCAL_FILE_SIZE_MB} MB para carga local.`);
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const fileData = e.target.result;

        const docElement = document.createElement('div');
        docElement.classList.add('document-item', 'local-doc');
        docElement.dataset.fileObject = file.type === 'application/pdf' ? 'true' : 'false';
        if (file.type !== 'application/pdf') {
            docElement.dataset.url = fileData;
        }
        docElement.dataset.type = file.type;
        docElement.dataset.name = file.name;
        docElement.draggable = true; // Hacer el elemento arrastrable
        docElement.innerHTML = `
            <span class="material-symbols-outlined">${getFileIcon(file.type)}</span>
            <p>${file.name}</p>
        `;
        docElement.addEventListener('click', () => {
            if (file.type === 'application/pdf') {
                // Guardar el ArrayBuffer del PDF en sessionStorage para evitar errores con blobs
                const byteArray = Array.from(new Uint8Array(fileData));
                sessionStorage.setItem('currentPdfData', JSON.stringify({
                    type: 'ArrayBuffer',
                    data: byteArray
                }));
                window.location.href = 'pdf-viewer-page.html'; // Redirigir a la nueva página del visor
            } else if (file.type === 'text/plain') {
                alert(`Contenido de ${file.name}:\n\n${fileData}`);
            } else {
                alert(`No hay visor integrado para este tipo de documento local: ${file.type}.`);
            }
        });

        localFilesSection.querySelector('.empty-list-message')?.remove();
        localFilesSection.appendChild(docElement);
        console.log(`DocumentManager: Documento local '${file.name}' cargado para la sesión.`);
    };

    reader.onerror = () => {
        alert('Error al leer el archivo seleccionado.');
    };

    if (file.type.startsWith('image/') || file.type === 'text/plain') {
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
    } else {
        alert('Tipo de archivo no soportado para carga local: ' + file.type);
    }
}

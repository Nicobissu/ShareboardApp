// js/document-manager.js

import { canvas } from './canvas-core.js';
import { saveCanvasToHistory } from './canvas-history.js';

// Dirección base del backend en desarrollo local
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/notas`;

export async function updateUserStorageUsage() {
    // Sin backend remoto que calcule almacenamiento
}

export async function uploadImageAndAddToCanvas(file, clientX, clientY) {
    const reader = new FileReader();
    reader.onload = () => {
        addDocumentToCanvas({ url: reader.result, type: file.type, name: file.name }, clientX, clientY);
    };
    reader.readAsDataURL(file);
}

export async function fetchServerNotes() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('error');
        return await res.json();
    } catch (e) {
        console.error('fetchServerNotes', e);
        return [];
    }
}

export async function uploadPdfNote(file, texto) {
    const formData = new FormData();
    formData.append('texto', texto);
    formData.append('pdf', file);
    try {
        await fetch(API_URL, { method: 'POST', body: formData });
        console.log('Nota subida');
    } catch (e) {
        console.error('uploadPdfNote', e);
    }
}

export async function loadDocumentsForCurrentSubject(_, localFilesSection) {
    localFilesSection.innerHTML = '<p class="empty-list-message">Cargando...</p>';
    const notes = await fetchServerNotes();
    localFilesSection.innerHTML = '';
    if (notes.length === 0) {
        localFilesSection.innerHTML = '<p class="empty-list-message">Sin documentos.</p>';
        return;
    }
    for (const note of notes) {
        const element = document.createElement('div');
        element.classList.add('document-item');
        element.dataset.fileObject = 'true';
        element.dataset.url = `${BASE_URL}/uploads/${note.pdf}`;
        element.dataset.type = 'application/pdf';
        element.dataset.name = note.texto;
        element.draggable = true;
        element.innerHTML = `<span class="material-symbols-outlined">description</span><p>${note.texto}</p>`;
        element.addEventListener('click', () => {
            sessionStorage.setItem('currentPdfData', JSON.stringify({ type: 'URL', url: element.dataset.url }));
            window.open('pdf-viewer-page.html', '_blank');
        });
        localFilesSection.appendChild(element);
    }
}

export function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('audio/')) return 'volume_up';
    if (fileType === 'application/pdf') return 'description';
    if (fileType === 'text/plain') return 'article';
    return 'attach_file';
}

export function addDocumentToCanvas(fileData, clientX, clientY) {
    const { url, type, name } = fileData;
    const rect = canvas.getElement().getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    const x = (canvasX / zoom) - (vpt[4] / zoom);
    const y = (canvasY / zoom) - (vpt[5] / zoom);

    switch (type) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/gif':
        case 'image/webp':
            fabric.Image.fromURL(url, (img) => {
                const maxW = canvas.width * 0.8;
                const maxH = canvas.height * 0.8;
                let scale = 1;
                if (img.width > maxW || img.height > maxH) {
                    scale = Math.min(maxW / img.width, maxH / img.height);
                }
                img.set({ left: x, top: y, originX: 'left', originY: 'top', scaleX: scale, scaleY: scale, selectable: true, evented: true });
                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();
                saveCanvasToHistory();
            }, { crossOrigin: 'anonymous' });
            break;
        case 'application/pdf':
            alert('Para PDFs usa el visor para capturar las páginas.');
            break;
        case 'text/plain':
            const textObject = new fabric.IText(name + '\n(Haz doble clic para editar)', { left: x, top: y, fontFamily: 'Roboto', fontSize: 24, fill: '#000', selectable: true, editable: true });
            canvas.add(textObject);
            canvas.setActiveObject(textObject);
            canvas.renderAll();
            saveCanvasToHistory();
            break;
        default:
            alert('Tipo de archivo no soportado: ' + type);
            break;
    }
}

export function handleLocalDocument(file, localFilesSection) {
    if (!file) return;
    if (file.type === 'application/pdf') {
        const objectUrl = URL.createObjectURL(file);
        const docElement = document.createElement('div');
        docElement.classList.add('document-item', 'local-doc');
        docElement.dataset.fileObject = 'false';
        docElement.dataset.type = file.type;
        docElement.dataset.name = file.name;
        docElement.draggable = true;
        docElement.innerHTML = `<span class="material-symbols-outlined">${getFileIcon(file.type)}</span><p>${file.name}</p>`;
        docElement.addEventListener('click', () => {
            sessionStorage.setItem('currentPdfData', JSON.stringify({ type: 'ObjectURL', url: objectUrl }));
            window.open('pdf-viewer-page.html', '_blank');
        });
        localFilesSection.querySelector('.empty-list-message')?.remove();
        localFilesSection.appendChild(docElement);
        const texto = prompt('Texto para la nota:', file.name) || file.name;
        uploadPdfNote(file, texto).then(() => loadDocumentsForCurrentSubject(null, localFilesSection));
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const fileData = e.target.result;
        const docElement = document.createElement('div');
        docElement.classList.add('document-item', 'local-doc');
        docElement.dataset.fileObject = 'false';
        docElement.dataset.url = fileData;
        docElement.dataset.type = file.type;
        docElement.dataset.name = file.name;
        docElement.draggable = true;
        docElement.innerHTML = `<span class="material-symbols-outlined">${getFileIcon(file.type)}</span><p>${file.name}</p>`;
        docElement.addEventListener('click', () => {
            if (file.type === 'text/plain') {
                alert(`Contenido de ${file.name}:\n\n${fileData}`);
            } else {
                alert(`No hay visor integrado para este tipo de documento local: ${file.type}.`);
            }
        });
        localFilesSection.querySelector('.empty-list-message')?.remove();
        localFilesSection.appendChild(docElement);
    };
    reader.onerror = () => { alert('Error al leer el archivo seleccionado.'); };
    if (file.type.startsWith('image/') || file.type === 'text/plain') {
        reader.readAsDataURL(file);
    } else {
        alert('Tipo de archivo no soportado para carga local: ' + file.type);
    }
}

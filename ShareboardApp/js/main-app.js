// js/main-app.js

import { initializeCanvas, canvas, viewport } from './canvas-core.js';
import { saveCanvasState, loadCanvasState, setPersistenceUserId, currentSubjectId } from './canvas-persistence.js';
import { saveCanvasToHistory, setupAutoSaveEvents } from './canvas-history.js';
import { initializeTools, initTools } from './canvas-tools.js';
import { updateUserStorageUsage, uploadImageAndAddToCanvas, loadDocumentsForCurrentSubject, handleLocalDocument, addDocumentToCanvas } from './document-manager.js';

document.addEventListener('DOMContentLoaded', () => {
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

    let isTextEditingFromTools = false;
    setPersistenceUserId(localStorage.getItem('username') || 'anon');

    if (appContainer) {
        appContainer.style.display = 'flex';
    }

    initializeCanvas(mainCanvasContainer);
    initTools(canvas);
    loadCanvasState(currentSubjectId);
    setupAutoSaveEvents();

    const isTextEditingFlagCallback = (isEditing) => { isTextEditingFromTools = isEditing; };
    initializeTools(toolBtns, isTextEditingFlagCallback);

    loadDocumentsForCurrentSubject(currentSubjectId, localFilesSection);
    updateUserStorageUsage();

    const capturedImage = sessionStorage.getItem('capturedImage');
    if (capturedImage && canvas) {
        fabric.Image.fromURL(capturedImage, (img) => {
            const center = canvas.getCenter();
            img.set({ left: center.left, top: center.top, originX: 'center', originY: 'center', scaleX: 0.5, scaleY: 0.5, selectable: true, evented: true });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            saveCanvasToHistory();
            sessionStorage.removeItem('capturedImage');
        }, { crossOrigin: 'anonymous' });
    }

    subjectSelect.addEventListener('change', (event) => {
        const newSubjectId = event.target.value;
        const newSubjectName = event.target.options[event.target.selectedIndex].text;
        saveCanvasState();
        loadCanvasState(newSubjectId);
        loadDocumentsForCurrentSubject(newSubjectId, localFilesSection);
        alert(`Cambiando a la materia: ${newSubjectName}`);
    });

    newSubjectBtn.addEventListener('click', () => {
        const subjectName = prompt('Introduce el nombre de la nueva materia:');
        if (subjectName) {
            const newSubjectId = subjectName.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '');
            saveCanvasState();
            const newOption = document.createElement('option');
            newOption.value = newSubjectId;
            newOption.textContent = subjectName;
            subjectSelect.appendChild(newOption);
            subjectSelect.value = newSubjectId;
            canvas.clear();
            canvas.setViewportTransform([1,0,0,1,0,0]);
            viewport.x = 0; viewport.y = 0; viewport.zoom = 1;
            canvas.renderAll();
            saveCanvasToHistory();
            saveCanvasState();
            loadDocumentsForCurrentSubject(newSubjectId, localFilesSection);
        }
    });

    toggleSidebarLeftBtn.addEventListener('click', () => {
        sidebarLeft.classList.toggle('collapsed');
        toggleSidebarLeftBtn.textContent = sidebarLeft.classList.contains('collapsed') ? 'chevron_right' : 'chevron_left';
    });

    loadLocalDocBtn.addEventListener('click', () => {
        localDocInput.click();
    });

    localDocInput.addEventListener('change', (event) => {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            handleLocalDocument(files[i], localFilesSection);
        }
        localDocInput.value = '';
    });

    canvasArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    canvasArea.addEventListener('drop', (event) => {
        event.preventDefault();
        const data = event.dataTransfer.getData('application/json');
        const clientX = event.clientX;
        const clientY = event.clientY;
        if (data) {
            try {
                const fileData = JSON.parse(data);
                if (fileData.type === 'application/pdf' && fileData.isLocalPdf) {
                    alert('Para incrustar un PDF del panel, usa la herramienta de captura.');
                } else if (fileData.type.startsWith('image/') || fileData.type === 'text/plain' || fileData.type.startsWith('audio/mpeg')) {
                    addDocumentToCanvas(fileData, clientX, clientY);
                } else {
                    alert('Tipo de archivo no soportado: ' + fileData.type);
                }
            } catch (e) {
                console.error('drop parse error', e);
            }
        }
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const droppedFile = event.dataTransfer.files[0];
            if (droppedFile.type.startsWith('image/')) {
                uploadImageAndAddToCanvas(droppedFile, clientX, clientY);
            } else {
                alert('Arrastra solo imágenes directamente al lienzo.');
            }
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('username');
        window.location.href = 'index.html';
    });

    document.addEventListener('keydown', (e) => {
        if (isTextEditingFromTools) return;
        if (e.code === 'Space' && !e.repeat) {
            canvas.defaultCursor = 'grab';
            canvas.hoverCursor = 'grab';
            e.preventDefault();
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            canvas.defaultCursor = 'default';
            canvas.hoverCursor = 'pointer';
        }
    });
});

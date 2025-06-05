// js/canvas-persistence.js

import { canvas, viewport } from './canvas-core.js';
import { saveCanvasToHistory, resetHistory } from './canvas-history.js';

const db = firebase.firestore();

export let currentSubjectId = 'general'; 
export let currentUserId = null; 

export async function saveCanvasState() {
    if (!currentUserId || !canvas) {
        console.warn('Persistence: No se puede guardar el lienzo: usuario no autenticado o lienzo no inicializado.');
        return;
    }
    
    const canvasJson = JSON.stringify(canvas.toJSON());
    
    try {
        const subjectDocRef = db.collection('users').doc(currentUserId).collection('subjects').doc(currentSubjectId);
        await subjectDocRef.set({
            canvasData: canvasJson,
            viewport: viewport,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Persistence: Lienzo de materia '${currentSubjectId}' guardado exitosamente.`);
    } catch (error) {
        console.error('Persistence: Error al guardar el lienzo en Firestore:', error);
    }
}

export async function loadCanvasState(subjectId) {
    if (!currentUserId || !canvas) {
        console.warn('Persistence: No se puede cargar el lienzo: usuario no autenticado o lienzo no inicializado.');
        return;
    }

    currentSubjectId = subjectId;

    try {
        const subjectDocRef = db.collection('users').doc(currentUserId).collection('subjects').doc(subjectId);
        const doc = await subjectDocRef.get();

        if (doc.exists && doc.data() && doc.data().canvasData) {
            const loadedCanvasData = doc.data().canvasData;
            const loadedViewport = doc.data().viewport || { x: 0, y: 0, zoom: 1 };
            
            canvas.clear(); 
            
            // Reiniciar historial aquí para evitar conflictos con el historial del lienzo anterior
            // No re-declarar, solo re-inicializar los arrays/punteros
            resetHistory();

            canvas.loadFromJSON(loadedCanvasData, () => {
                canvas.setViewportTransform([loadedViewport.zoom, 0, 0, loadedViewport.zoom, loadedViewport.x, loadedViewport.y]);
                viewport.x = loadedViewport.x; // Asegurar que viewport global se actualice
                viewport.y = loadedViewport.y;
                viewport.zoom = loadedViewport.zoom;
                canvas.renderAll();
                console.log(`Persistence: Lienzo de materia '${subjectId}' cargado exitosamente.`);
                saveCanvasToHistory(); 
            }, (o, object) => {
                // Callback para cada objeto cargado
            });
        } else {
            console.log(`Persistence: No hay datos guardados para la materia '${subjectId}'. Iniciando lienzo en blanco.`);
            canvas.clear();
            canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            viewport.x = 0; viewport.y = 0; viewport.zoom = 1; // Resetear viewport global
            canvas.renderAll();
            resetHistory();
            saveCanvasToHistory();
        }
    } catch (error) {
        console.error('Persistence: Error al cargar el lienzo desde Firestore:', error);
        if (error.code !== 'not-found' && !String(error).includes('fabric')) {
            let message = '';
            switch (error.code) {
                case 'permission-denied':
                    message = 'No tienes permiso para acceder a esta materia.';
                    break;
                case 'unavailable':
                    message = 'Servicio no disponible. Verifica tu conexión.';
                    break;
                default:
                    if (error.message && /network/i.test(error.message)) {
                        message = `Problema de red: ${error.message}`;
                    } else {
                        message = `Error al cargar el lienzo (${error.code || error.message}). Reiniciando...`;
                    }
                    break;
            }
            alert(message);
        }
        canvas.clear();
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        viewport.x = 0; viewport.y = 0; viewport.zoom = 1;
        canvas.renderAll();
        resetHistory();
        saveCanvasToHistory();
    }
}

export function setPersistenceUserId(userId) {
    currentUserId = userId;
}

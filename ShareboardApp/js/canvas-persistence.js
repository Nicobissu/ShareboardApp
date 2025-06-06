// js/canvas-persistence.js

// Persistencia básica usando localStorage en lugar de Firebase
import { canvas, viewport } from './canvas-core.js';
import { saveCanvasToHistory, resetHistory } from './canvas-history.js';

export let currentSubjectId = 'general';
export let currentUserId = null; // Mantener por compatibilidad

const PREFIX = 'canvas_';

export async function saveCanvasState() {
    if (!canvas) return;
    const canvasJson = JSON.stringify(canvas.toJSON());
    const data = { canvasData: canvasJson, viewport };
    localStorage.setItem(PREFIX + currentSubjectId, JSON.stringify(data));
    console.log(`Persistence: Lienzo '${currentSubjectId}' guardado en localStorage.`);
}

export async function loadCanvasState(subjectId) {
    if (!canvas) return;
    currentSubjectId = subjectId;
    const stored = localStorage.getItem(PREFIX + subjectId);
    if (stored) {
        const parsed = JSON.parse(stored);
        const loadedViewport = parsed.viewport || { x: 0, y: 0, zoom: 1 };
        canvas.clear();
        resetHistory();
        canvas.loadFromJSON(parsed.canvasData, () => {
            canvas.setViewportTransform([loadedViewport.zoom, 0, 0, loadedViewport.zoom, loadedViewport.x, loadedViewport.y]);
            viewport.x = loadedViewport.x;
            viewport.y = loadedViewport.y;
            viewport.zoom = loadedViewport.zoom;
            canvas.renderAll();
            saveCanvasToHistory();
        });
    } else {
        canvas.clear();
        canvas.setViewportTransform([1,0,0,1,0,0]);
        viewport.x = 0; viewport.y = 0; viewport.zoom = 1;
        canvas.renderAll();
        resetHistory();
        saveCanvasToHistory();
    }
}

export function setPersistenceUserId(userId) {
    currentUserId = userId;
}

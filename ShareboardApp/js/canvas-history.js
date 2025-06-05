// js/canvas-history.js

import { canvas } from './canvas-core.js'; 
import { saveCanvasState } from './canvas-persistence.js'; 

export let canvasHistory = [];
export let historyPointer = -1;
export let isRedoing = false; 

export function saveCanvasToHistory() {
    if (!canvas) {
        console.warn('History: Canvas no inicializado para guardar historial.');
        return;
    }
    if (isRedoing) {
        return; 
    }
    const json = canvas.toJSON();
    canvasHistory.splice(historyPointer + 1); 
    canvasHistory.push(json);
    historyPointer = canvasHistory.length - 1;
    console.log('History: Estado del lienzo guardado en historial. Historial:', canvasHistory.length, 'Puntero:', historyPointer);
    saveCanvasState(); 
}

export function undo() {
    if (!canvas) {
        console.warn('History: Canvas no inicializado para deshacer.');
        return;
    }
    if (historyPointer > 0) {
        isRedoing = true; 
        historyPointer--;
        const json = canvasHistory[historyPointer];
        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            isRedoing = false; 
            console.log('History: Deshacer completado. Puntero:', historyPointer);
        });
    } else {
        console.log('History: No hay más acciones para deshacer. Puntero:', historyPointer);
    }
}

export function redo() {
    if (!canvas) {
        console.warn('History: Canvas no inicializado para rehacer.');
        return;
    }
    if (historyPointer < canvasHistory.length - 1) {
        isRedoing = true; 
        historyPointer++;
        const json = canvasHistory[historyPointer];
        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            isRedoing = false; 
            console.log('History: Rehacer completado. Puntero:', historyPointer);
        });
    } else {
        console.log('History: No hay más acciones para rehacer. Puntero:', historyPointer);
    }
}

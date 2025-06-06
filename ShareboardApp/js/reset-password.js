// js/reset-password.js

// Página simplificada: solo muestra un mensaje de que la función
// no está disponible en esta versión local.
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const feedback = document.getElementById('resetPasswordFeedback');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        feedback.textContent = 'Función no disponible en la versión local.';
        feedback.classList.add('show');
    });
});

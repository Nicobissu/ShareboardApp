// js/reset-password.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const emailInput = document.getElementById('email');
    const resetPasswordButton = resetPasswordForm.querySelector('.btn-primary');
    const feedbackMessage = document.getElementById('resetPasswordFeedback');
    const emailFeedback = document.getElementById('emailFeedback'); // Para validación de email

    // Función para validar email
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            emailFeedback.textContent = 'Formato de email inválido.';
            emailFeedback.classList.add('error');
            emailFeedback.classList.remove('success');
            return false;
        }
        emailFeedback.textContent = 'Email válido ✔';
        emailFeedback.classList.remove('error');
        emailFeedback.classList.add('success');
        return true;
    }

    // Escuchador de evento para validación en tiempo real del email
    emailInput.addEventListener('input', () => {
        feedbackMessage.textContent = ''; // Limpiar mensaje de feedback
        feedbackMessage.classList.remove('show', 'success', 'error');
        validateEmail(emailInput.value);
        // Habilitar/deshabilitar botón basado solo en el formato de email
        resetPasswordButton.disabled = !emailInput.value || !validateEmail(emailInput.value); // Deshabilitar si está vacío o inválido
    });

    // Manejo del formulario de restablecimiento de contraseña
    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value;

        // Limpiar y ocultar mensajes de feedback anteriores
        feedbackMessage.textContent = '';
        feedbackMessage.classList.remove('show', 'success', 'error');

        // Validar email antes de enviar
        if (!validateEmail(email)) {
            feedbackMessage.textContent = 'Por favor, introduce un correo electrónico válido.';
            feedbackMessage.classList.add('show', 'error');
            return;
        }

        resetPasswordButton.disabled = true; // Deshabilitar botón durante el proceso
        resetPasswordButton.textContent = 'Enviando...';

        try {
            // Enviar enlace de restablecimiento de contraseña con Firebase
            await firebase.auth().sendPasswordResetEmail(email);

            // Mensaje de éxito
            feedbackMessage.textContent = 'Revisa tu correo (incluye spam) para restablecer tu contraseña.';
            feedbackMessage.classList.add('show', 'success');

            console.log('Enlace de restablecimiento enviado a:', email);

        } catch (error) {
            // Manejo de errores de Firebase
            console.error('Error al enviar enlace de restablecimiento:', error);
            let message = 'Ocurrió un error al enviar el enlace. Inténtalo de nuevo.';

            switch (error.code) {
                case 'auth/invalid-email':
                    message = 'El formato del correo electrónico no es válido.';
                    break;
                case 'auth/user-not-found':
                    message = 'No se encontró una cuenta con ese correo electrónico.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Demasiados intentos. Intenta más tarde.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Problema de conexión. Verifica tu internet e inténtalo de nuevo.';
                    break;
                default:
                    message = `Error: ${error.code || 'desconocido'}.`;
                    break;
            }
            feedbackMessage.textContent = message;
            feedbackMessage.classList.add('show', 'error');

        } finally {
            resetPasswordButton.disabled = false; // Habilitar botón de nuevo
            resetPasswordButton.textContent = 'Enviar enlace de restablecimiento'; // Restaurar texto
        }
    });

    // Inicializar el estado del botón (deshabilitado si el campo está vacío al cargar)
    resetPasswordButton.disabled = !emailInput.value;
});
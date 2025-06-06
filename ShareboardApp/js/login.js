// js/login.js

// Inicio de sesión sin Firebase. Simplemente guarda el nombre de usuario
// y redirige al lienzo.
document.addEventListener('DOMContentLoaded', () => {
    const passwordField = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('loginErrorMessage');
    const submitButton = loginForm.querySelector('.btn-primary');

    passwordToggle.addEventListener('click', () => {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        passwordToggle.textContent = type === 'password' ? '👁️' : '🔒';
    });

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const usernameOrEmail = document.getElementById('usernameOrEmail').value;
        const password = passwordField.value;

        errorMessage.textContent = '';
        errorMessage.classList.remove('show');

        if (!usernameOrEmail || !password) {
            errorMessage.textContent = 'Por favor, rellena todos los campos.';
            errorMessage.classList.add('show');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Ingresando...';

        // Guardar el nombre en localStorage para identificar al usuario
        localStorage.setItem('username', usernameOrEmail);
        window.location.href = 'canvas.html';
    });
});

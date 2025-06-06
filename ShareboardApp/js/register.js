// js/register.js

// Registro simplificado sin Firebase

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    const registerButton = registerForm.querySelector('.btn-primary');
    const errorMessage = document.getElementById('registerErrorMessage');

    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        confirmPasswordInput.setAttribute('type', type);
        passwordToggle.textContent = type === 'password' ? '👁️' : '🔒';
    });

    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const displayName = document.getElementById('displayName').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        errorMessage.textContent = '';
        errorMessage.classList.remove('show');

        if (!displayName || !email || !password || password !== confirmPassword) {
            errorMessage.textContent = 'Completa el formulario correctamente.';
            errorMessage.classList.add('show');
            return;
        }

        registerButton.disabled = true;
        registerButton.textContent = 'Creando cuenta...';

        localStorage.setItem('username', displayName);
        window.location.href = 'canvas.html';
    });
});

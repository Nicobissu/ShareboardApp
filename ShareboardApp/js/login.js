// js/login.js

// La instancia de Firebase App y Auth ya son accesibles globalmente a través de firebase-config.js
// La inicialización de Firebase se hace en firebase-config.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const passwordField = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('loginErrorMessage');
    const submitButton = loginForm.querySelector('.btn-primary');

    // Funcionalidad de mostrar/ocultar contraseña
    passwordToggle.addEventListener('click', () => {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        passwordToggle.textContent = type === 'password' ? '👁️' : '🔒'; // Cambiar el icono visualmente
    });

    // Observador de estado de autenticación de Firebase
    // Se ejecuta cada vez que el estado de autenticación cambia (login, logout, recarga de página si hay sesión)
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Si el usuario está logueado, redirigir al lienzo
            console.log('Usuario autenticado:', user.email, 'Redirigiendo al lienzo...');
            window.location.href = 'canvas.html';
        } else {
            // Si no hay usuario, y estamos en la página de login, no hacer nada (mostrar el formulario)
            console.log('No hay usuario autenticado en la página de login. Mostrando formulario.');
            // Asegurarse de que el contenedor de login esté visible si fue ocultado por alguna razón
            // Esto es redundante si body:has(.app-container) .login-container { display: none; } está en styles.css
            // pero no causa daño.
            document.querySelector('.login-container').style.display = 'flex'; 
        }
    });

    // Manejo del formulario de login al ser enviado
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar el envío por defecto del formulario

        const usernameOrEmail = document.getElementById('usernameOrEmail').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Limpiar mensajes de error anteriores y ocultarlos
        errorMessage.textContent = '';
        errorMessage.classList.remove('show');

        // Validaciones básicas de frontend (campos vacíos)
        if (!usernameOrEmail || !password) {
            errorMessage.textContent = 'Por favor, rellena todos los campos.';
            errorMessage.classList.add('show');
            return; // Detener la ejecución si hay campos vacíos
        }

        // Deshabilitar botón y cambiar texto durante el proceso
        submitButton.disabled = true;
        submitButton.textContent = 'Ingresando...';

        try {
            // Configurar la persistencia de la sesión según el checkbox "Mantener sesión iniciada"
            if (rememberMe) {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            } else {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
            }

            // Intentar iniciar sesión con Firebase Authentication
            // onAuthStateChanged se encargará de la redirección si esto es exitoso
            await firebase.auth().signInWithEmailAndPassword(usernameOrEmail, password);

            console.log('Intento de inicio de sesión enviado a Firebase. onAuthStateChanged se encargará.');

        } catch (error) {
            // Manejo de errores de Firebase
            console.error('Error durante el inicio de sesión:', error); // Mostrar el error completo en la consola
            let message = 'Ocurrió un error desconocido. Inténtalo de nuevo.'; // Mensaje por defecto

            // Determinar el mensaje de error específico según el código de error de Firebase
            switch (error.code) {
                case 'auth/invalid-email':
                    message = 'El formato del correo electrónico no es válido.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    message = 'Correo electrónico o contraseña incorrectos.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Demasiados intentos fallidos. Intenta más tarde.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Problema de conexión. Verifica tu internet e inténtalo de nuevo.';
                    break;
                default:
                    message = `Ocurrió un error al iniciar sesión. Código: ${error.code || 'desconocido'}`;
                    break;
            }
            errorMessage.textContent = message; // Mostrar el mensaje en la interfaz
            errorMessage.classList.add('show'); // Hacer visible el mensaje de error
        } finally {
            // Habilitar el botón y restaurar su texto, independientemente del resultado
            submitButton.disabled = false;
            submitButton.textContent = 'Ingresar';
        }
    });
});

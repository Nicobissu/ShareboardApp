// js/register.js

// La instancia de Firebase App y Auth ya están disponibles globalmente a través de firebase-config.js
// por la carga de firebase-app-compat.js y firebase-auth-compat.js en index.html

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const registerForm = document.getElementById('registerForm');
    const displayNameInput = document.getElementById('displayName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggle = document.getElementById('passwordToggle');
    const registerButton = registerForm.querySelector('.btn-primary');
    const registerErrorMessage = document.getElementById('registerErrorMessage');

    // Referencias a los mensajes de feedback de validación
    const displayNameFeedback = document.getElementById('displayNameFeedback');
    const emailFeedback = document.getElementById('emailFeedback');
    const passwordFeedback = document.getElementById('passwordFeedback');
    const confirmPasswordFeedback = document.getElementById('confirmPasswordFeedback');

    // Referencias a los requisitos de contraseña
    const reqLength = document.getElementById('reqLength');
    const reqUppercase = document.getElementById('reqUppercase');
    const reqNumber = document.getElementById('reqNumber');

    // Funcionalidad de mostrar/ocultar contraseña
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        confirmPasswordInput.setAttribute('type', type); // También para repetir contraseña
        passwordToggle.textContent = type === 'password' ? '👁️' : '🔒';
    });

    // Función para validar un campo
    function validateField(inputElement, feedbackElement, validationFn) {
        const isValid = validationFn(inputElement.value);
        if (isValid) {
            feedbackElement.textContent = ''; // Limpiar mensaje de error
            feedbackElement.classList.remove('error');
            feedbackElement.classList.add('success');
        } else {
            feedbackElement.classList.remove('success');
        }
        return isValid;
    }

    // Validaciones de campo
    function validateDisplayName(name) {
        const regex = /^[a-zA-Z0-9 ]{2,32}$/; // 2-32 caracteres, alfanuméricos y espacios
        if (name.length < 2 || name.length > 32) {
            displayNameFeedback.textContent = 'Debe tener entre 2 y 32 caracteres.';
            return false;
        }
        if (!regex.test(name)) {
            displayNameFeedback.textContent = 'No debe contener símbolos raros.';
            return false;
        }
        displayNameFeedback.textContent = 'Nombre válido ✔';
        return true;
    }

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            emailFeedback.textContent = 'Formato de email inválido.';
            return false;
        }
        emailFeedback.textContent = 'Email válido ✔';
        return true;
    }

    function validatePassword(password) {
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);

        hasLength ? reqLength.classList.add('valid') : reqLength.classList.remove('valid');
        hasUppercase ? reqUppercase.classList.add('valid') : reqUppercase.classList.remove('valid');
        hasNumber ? reqNumber.classList.add('valid') : reqNumber.classList.remove('valid');

        if (!hasLength || !hasUppercase || !hasNumber) {
            passwordFeedback.textContent = 'Contraseña débil. Cumple los requisitos.'; // Mensaje genérico para no dar pistas
            return false;
        }
        passwordFeedback.textContent = 'Contraseña fuerte ✔';
        return true;
    }

    function validateConfirmPassword(password, confirmPassword) {
        if (password !== confirmPassword) {
            confirmPasswordFeedback.textContent = 'Las contraseñas no coinciden.';
            return false;
        }
        confirmPasswordFeedback.textContent = 'Coinciden ✔';
        return true;
    }

    // Función para verificar si todos los campos son válidos y habilitar/deshabilitar el botón
    function checkFormValidity() {
        const isDisplayNameValid = validateField(displayNameInput, displayNameFeedback, validateDisplayName);
        const isEmailValid = validateField(emailInput, emailFeedback, validateEmail);
        const isPasswordValid = validateField(passwordInput, passwordFeedback, validatePassword);
        const isConfirmPasswordValid = validateField(confirmPasswordInput, confirmPasswordFeedback, (val) => validateConfirmPassword(passwordInput.value, val));

        // Solo habilitar el botón si todos los campos son válidos y las contraseñas coinciden
        registerButton.disabled = !(isDisplayNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid);
    }

    // Escuchadores de eventos para validación en tiempo real
    displayNameInput.addEventListener('input', () => {
        validateField(displayNameInput, displayNameFeedback, validateDisplayName);
        checkFormValidity();
    });
    emailInput.addEventListener('input', () => {
        validateField(emailInput, emailFeedback, validateEmail);
        checkFormValidity();
    });
    passwordInput.addEventListener('input', () => {
        validateField(passwordInput, passwordFeedback, validatePassword);
        validateField(confirmPasswordInput, confirmPasswordFeedback, (val) => validateConfirmPassword(passwordInput.value, val)); // Revalidar confirmación
        checkFormValidity();
    });
    confirmPasswordInput.addEventListener('input', () => {
        validateField(confirmPasswordInput, confirmPasswordFeedback, (val) => validateConfirmPassword(passwordInput.value, val));
        checkFormValidity();
    });


    // Manejo del formulario de registro
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Ejecutar validaciones finales antes del envío
        const isFormValid = validateField(displayNameInput, displayNameFeedback, validateDisplayName) &&
                            validateField(emailInput, emailFeedback, validateEmail) &&
                            validateField(passwordInput, passwordFeedback, validatePassword) &&
                            validateField(confirmPasswordInput, confirmPasswordFeedback, (val) => validateConfirmPassword(passwordInput.value, val));
        
        if (!isFormValid) {
            registerErrorMessage.textContent = 'Por favor, corrige los errores del formulario.';
            registerErrorMessage.classList.add('show');
            return;
        }

        const displayName = displayNameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        registerButton.disabled = true;
        registerButton.textContent = 'Creando cuenta...';
        registerErrorMessage.textContent = '';
        registerErrorMessage.classList.remove('show');

        try {
            // Crear usuario con email y contraseña en Firebase
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Actualizar el perfil del usuario con el nombre visible
            await user.updateProfile({
                displayName: displayName
            });

            console.log('Usuario registrado y perfil actualizado:', user);

            // Redirigir al lienzo (onAuthStateChanged en canvas.js se encargará de la redirección si no hay sesión)
            alert('¡Cuenta creada! Redirigiendo al lienzo...'); // Mensaje temporal
            window.location.href = 'canvas.html'; 

        } catch (error) {
            console.error('Error durante el registro:', error);
            let message = 'Ocurrió un error desconocido durante el registro. Inténtalo de nuevo.';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    message = 'El correo electrónico ya está registrado.';
                    break;
                case 'auth/invalid-email':
                    message = 'El formato del correo electrónico no es válido.';
                    break;
                case 'auth/weak-password':
                    message = 'La contraseña es demasiado débil.';
                    break;
                default:
                    message = `Error de registro. Código: ${error.code || 'desconocido'}`;
                    break;
            }
            registerErrorMessage.textContent = message;
            registerErrorMessage.classList.add('show');

        } finally {
            registerButton.disabled = false;
            registerButton.textContent = 'Crear cuenta';
        }
    });

    // Inicializar validación del botón al cargar la página
    checkFormValidity();
});
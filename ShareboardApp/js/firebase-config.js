// js/firebase-config.js

// Tus credenciales de Firebase. ¡Asegúrate de que sean las tuyas!
const firebaseConfig = {
  apiKey: "AIzaSyBmtf6F_WszWnZDRtywDFg2b_1LWfgMLOU",
  authDomain: "shareboardapp-2025.firebaseapp.com",
  projectId: "shareboardapp-2025",
  // Updated to use the correct Firebase Storage domain
  storageBucket: "shareboardapp-2025.appspot.com",
  messagingSenderId: "156621447130",
  appId: "1:156621447130:web:4c4dc74d96616268226ae3"
};

// Inicializar Firebase App de forma global
// Esto usa el objeto global 'firebase' que se cargó desde firebase-app-compat.js
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // Obtener la instancia de auth
// index.js (Firestore)
import { db } from "./firebase-config.js";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  aplicarTema();
  configurarEventosPassword();

  const btnLogin = document.getElementById("btn-login");
  if (btnLogin) {
    btnLogin.addEventListener("click", login);
  }
});

// 🔐 Login con Firestore
async function login(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const q = query(collection(db, "usuarios"), where("nombre", "==", username));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      alert("❌ Usuario no encontrado.");
      return;
    }

    let usuarioEncontrado = null;
    querySnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.contrasena === password) {
        usuarioEncontrado = { id: docSnap.id, ...data };
      }
    });

    if (!usuarioEncontrado) {
      alert("❌ Usuario o contraseña incorrectos.");
      return;
    }

    // Guardar usuario actual en sesión
    localStorage.setItem("usuarioActual", JSON.stringify(usuarioEncontrado));

    alert("✅ ¡Bienvenido " + usuarioEncontrado.nombre + "!");
    window.location.href = "admin.html";

  } catch (error) {
    console.error("Error en login:", error);
    alert("❌ Error al iniciar sesión.");
  }
}

// 📝 Registro en Firestore
async function register() {
  const newUser = document.getElementById("new-username").value.trim();
  const newPass = document.getElementById("new-password").value.trim();

  if (!newUser || !newPass) {
    alert("⚠️ Debes completar todos los campos.");
    return;
  }

  try {
    // Guardar solo usuario y contraseña
    await addDoc(collection(db, "usuarios"), {
      nombre: newUser,
      contrasena: newPass
    });

    alert("✅ Usuario registrado con éxito. Iniciando sesión...");
    document.getElementById("username").value = newUser;
    document.getElementById("password").value = newPass;
    toggleRegister();
  } catch (error) {
    console.error("Error registrando usuario:", error);
    alert("❌ Error al registrar usuario.");
  }
}

// Alternar entre login y registro
function toggleRegister() {
  document.getElementById("login-form").classList.toggle("oculto");
  document.getElementById("register-form").classList.toggle("oculto");
}

// Aplicar tema oscuro si está guardado
function aplicarTema() {
  const modoOscuro = localStorage.getItem("modo-oscuro") === "true";
  if (modoOscuro) {
    document.body.style.background = "#000";
    document.body.style.color = "#fff";
  }
}

// Mostrar u ocultar contraseña
function configurarEventosPassword() {
  const toggles = document.querySelectorAll(".toggle-password");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
      toggle.textContent = input.type === "password" ? "👁️" : "🙈";
    });
  });
}

// 🔓 Recuperar contraseña desde Firestore
async function recuperarContrasena() {
  const username = document.getElementById("username").value.trim();
  if (!username) {
    alert("⚠️ Escribe tu nombre de usuario para recuperar la contraseña.");
    return;
  }

  try {
    const q = query(collection(db, "usuarios"), where("nombre", "==", username));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      alert("❌ Usuario no encontrado.");
      return;
    }

    querySnap.forEach((docSnap) => {
      const datos = docSnap.data();
      alert("🔐 Tu contraseña es: " + datos.contrasena);
    });
  } catch (error) {
    console.error("Error recuperando contraseña:", error);
    alert("❌ Error al recuperar contraseña.");
  }
}

// Exponer funciones globalmente
window.register = register;
window.toggleRegister = toggleRegister;
window.recuperarContrasena = recuperarContrasena;



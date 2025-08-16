// configuraciones.js (Firestore)
import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const PERFIL_ID = "admin"; // ID fijo para el perfil de administrador en Firestore

document.addEventListener("DOMContentLoaded", async () => {
  await cargarConfiguraciones();
  configurarEventos();
  document.getElementById("ultima-sesion").textContent =
    localStorage.getItem("ultima-sesion") || "Nunca";
});

async function cargarConfiguraciones() {
  const perfilRef = doc(db, "configuracion", PERFIL_ID);
  const perfilSnap = await getDoc(perfilRef);

  if (perfilSnap.exists()) {
    const data = perfilSnap.data();

    document.getElementById("config-usuario").value = data.nombre || "";
    document.getElementById("config-tema").value = data.tema || "claro";
    document.getElementById("config-notificaciones").checked =
      data.notificaciones === true;
    document.getElementById("config-bienvenida").value =
      data.mensajeBienvenida || "";

    aplicarTema(data.tema || "claro");
  } else {
    console.warn("No hay configuración previa en Firestore.");
  }
}

function configurarEventos() {
  document
    .getElementById("config-tema")
    .addEventListener("change", async (e) => {
      await actualizarConfiguracion({ tema: e.target.value });
      aplicarTema(e.target.value);
    });

  document
    .getElementById("config-notificaciones")
    .addEventListener("change", async (e) => {
      await actualizarConfiguracion({ notificaciones: e.target.checked });
    });

  document
    .getElementById("config-bienvenida")
    .addEventListener("input", async (e) => {
      await actualizarConfiguracion({ mensajeBienvenida: e.target.value });
    });
}

function aplicarTema(tema) {
  document.body.classList.remove("claro", "oscuro");
  document.body.classList.add(tema);
}

function togglePassword() {
  const input = document.getElementById("config-password-nueva");
  input.type = input.type === "password" ? "text" : "password";
}

async function guardarConfiguraciones() {
  const perfilRef = doc(db, "configuracion", PERFIL_ID);
  const perfilSnap = await getDoc(perfilRef);
  const perfilActual = perfilSnap.exists() ? perfilSnap.data() : {};

  const nuevoUsuario = document.getElementById("config-usuario").value.trim();
  const actual = document.getElementById("config-password-actual").value.trim();
  const nueva = document.getElementById("config-password-nueva").value.trim();

  if (!nuevoUsuario || !actual) {
    alert("⚠️ Completa todos los campos obligatorios.");
    return;
  }

  if (perfilActual.contrasena && actual !== perfilActual.contrasena) {
    alert("❌ Contraseña actual incorrecta.");
    return;
  }

  await setDoc(perfilRef, {
    ...perfilActual,
    nombre: nuevoUsuario,
    contrasena: nueva !== "" ? nueva : perfilActual.contrasena,
    tema: perfilActual.tema || "claro",
    notificaciones: perfilActual.notificaciones ?? true,
    mensajeBienvenida: perfilActual.mensajeBienvenida || ""
  });

  alert("✅ Datos actualizados correctamente.");

  document.getElementById("config-password-actual").value = "";
  document.getElementById("config-password-nueva").value = "";
}

async function actualizarConfiguracion(nuevaData) {
  const perfilRef = doc(db, "configuracion", PERFIL_ID);
  await updateDoc(perfilRef, nuevaData);
}

function cerrarSesion() {
  localStorage.setItem("ultima-sesion", new Date().toLocaleString());
  alert("🚪 Sesión cerrada. Redirigiendo al inicio...");
  location.href = "index.html";
}

function sincronizar() {
  alert("🔄 Sincronización simulada.");
}

async function exportarJSON() {
  const perfilRef = doc(db, "configuracion", PERFIL_ID);
  const perfilSnap = await getDoc(perfilRef);

  if (!perfilSnap.exists()) {
    alert("⚠️ No hay datos para exportar.");
    return;
  }

  const datos = perfilSnap.data();
  const blob = new Blob([JSON.stringify(datos, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "configuracion.json";
  enlace.click();
}

async function exportarCSV() {
  const perfilRef = doc(db, "configuracion", PERFIL_ID);
  const perfilSnap = await getDoc(perfilRef);

  if (!perfilSnap.exists()) {
    alert("⚠️ No hay datos para exportar.");
    return;
  }

  const perfil = perfilSnap.data();
  const filas = [
    ["Usuario", "Contraseña"],
    [perfil.nombre || "", perfil.contrasena || ""]
  ];

  const csv = filas.map((f) => f.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "perfil.csv";
  enlace.click();
}

// Exponer funciones globalmente
window.guardarConfiguraciones = guardarConfiguraciones;
window.cerrarSesion = cerrarSesion;
window.sincronizar = sincronizar;
window.exportarJSON = exportarJSON;
window.exportarCSV = exportarCSV;
window.togglePassword = togglePassword;


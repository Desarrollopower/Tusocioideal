import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  configurarMenuLateral();
  mostrarResumenInicio();
  showSection("inicio");
});

function showSection(id) {
  document.querySelectorAll("main section").forEach((sec) => sec.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");

  if (id === "lista") mostrarClientes?.();
  if (id === "gestion") actualizarSelectClientes?.();
  if (id === "programacion") mostrarCitas?.();
}

function configurarMenuLateral() {
  document.querySelectorAll(".sidebar a").forEach((enlace) => {
    enlace.addEventListener("click", (e) => {
      e.preventDefault();
      const texto = enlace.textContent.trim().toLowerCase();

      const seccionMap = {
        clientes: "clientes",
        "informes administrativos": "informes",
        adjuntos: "adjuntos",
        "gestión de citas": "gestion",
        "programación de citas": "programacion",
        "lista de clientes": "lista",
        usuarios: "usuarios",
        configuraciones: "configuraciones",
        buscar: "buscar-cliente",
      };

      const idSeccion = seccionMap[texto];
      if (idSeccion) showSection(idSeccion);
    });
  });

  const toggleButton = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("mainContent");

  toggleButton?.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    mainContent.classList.toggle("expanded");
  });
}

async function mostrarResumenInicio() {
  // Mostrar nombre admin
  const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || {};
  document.getElementById("nombre-admin").textContent = usuarioActual.nombre || "Admin";

  // Mostrar estados de carga
  ["total-clientes", "total-citas", "total-facturas", "total-adjuntos"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "Cargando...";
  });

  try {
    const [clientesCount, citasHoyCount, facturasPendCount, adjuntosCount] = await Promise.all([
      contarClientes(),
      contarCitasHoy(),
      contarFacturasPendientes(),
      contarAdjuntosTotales(),
    ]);

    // Mostrar resultados
    document.getElementById("total-clientes").textContent = clientesCount;
    document.getElementById("total-citas").textContent = citasHoyCount;
    document.getElementById("total-facturas").textContent = facturasPendCount;
    document.getElementById("total-adjuntos").textContent = adjuntosCount;

    // Cargar últimas acciones
    await cargarUltimasAcciones();
  } catch (error) {
    console.error("Error cargando resumen de inicio:", error);
    const contenedor = document.querySelector(".tarjetas-inicio");
    if (contenedor) {
      contenedor.innerHTML = `<p style="color:#e74c3c; text-align:center;">
        Error cargando datos. Por favor intenta de nuevo.</p>`;
    }
  }
}

// Funciones para contar datos

async function contarClientes() {
  const snap = await getDocs(collection(db, "clientes"));
  return snap.size;
}

async function contarCitasHoy() {
  const hoy = new Date().toISOString().slice(0, 10);
  const q = query(collection(db, "citas"), where("fecha", "==", hoy));
  const snap = await getDocs(q);
  return snap.size;
}

async function contarFacturasPendientes() {
  const q = query(collection(db, "facturas"), where("estado", "==", "pendiente"));
  const snap = await getDocs(q);
  return snap.size;
}

async function contarAdjuntosTotales() {
  const clientesSnap = await getDocs(collection(db, "clientes"));
  let total = 0;
  clientesSnap.forEach((doc) => {
    const data = doc.data();
    if (Array.isArray(data.archivos)) {
      total += data.archivos.length;
    }
  });
  return total;
}

// Cargar últimas acciones importantes

// 🔹 Resumen mixto: últimos clientes + próximas citas
// 🔹 Resumen simple: muestra algunos clientes + próximas citas
async function cargarUltimasAcciones() {
  const lista = document.getElementById("ultimas-acciones-list");
  if (!lista) return;
  lista.innerHTML = "<li>Cargando...</li>";

  try {
    let html = "";

    // --- Clientes (mostrar 3) ---
    const clientesSnap = await getDocs(collection(db, "clientes"));
    const clientes = clientesSnap.docs.map(d => d.data()).slice(0, 3);

    clientes.forEach((c) => {
      html += `<li>👥 Cliente: <b>${c.nombre || "Sin nombre"}</b></li>`;
    });

    // --- Próximas 3 citas ---
    const hoy = new Date().toISOString().slice(0, 10);
    const citasSnap = await getDocs(collection(db, "citas"));
    const proximasCitas = citasSnap.docs
      .map((d) => d.data())
      .filter((c) => c.fecha >= hoy && c.estado === "agendado")
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
      .slice(0, 3);

    proximasCitas.forEach((c) => {
      html += `<li>📅 ${c.fecha} ${c.hora} — <b>${c.nombreCliente || "Cliente"}</b></li>`;
    });

    lista.innerHTML = html || "<li>No hay datos recientes</li>";
  } catch (error) {
    console.error("Error cargando resumen mixto:", error);
    lista.innerHTML = "<li>Error cargando resumen</li>";
  }
}

// Exportar funciones globales para que el HTML las use
window.showSection = showSection;
window.cargarClientesEnSelect = cargarClientesEnSelect;
window.mostrarCitas = mostrarCitas;
window.actualizarSelectClientes = actualizarSelectClientes;








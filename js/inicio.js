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

async function cargarUltimasAcciones() {
  const lista = document.getElementById("ultimas-acciones-list");
  if (!lista) return;
  lista.innerHTML = "<li>Cargando...</li>";

  try {
    // Últimos 5 clientes
    const qClientes = query(
      collection(db, "clientes"),
      orderBy("creadaEn", "desc"),
      limit(5)
    );
    const clientesSnap = await getDocs(qClientes);

    // Últimas 5 citas agendadas hoy
    const hoy = new Date().toISOString().slice(0, 10);
    const qCitas = query(
      collection(db, "citas"),
      where("fecha", "==", hoy),
      orderBy("creadaEn", "desc"),
      limit(5)
    );
    const citasSnap = await getDocs(qCitas);

    // Últimas 5 facturas pendientes
    const qFacturas = query(
      collection(db, "facturas"),
      where("estado", "==", "pendiente"),
      orderBy("creadaEn", "desc"),
      limit(5)
    );
    const facturasSnap = await getDocs(qFacturas);

    let html = "";

    clientesSnap.forEach((doc) => {
      const c = doc.data();
      html += `<li>🆕 Nuevo cliente: <b>${c.nombre || "Sin nombre"}</b></li>`;
    });

    citasSnap.forEach((doc) => {
      const c = doc.data();
      const fechaFmt = new Date(c.fechaHora).toLocaleString() || c.fechaHora;
      html += `<li>📅 Cita agendada para <b>${c.nombreCliente}</b> el ${fechaFmt}</li>`;
    });

    facturasSnap.forEach((doc) => {
      const f = doc.data();
      html += `<li>💳 Factura pendiente para <b>${f.nombreCliente || "Cliente"}</b> por $${f.monto || "0"}</li>`;
    });

    lista.innerHTML = html || "<li>No hay acciones recientes</li>";
  } catch (error) {
    console.error("Error cargando últimas acciones:", error);
    lista.innerHTML = "<li>Error cargando acciones recientes.</li>";
  }
}

// Exportar funciones globales para que el HTML las use
window.showSection = showSection;
window.cargarClientesEnSelect = cargarClientesEnSelect;
window.mostrarCitas = mostrarCitas;
window.actualizarSelectClientes = actualizarSelectClientes;








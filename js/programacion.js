// programacion.js - Agenda con filtro de fecha y control de citas
import { db } from "./firebase-config.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  onSnapshot, doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const citasRef = collection(db, "citas");
const clientesRef = collection(db, "clientes");

let fechaBase = new Date();
let diaSeleccionado = null;
let horaSeleccionada = null;
let idCitaSeleccionada = null;
let estadoSeleccionado = null;
let clientesCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderCabecera();
  generarAgenda();
  await cargarClientes();
  mostrarCitasTiempoReal();
});

// ====== CABECERA ======
function renderCabecera() {
  const header = document.querySelector(".agenda-header");
  header.innerHTML = `<div class="hora-vacia"></div>`;
  const primerDia = getPrimerDiaSemana(fechaBase);

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(primerDia);
    fecha.setDate(primerDia.getDate() + i);
    const nombreDia = fecha.toLocaleDateString("es-ES", { weekday: "short" });
    const numDia = fecha.getDate();
    const mes = fecha.toLocaleDateString("es-ES", { month: "short" });
    const diaDiv = document.createElement("div");
    diaDiv.className = "dia";
    diaDiv.textContent = `${nombreDia} ${numDia} ${mes}`;
    header.appendChild(diaDiv);
  }

  document.getElementById("mes-actual").textContent =
    `${primerDia.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })} - ` +
    `${new Date(primerDia.getFullYear(), primerDia.getMonth(), primerDia.getDate() + 6).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}`;
}

// 🔹 siempre usar fechaBase como primer día
function getPrimerDiaSemana(fecha) {
  return new Date(fecha);
}

// ====== CAMBIO DE SEMANA ======
document.getElementById("btn-prev-mes").addEventListener("click", () => {
  fechaBase.setDate(fechaBase.getDate() - 7); // retrocede 7 días
  renderCabecera(); generarAgenda(); mostrarCitasTiempoReal();
});
document.getElementById("btn-next-mes").addEventListener("click", () => {
  fechaBase.setDate(fechaBase.getDate() + 7); // avanza 7 días
  renderCabecera(); generarAgenda(); mostrarCitasTiempoReal();
});

// ====== FILTRO POR FECHA (nuevo botón Buscar) ======
document.querySelector(".agenda-controles button:last-child")
  .addEventListener("click", () => {
    const fechaInput = document.getElementById("fecha-inicio").value;
    if (!fechaInput) return mostrarToast("⚠️ Selecciona una fecha", "error");
    fechaBase = new Date(fechaInput);
    renderCabecera(); generarAgenda(); mostrarCitasTiempoReal();
  });

// ====== AGENDA ======
function generarAgenda() {
  const agendaBody = document.querySelector(".agenda-body");
  agendaBody.innerHTML = "";
  const horas = Array.from({ length: 12 }, (_, i) => `${7 + i}:00`);

  horas.forEach(hora => {
    const horaCell = document.createElement("div");
    horaCell.className = "hora";
    horaCell.textContent = hora;
    agendaBody.appendChild(horaCell);

    for (let dia = 0; dia < 7; dia++) {
      const bloque = document.createElement("div");
      bloque.className = "bloque";
      bloque.dataset.dia = dia;
      bloque.dataset.hora = hora;
      bloque.addEventListener("click", () => manejarClickBloque(bloque));
      bloque.addEventListener("contextmenu", e => {
        e.preventDefault();
        manejarClickDerecho(bloque);
      });
      agendaBody.appendChild(bloque);
    }
  });
}

// ====== CLIENTES ======
async function cargarClientes() {
  const snapshot = await getDocs(clientesRef);
  clientesCache = snapshot.docs.map(d => ({ id: d.data().id || d.id, nombre: d.data().nombre }));
  const select = document.getElementById("select-cliente");
  select.innerHTML = `<option value="">Seleccione un cliente</option>`;
  clientesCache.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.nombre;
    select.appendChild(opt);
  });
}

// ====== CLICK BLOQUES ======
function manejarClickBloque(bloque) {
  diaSeleccionado = parseInt(bloque.dataset.dia);
  horaSeleccionada = bloque.dataset.hora;
  idCitaSeleccionada = bloque.dataset.idCita || null;
  estadoSeleccionado = bloque.dataset.estado || null;
  abrirModal();
}
async function manejarClickDerecho(bloque) {
  if (!bloque.dataset.idCita) {
    await bloquearFranja(parseInt(bloque.dataset.dia), bloque.dataset.hora);
  } else if (bloque.dataset.estado === "bloqueado") {
    await desbloquearFranja(bloque.dataset.idCita);
  }
}

// ====== MODAL ======
function abrirModal() {
  document.getElementById("modal-cita").classList.remove("hidden");
  document.getElementById("modal-hora").textContent =
    `${["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][diaSeleccionado]} - ${horaSeleccionada}`;

  ["guardar-cita", "btn-asistio", "btn-cancelar-cita", "btn-bloquear", "btn-desbloquear"]
    .forEach(id => document.getElementById(id).classList.add("hidden"));
  document.getElementById("motivo-cancelacion-container").classList.add("hidden");

  if (!idCitaSeleccionada) {
    document.getElementById("guardar-cita").classList.remove("hidden");
    document.getElementById("label-cliente").classList.remove("hidden");
    document.getElementById("select-cliente").classList.remove("hidden");
  } else if (estadoSeleccionado === "agendado") {
    document.getElementById("btn-asistio").classList.remove("hidden");
    document.getElementById("btn-cancelar-cita").classList.remove("hidden");
    document.getElementById("btn-bloquear").classList.remove("hidden");
  } else if (estadoSeleccionado === "bloqueado") {
    document.getElementById("btn-desbloquear").classList.remove("hidden");
  }
}

// Cerrar modal
document.getElementById("cerrar-modal").addEventListener("click", cerrarModal);
window.addEventListener("click", e => { if (e.target.id === "modal-cita") cerrarModal(); });
window.addEventListener("keydown", e => { if (e.key === "Escape") cerrarModal(); });
function cerrarModal() { document.getElementById("modal-cita").classList.add("hidden"); }

// ====== BOTONES ======
document.getElementById("guardar-cita").addEventListener("click", async () => {
  const idCliente = document.getElementById("select-cliente").value;
  if (!idCliente) return mostrarToast("⚠️ Selecciona un cliente", "error");
  const cliente = clientesCache.find(c => c.id === idCliente);

  const primerDia = getPrimerDiaSemana(fechaBase);
  const fechaCita = new Date(primerDia);
  fechaCita.setDate(primerDia.getDate() + diaSeleccionado);
  const fechaISO = fechaCita.toISOString().split("T")[0];

  await addDoc(citasRef, {
    fecha: fechaISO,
    hora: horaSeleccionada,
    idCliente,
    nombreCliente: cliente.nombre,
    estado: "agendado",
    motivoCancelacion: ""
  });

  mostrarToast("✅ Cita agendada."); cerrarModal();
});
document.getElementById("btn-asistio").addEventListener("click", async () => {
  await updateDoc(doc(db, "citas", idCitaSeleccionada), { estado: "asistio" });
  mostrarToast("✔ Marcado como asistió."); cerrarModal();
});
document.getElementById("btn-cancelar-cita").addEventListener("click", () => {
  document.getElementById("motivo-cancelacion-container").classList.remove("hidden");
  document.getElementById("guardar-cita").classList.add("hidden");
  const motivoInput = document.getElementById("motivo-cancelacion");
  motivoInput.onchange = async () => {
    if (!motivoInput.value) return;
    await updateDoc(doc(db, "citas", idCitaSeleccionada), { estado: "cancelado", motivoCancelacion: motivoInput.value });
    mostrarToast("❌ Cita cancelada."); cerrarModal();
  };
});
document.getElementById("btn-bloquear").addEventListener("click", async () => {
  await updateDoc(doc(db, "citas", idCitaSeleccionada), { estado: "bloqueado" });
  mostrarToast("🔒 Franja bloqueada."); cerrarModal();
});
document.getElementById("btn-desbloquear").addEventListener("click", async () => {
  await deleteDoc(doc(db, "citas", idCitaSeleccionada));
  mostrarToast("✅ Franja desbloqueada."); cerrarModal();
});

// ====== MOSTRAR CITAS ======
function truncarTexto(t, max) { return t?.length > max ? t.slice(0, max) + "…" : t || ""; }
function mostrarCitasTiempoReal() {
  onSnapshot(citasRef, snapshot => {
    document.querySelectorAll(".bloque").forEach(b => {
      b.textContent = "";
      b.classList.remove("agendado", "asistio", "cancelado", "bloqueado");
      delete b.dataset.idCita; delete b.dataset.estado;
    });

    const primerDia = getPrimerDiaSemana(fechaBase);
    const semanaActual = Array.from({ length: 7 }, (_, i) => {
      const f = new Date(primerDia);
      f.setDate(primerDia.getDate() + i);
      return f.toISOString().split("T")[0];
    });

    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      if (!semanaActual.includes(c.fecha)) return;

      const diaIndex = semanaActual.indexOf(c.fecha);
      const bloque = document.querySelector(`.bloque[data-dia="${diaIndex}"][data-hora="${c.hora}"]`);
      if (bloque) {
        bloque.dataset.idCita = docSnap.id;
        bloque.dataset.estado = c.estado;
        if (c.estado === "agendado") {
          bloque.textContent = truncarTexto(c.nombreCliente, 8);
          bloque.title = c.nombreCliente;
          bloque.classList.add("agendado");
        } else if (c.estado === "asistio") {
          bloque.textContent = truncarTexto(c.nombreCliente, 8) + " (✔)";
          bloque.classList.add("asistio");
        } else if (c.estado === "cancelado") {
          bloque.textContent = "❌ " + truncarTexto(c.nombreCliente, 8);
          bloque.classList.add("cancelado");
        } else if (c.estado === "bloqueado") {
          bloque.style.backgroundColor = "#555";
          bloque.classList.add("bloqueado");
        }
      }
    });

    document.getElementById("resumen-citas").textContent = `Total de citas: ${snapshot.size}`;
  });
}

// ====== TOAST ======
function mostrarToast(msg, tipo = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  toast.style.backgroundColor = tipo === "error" ? "#e74c3c" : "#2ecc71";
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

// ====== FUNCIONES DE BLOQUEO ======

// 🔒 Bloquear franja horaria (sin cliente asignado)
async function bloquearFranja(dia, hora) {
  await addDoc(citasRef, {
    fecha: calcularFechaISO(dia),
    hora,
    estado: "bloqueado"
  });
  mostrarToast("🔒 Franja bloqueada.");
}

// 🔓 Desbloquear franja
async function desbloquearFranja(idCita) {
  await deleteDoc(doc(db, "citas", idCita));
  mostrarToast("✅ Franja desbloqueada.");
}

// 🔹 Utilidad para calcular la fecha ISO de un día relativo a fechaBase
function calcularFechaISO(diaIndex) {
  const primerDia = getPrimerDiaSemana(fechaBase);
  const fecha = new Date(primerDia);
  fecha.setDate(primerDia.getDate() + diaIndex);
  return fecha.toISOString().split("T")[0];
}










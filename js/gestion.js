import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const gestionForm = document.querySelector("#form-cita");
  const selectClientes = document.getElementById("select-clientes");
  const listaGestiones = document.getElementById("lista-gestiones");
  const botonEnviar = gestionForm.querySelector("button[type='submit']");

  // 1️⃣ Cargar clientes en el select
  async function cargarClientesEnSelect() {
    selectClientes.innerHTML = `<option value="">-- Selecciona un cliente --</option>`;
    try {
      const snapshot = await getDocs(collection(db, "clientes"));
      snapshot.forEach((docSnap) => {
        const cliente = docSnap.data();
        const option = document.createElement("option");
        option.value = docSnap.id; // Guardamos el ID del cliente
        option.textContent = cliente.nombre || "Cliente sin nombre";
        selectClientes.appendChild(option);
      });
    } catch (error) {
      console.error("❌ Error cargando clientes:", error);
      mostrarToast("Error cargando clientes", "error");
    }
  }
  cargarClientesEnSelect();

  // 2️⃣ Mostrar gestiones del cliente seleccionado
  selectClientes.addEventListener("change", async () => {
    const clienteId = selectClientes.value;
    listaGestiones.innerHTML = "Cargando gestiones...";
    if (!clienteId) {
      listaGestiones.innerHTML = "";
      return;
    }
    try {
      const q = query(collection(db, "gestion"), where("clienteId", "==", clienteId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        listaGestiones.innerHTML = "No hay gestiones para este cliente.";
        return;
      }
      let html = "<ul>";
      snapshot.forEach((doc) => {
        const data = doc.data();
        html += `<li><b>${data.fechaHora}</b> - ${data.motivo} - Estado: ${data.estado || 'pendiente'}</li>`;
      });
      html += "</ul>";
      listaGestiones.innerHTML = html;
    } catch (error) {
      console.error("Error cargando gestiones del cliente:", error);
      listaGestiones.innerHTML = "Error cargando gestiones.";
    }
  });

  // 3️⃣ Guardar gestión en Firestore
  if (gestionForm) {
    gestionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const clienteId = selectClientes.value;
      const fechaHora = gestionForm.querySelector("input[type='datetime-local']").value;
      const motivo = gestionForm.querySelector("#motivo-cita").value.trim();
      const detalleAyuda = gestionForm.querySelector("#detalle-ayuda").value.trim();

      if (!clienteId || !fechaHora || !motivo || !detalleAyuda) {
        mostrarToast("⚠️ Completa todos los campos.", "error");
        return;
      }

      // Validar que la fecha sea futura
      const ahora = new Date();
      const fechaSeleccionada = new Date(fechaHora);
      if (fechaSeleccionada < ahora) {
        mostrarToast("⚠️ La fecha y hora deben ser futuras.", "error");
        return;
      }

      botonEnviar.disabled = true;
      botonEnviar.textContent = "Guardando...";

      try {
        // Obtener nombre del cliente
        const clienteDoc = await getDoc(doc(db, "clientes", clienteId));
        if (!clienteDoc.exists()) {
          mostrarToast("❌ Cliente no encontrado.", "error");
          botonEnviar.disabled = false;
          botonEnviar.textContent = "Guardar Gestión";
          return;
        }
        const clienteData = clienteDoc.data();

        // Guardar gestión
        await addDoc(collection(db, "gestion"), {
          clienteId,
          nombreCliente: clienteData.nombre,
          fechaHora,
          motivo,
          detalleAyuda,
          fecha: fechaHora.split("T")[0], // para consultas rápidas
          estado: "pendiente",
          creadaEn: new Date().toISOString(),
        });

        mostrarToast("✅ Gestión guardada exitosamente.");
        gestionForm.reset();
        listaGestiones.innerHTML = "";
        cargarClientesEnSelect(); // actualizar por si hay cambios

      } catch (error) {
        console.error("❌ Error guardando gestión:", error);
        mostrarToast("❌ No se pudo guardar la gestión.", "error");
      } finally {
        botonEnviar.disabled = false;
        botonEnviar.textContent = "Guardar Gestión";
      }
    });
  }
});

// Toast reutilizable con manejo de timeout
let toastTimeout;
function mostrarToast(mensaje, tipo = "ok") {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.className = "toast show";
  toast.style.backgroundColor = tipo === "error" ? "#e74c3c" : "#2ecc71";

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}






 

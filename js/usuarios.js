// usuarios.js
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  cargarClientesEnSelectUsuarios();

  const select = document.getElementById("clienteSelect");
  const form = document.getElementById("form-gestion-usuario");
  const eliminarBtn = document.getElementById("eliminarClienteBtn");

  if (select) {
    select.addEventListener("change", mostrarDatosCliente);
  }
  if (form) {
    form.addEventListener("submit", guardarCambiosCliente);
  }
  if (eliminarBtn) {
    eliminarBtn.addEventListener("click", eliminarCliente);
  }
});

let clientesFirebase = []; // Guardaremos los clientes para referencia

async function cargarClientesEnSelectUsuarios() {
  try {
    const clientesRef = collection(db, "clientes");
    const snapshot = await getDocs(clientesRef);

    clientesFirebase = [];
    const select = document.getElementById("clienteSelect");
    if (!select) return;

    select.innerHTML = `<option value="">-- Selecciona un cliente --</option>`;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      clientesFirebase.push({ id: docSnap.id, ...data });

      const option = document.createElement("option");
      option.value = docSnap.id; // guardamos el ID real
      option.textContent = data.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("❌ Error cargando clientes:", error);
  }
}

function mostrarDatosCliente() {
  const idSeleccionado = document.getElementById("clienteSelect").value;
  const cliente = clientesFirebase.find(c => c.id === idSeleccionado);

  const nombrePerfil = document.getElementById("nombre-usuario");
  const form = document.getElementById("form-gestion-usuario");

  if (!cliente) {
    nombrePerfil.textContent = "Nombre del Cliente";
    form.reset();
    return;
  }

  document.getElementById("nombreInput").value = cliente.nombre || "";
  document.getElementById("empresaInput").value = cliente.empresa || "";
  document.getElementById("nitInput").value = cliente.nit || "";
  document.getElementById("correoInput").value = cliente.correo || "";
  document.getElementById("telefonoInput").value = cliente.telefono || "";
  document.getElementById("estadoInput").value = cliente.estado || "activo";

  nombrePerfil.textContent = cliente.nombre;
}

async function guardarCambiosCliente(e) {
  e.preventDefault();

  const idSeleccionado = document.getElementById("clienteSelect").value;
  if (!idSeleccionado) {
    alert("Selecciona un cliente primero.");
    return;
  }

  try {
    const clienteRef = doc(db, "clientes", idSeleccionado);
    await updateDoc(clienteRef, {
      nombre: document.getElementById("nombreInput").value.trim(),
      empresa: document.getElementById("empresaInput").value.trim(),
      nit: document.getElementById("nitInput").value.trim(),
      correo: document.getElementById("correoInput").value.trim(),
      telefono: document.getElementById("telefonoInput").value.trim(),
      estado: document.getElementById("estadoInput").value
    });

    showToast("✅ Cliente actualizado con éxito.");
    await cargarClientesEnSelectUsuarios();
  } catch (error) {
    console.error("❌ Error actualizando cliente:", error);
    showToast("❌ Error actualizando cliente.");
  }
}

async function eliminarCliente() {
  const idSeleccionado = document.getElementById("clienteSelect").value;
  if (!idSeleccionado) {
    alert("Selecciona un cliente primero.");
    return;
  }

  if (!confirm(`¿Seguro que deseas eliminar a este cliente?`)) return;

  try {
    await deleteDoc(doc(db, "clientes", idSeleccionado));
    document.getElementById("form-gestion-usuario").reset();
    document.getElementById("nombre-usuario").textContent = "Nombre del Cliente";
    await cargarClientesEnSelectUsuarios();
    showToast("🗑️ Cliente eliminado.");
  } catch (error) {
    console.error("❌ Error eliminando cliente:", error);
    showToast("❌ Error eliminando cliente.");
  }
}

function showToast(mensaje) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = mensaje;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}





// js/busqueda.js
import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy, startAt, endAt } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  cargarClientesTabla();
  configurarCerrarModal();
});

// Cargar todos los clientes en la tabla
async function cargarClientesTabla() {
  const tbody = document.querySelector("#tabla-clientes tbody");
  tbody.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "clientes"));
    if (snapshot.empty) {
      tbody.innerHTML = "<tr><td colspan='5'>No hay clientes registrados</td></tr>";
      return;
    }

    let index = 1;
    snapshot.forEach(docSnap => {
      const cliente = docSnap.data();
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${index++}</td>
        <td>${cliente.nombre}</td>
        <td>${cliente.empresa || ""}</td>
        <td>${cliente.nit || ""}</td>
        <td><button onclick='mostrarModalDesdeCliente(${JSON.stringify(cliente)})'>🔍 Ver</button></td>
      `;
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("❌ Error cargando clientes:", error);
  }
}

// Mostrar modal con info del cliente
window.mostrarModalDesdeCliente = function (cliente) {
  if (!cliente) return;

  document.querySelector(".modal-nombre").textContent = cliente.nombre;
  document.querySelector(".modal-correo").textContent = cliente.correo || "";
  document.querySelector(".modal-telefono").textContent = cliente.telefono || "";
  document.querySelector(".modal-direccion").textContent = cliente.direccion || "";
  document.querySelector(".modal-empresa").textContent = cliente.empresa || "";
  document.querySelector(".modal-nit").textContent = cliente.nit || "";

  document.getElementById("modal-cliente").style.display = "block";
};

// Configuración para cerrar modal
function configurarCerrarModal() {
  document.querySelector(".cerrar-modal").addEventListener("click", () => {
    document.getElementById("modal-cliente").style.display = "none";
  });

  // Cerrar al hacer clic fuera
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("modal-cliente");
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Buscar clientes en Firestore
document.getElementById("busqueda-cliente").addEventListener("input", async (e) => {
  const texto = e.target.value.trim().toLowerCase();
  const tbody = document.querySelector("#tabla-clientes tbody");
  tbody.innerHTML = "";

  if (texto === "") {
    cargarClientesTabla();
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "clientes"));
    const resultados = [];
    snapshot.forEach(docSnap => {
      const cliente = docSnap.data();
      if (
        cliente.nombre.toLowerCase().includes(texto) ||
        (cliente.empresa && cliente.empresa.toLowerCase().includes(texto))
      ) {
        resultados.push(cliente);
      }
    });

    if (resultados.length === 0) {
      tbody.innerHTML = "<tr><td colspan='5'>No se encontraron clientes</td></tr>";
      return;
    }

    resultados.forEach((cliente, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${index + 1}</td>
        <td>${cliente.nombre}</td>
        <td>${cliente.empresa || ""}</td>
        <td>${cliente.nit || ""}</td>
        <td><button onclick='mostrarModalDesdeCliente(${JSON.stringify(cliente)})'>🔍 Ver</button></td>
      `;
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("❌ Error buscando clientes:", error);
  }
});


// informes.js (Firestore + archivos en base64)
import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  cargarClientesEnSelect("clientes-informes");

  document.getElementById("btn-generar-informe")
    .addEventListener("click", mostrarArchivosCliente);
});

// 🔹 Cargar clientes en el select desde Firestore
async function cargarClientesEnSelect(idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  select.innerHTML = `<option value="">-- Selecciona un cliente --</option>`;

  const snapshot = await getDocs(collection(db, "clientes"));
  snapshot.forEach((docSnap) => {
    const cliente = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id; // usamos ID real
    option.textContent = cliente.nombre;
    select.appendChild(option);
  });
}

// 🔹 Mostrar archivos del cliente
async function mostrarArchivosCliente() {
  const clienteId = document.getElementById("clientes-informes").value;
  const fechaFiltro = document.getElementById("filtrar-fecha-informe").value;
  const contenedor = document.getElementById("resultado-informes");

  contenedor.innerHTML = "";

  if (!clienteId) {
    contenedor.innerHTML = "<p class='info'>❗ Debes seleccionar un cliente.</p>";
    return;
  }

  // Buscar cliente en Firestore
  const snapshot = await getDocs(collection(db, "clientes"));
  let cliente = null;
  snapshot.forEach((docSnap) => {
    if (docSnap.id === clienteId) {
      cliente = { id: docSnap.id, ...docSnap.data() };
    }
  });

  if (!cliente) {
    contenedor.innerHTML = "<p class='info'>❌ Cliente no encontrado.</p>";
    return;
  }

  if (!cliente.archivos || cliente.archivos.length === 0) {
    contenedor.innerHTML = `<p class='info'>📭 El cliente <strong>${cliente.nombre}</strong> no tiene archivos subidos.</p>`;
    return;
  }

  const archivosFiltrados = cliente.archivos
    .map((archivo, index) => ({ ...archivo, index }))
    .filter(({ fecha }) => {
      if (!fechaFiltro) return true;
      const partes = fecha.split(",")[0].split("/");
      const fechaFormateada = `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
      return fechaFormateada === fechaFiltro;
    });

  if (archivosFiltrados.length === 0) {
    contenedor.innerHTML = `<p class='info'>📅 No hay archivos para la fecha seleccionada.</p>`;
    return;
  }

  const html = archivosFiltrados.map(({ nombreArchivo, descripcion, fecha, index }) => `
    <div class="archivo-card">
      <div class="archivo-info">
        <h3>${nombreArchivo}</h3>
        <p><strong>Descripción:</strong> ${descripcion}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
      </div>
      <div class="acciones">
        <button onclick="descargarArchivo('${cliente.id}', ${index})">⬇️ Descargar</button>
        <button onclick="eliminarArchivo('${cliente.id}', ${index})">🗑️ Eliminar</button>
      </div>
    </div>
  `).join("");

  contenedor.innerHTML = `
    <h3>Archivos de <strong>${cliente.nombre}</strong></h3>
    <div class="lista-archivos">${html}</div>
  `;
}

// 🔹 Descargar archivo desde base64
window.descargarArchivo = async function (clienteId, indexArchivo) {
  const snapshot = await getDocs(collection(db, "clientes"));
  let archivo = null;

  snapshot.forEach((docSnap) => {
    if (docSnap.id === clienteId) {
      archivo = docSnap.data().archivos[indexArchivo];
    }
  });

  if (!archivo) {
    alert("❌ Archivo no encontrado.");
    return;
  }

  const link = document.createElement("a");
  link.href = archivo.base64;
  link.download = archivo.nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 🔹 Eliminar archivo de Firestore
window.eliminarArchivo = async function (clienteId, indexArchivo) {
  if (!confirm("¿Seguro que quieres eliminar este archivo?")) return;

  const snapshot = await getDocs(collection(db, "clientes"));
  let cliente = null;

  snapshot.forEach((docSnap) => {
    if (docSnap.id === clienteId) {
      cliente = { id: docSnap.id, ...docSnap.data() };
    }
  });

  if (!cliente) return;

  cliente.archivos.splice(indexArchivo, 1);

  await updateDoc(doc(db, "clientes", clienteId), {
    archivos: cliente.archivos
  });

  mostrarArchivosCliente();
};

// js/facturacion.js
import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  cargarClientesFacturacion();
  mostrarFacturas();

  document.getElementById("factura-cliente")?.addEventListener("change", mostrarEmpresaCliente);

  document.getElementById("form-factura")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await guardarFactura();
  });

  document.getElementById("filtro-buscar")?.addEventListener("click", aplicarFiltros);
  document.getElementById("filtro-limpiar")?.addEventListener("click", () => {
    document.getElementById("filtro-cliente").value = "";
    document.getElementById("filtro-estado").value = "";
    document.getElementById("filtro-fecha").value = "";
    mostrarFacturas();
  });
});

// 📌 Cargar clientes desde la colección "clientes"
async function cargarClientesFacturacion() {
  const select = document.getElementById("factura-cliente");
  select.innerHTML = `<option value="">-- Selecciona un cliente --</option>`;

  try {
    const snapshot = await getDocs(collection(db, "clientes"));
    snapshot.forEach(docSnap => {
      const cliente = docSnap.data();
      const option = document.createElement("option");
      option.value = JSON.stringify({ id: docSnap.id, nombre: cliente.nombre, empresa: cliente.empresa || "" });
      option.textContent = cliente.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("❌ Error cargando clientes:", error);
  }
}

function mostrarEmpresaCliente() {
  const data = document.getElementById("factura-cliente").value;
  if (!data) {
    document.getElementById("factura-empresa").value = "";
    return;
  }
  const cliente = JSON.parse(data);
  document.getElementById("factura-empresa").value = cliente.empresa || "";
}

// 📌 Guardar factura en Firebase y LocalStorage
async function guardarFactura() {
  const clienteData = document.getElementById("factura-cliente").value;
  if (!clienteData) {
    alert("⚠️ Selecciona un cliente.");
    return;
  }
  const cliente = JSON.parse(clienteData);

  const empresa = document.getElementById("factura-empresa").value;
  const fecha = document.getElementById("factura-fecha").value;
  const fechaLimite = document.getElementById("factura-limite").value;
  const servicio = document.getElementById("factura-servicio").value;
  const valor = parseFloat(document.getElementById("factura-valor").value) || 0;
  const total = parseFloat(document.getElementById("factura-total").value) || 0;
  const estado = document.getElementById("factura-estado").value;

  if (!empresa || !fecha || !fechaLimite || !servicio || valor <= 0 || total <= 0) {
    alert("⚠️ Completa todos los campos correctamente.");
    return;
  }

  const nuevaFactura = {
    clienteId: cliente.id,
    clienteNombre: cliente.nombre,
    empresa,
    fecha,
    fechaLimite,
    servicio,
    valor,
    total,
    estado
  };

  try {
    // 🔹 Guardar en Firebase
    const docRef = await addDoc(collection(db, "facturas"), nuevaFactura);

    // 🔹 Guardar en LocalStorage con el ID de Firebase
    nuevaFactura.id = docRef.id;
    const facturasLocal = JSON.parse(localStorage.getItem("facturas")) || [];
    facturasLocal.push(nuevaFactura);
    localStorage.setItem("facturas", JSON.stringify(facturasLocal));

    alert("✅ Factura guardada en Firebase y LocalStorage.");
    document.getElementById("form-factura").reset();
    mostrarFacturas();
  } catch (error) {
    console.error("❌ Error guardando factura:", error);
  }
}

// 📌 Mostrar facturas desde LocalStorage
function mostrarFacturas() {
  const tbody = document.querySelector("#tabla-facturas tbody");
  tbody.innerHTML = "";

  const facturas = JSON.parse(localStorage.getItem("facturas")) || [];

  facturas.forEach((factura, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${factura.clienteNombre}</td>
      <td>${factura.empresa}</td>
      <td>${factura.fecha}</td>
      <td>${factura.fechaLimite || "No definida"}</td>
      <td>${factura.servicio}</td>
      <td>$${factura.valor.toLocaleString()}</td>
      <td>$${factura.total.toLocaleString()}</td>
      <td>${factura.estado === "pagado" ? "✅ Pagado" : "⏳ Pendiente"}</td>
      <td>
        <button onclick="editarEstado('${factura.id}')">✏️</button>
        <button onclick='generarFacturaPDF(${JSON.stringify(factura)})'>📄 PDF</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 📌 Editar estado (Pagado/Pendiente) en Firebase y LocalStorage
window.editarEstado = async function (id) {
  let facturas = JSON.parse(localStorage.getItem("facturas")) || [];
  const facturaIndex = facturas.findIndex(f => f.id === id);

  if (facturaIndex === -1) {
    alert("❌ Factura no encontrada en LocalStorage.");
    return;
  }

  const estadoActual = facturas[facturaIndex].estado;
  const nuevoEstado = estadoActual === "pagado" ? "pendiente" : "pagado";

  // Actualizar en LocalStorage
  facturas[facturaIndex].estado = nuevoEstado;
  localStorage.setItem("facturas", JSON.stringify(facturas));

  // Actualizar en Firebase
  try {
    await updateDoc(doc(db, "facturas", id), { estado: nuevoEstado });
  } catch (error) {
    console.error("⚠️ No se pudo actualizar en Firebase:", error);
  }

  mostrarFacturas();
};

// 📌 Filtrar facturas en LocalStorage
function aplicarFiltros() {
  const clienteFiltro = document.getElementById("filtro-cliente").value.trim().toLowerCase();
  const estadoFiltro = document.getElementById("filtro-estado").value;
  const fechaFiltro = document.getElementById("filtro-fecha").value;

  const facturas = JSON.parse(localStorage.getItem("facturas")) || [];
  const filtradas = facturas.filter(f => {
    const coincideCliente = clienteFiltro === "" || f.clienteNombre.toLowerCase().includes(clienteFiltro);
    const coincideEstado = estadoFiltro === "" || f.estado === estadoFiltro;
    const coincideFecha = fechaFiltro === "" || f.fecha === fechaFiltro;
    return coincideCliente && coincideEstado && coincideFecha;
  });

  mostrarFacturasFiltradas(filtradas);
}

function mostrarFacturasFiltradas(lista) {
  const tbody = document.querySelector("#tabla-facturas tbody");
  tbody.innerHTML = "";

  lista.forEach((factura, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${factura.clienteNombre}</td>
      <td>${factura.empresa}</td>
      <td>${factura.fecha}</td>
      <td>${factura.fechaLimite || "No definida"}</td>
      <td>${factura.servicio}</td>
      <td>$${factura.valor.toLocaleString()}</td>
      <td>$${factura.total.toLocaleString()}</td>
      <td>${factura.estado === "pagado" ? "✅ Pagado" : "⏳ Pendiente"}</td>
      <td>
        <button onclick="editarEstado('${factura.id}')">✏️</button>
        <button onclick='generarFacturaPDF(${JSON.stringify(factura)})'>📄 PDF</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 📌 Exportar a Excel
window.exportarExcel = function () {
  const table = document.getElementById("tabla-facturas");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Facturas" });
  XLSX.writeFile(wb, "facturas.xlsx");
};

// 📌 Generar PDF desde LocalStorage usando logo de carpeta
window.generarFacturaPDF = function (factura) {
  const { jsPDF } = window.jspdf;
  const docPDF = new jsPDF();

  const img = new Image();
  img.src = "logo-tu-socio-ideal.png"; // Debe estar en la misma carpeta que el HTML
  img.onload = () => {
    docPDF.addImage(img, "PNG", 10, 10, 30, 30);

    docPDF.setFontSize(18);
    docPDF.text("FACTURA DE COBRO", 105, 20, null, null, "center");

    docPDF.setFontSize(11);
    docPDF.text("Tu Socio Ideal S.A.S", 50, 35);
    docPDF.text("NIT: 900123456-7", 50, 42);
    docPDF.text("Cuenta: 123-456789-01 Banco de Colombia", 50, 49);
    docPDF.text("Tel: +57 300 123 4567 | contacto@tusocioideal.com", 50, 56);
    docPDF.line(10, 60, 200, 60);

    docPDF.setFontSize(12);
    docPDF.text(`Cliente: ${factura.clienteNombre}`, 10, 70);
    docPDF.text(`Empresa: ${factura.empresa}`, 10, 78);
    docPDF.text(`Fecha Facturación: ${factura.fecha}`, 10, 86);
    docPDF.text(`Fecha Límite de Pago: ${factura.fechaLimite || "No definida"}`, 10, 94);

    docPDF.text("Servicios Prestados:", 10, 106);
    docPDF.text(factura.servicio, 10, 114);
    docPDF.text(`Valor Unitario: $${factura.valor.toLocaleString()}`, 10, 126);

    docPDF.setFillColor(255, 230, 230);
    docPDF.rect(10, 133, 80, 12, "F");
    docPDF.setFontSize(14);
    docPDF.setTextColor(200, 0, 0);
    docPDF.text(`TOTAL A PAGAR: $${factura.total.toLocaleString()}`, 12, 141);

    docPDF.setTextColor(0, 0, 0);
    docPDF.text(`Estado de Pago: ${factura.estado === "pagado" ? "Pagado" : "Pendiente"}`, 10, 158);

    docPDF.text(`Estimado/a ${factura.clienteNombre}, agradecemos su preferencia.`, 10, 172);
    docPDF.text(`Por favor, realice el pago antes de la fecha indicada.`, 10, 180);

    docPDF.line(10, 200, 60, 200);
    docPDF.text("Firma Autorizada", 15, 206);
    docPDF.text("Tu Socio Ideal S.A.S", 15, 212);

    docPDF.save(`Factura-${factura.clienteNombre}.pdf`);
  };

  img.onerror = () => {
    alert("❌ No se pudo cargar el logo. Asegúrate de que el archivo 'logo-tu-socio-ideal.png' esté en la carpeta correcta.");
  };
};

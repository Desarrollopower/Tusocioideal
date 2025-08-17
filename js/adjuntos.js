// adjuntos.js (Firestore guardando en base64)
import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  cargarClientesEnSelect("clientes-adjuntos");

  const subirBtn = document.querySelector("#adjuntos button");
  if (subirBtn) {
    subirBtn.addEventListener("click", subirArchivo);
  }
});

// 🔹 Cargar clientes en el select
async function cargarClientesEnSelect(idSelect) {
  const select = document.getElementById(idSelect);
  if (!select) return;

  select.innerHTML = `<option value="">-- Selecciona un cliente --</option>`;

  const snapshot = await getDocs(collection(db, "clientes"));
  snapshot.forEach((docSnap) => {
    const cliente = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = cliente.nombre;
    select.appendChild(option);
  });
}

// 🔹 Subir archivo en base64
async function subirArchivo() {
  const select = document.getElementById("clientes-adjuntos");
  const clienteId = select.value;
  const archivo = document.getElementById("archivo").files[0];
  const descripcion = document.getElementById("descripcion-archivo").value.trim();
  const mensaje = document.getElementById("mensaje-subida");

  if (!clienteId || !archivo || descripcion === "") {
    mensaje.textContent = "⚠️ Debes completar todos los campos.";
    mensaje.style.color = "red";
    return;
  }

  if (archivo.size > 800 * 1024) { // 800 KB
  mensaje.textContent = "⚠️ El archivo es demasiado grande (máx 800KB).";
  mensaje.style.color = "red";
  return;
}

  try {
    // Convertir archivo a base64
    const base64 = await convertirArchivoBase64(archivo);

    // Guardar en Firestore
    const clienteDocRef = doc(db, "clientes", clienteId);
    await updateDoc(clienteDocRef, {
      archivos: arrayUnion({
        nombreArchivo: archivo.name,
        descripcion,
        base64,
        fecha: new Date().toLocaleString()
      })
    });

    mensaje.textContent = `✅ Archivo "${archivo.name}" guardado correctamente.`;
    mensaje.style.color = "green";

    document.getElementById("archivo").value = "";
    document.getElementById("descripcion-archivo").value = "";
  } catch (error) {
    console.error("Error guardando archivo:", error);
    mensaje.textContent = "❌ Error guardando el archivo.";
    mensaje.style.color = "red";
  }
}

// 📌 Convertir archivo a base64
function convertirArchivoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(archivo);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}








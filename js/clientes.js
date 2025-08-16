import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const clienteForm = document.querySelector("#clientes form");

  if (clienteForm) {
    clienteForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = clienteForm.querySelector("input[placeholder='Nombre completo']").value.trim();
      const correo = clienteForm.querySelector("input[placeholder='Correo electrónico']").value.trim();
      const telefono = clienteForm.querySelector("input[placeholder='Teléfono']").value.trim();
      const empresa = clienteForm.querySelector("input[placeholder='Nombre de la empresa']").value.trim();
      const nit = clienteForm.querySelector("input[placeholder='NIT de la empresa']").value.trim();
      const direccion = clienteForm.querySelector("input[placeholder='Dirección']").value.trim();

      if (!nombre || !correo || !telefono || !empresa || !nit) {
        mostrarToast("⚠️ Todos los campos obligatorios deben estar completos.", "error");
        return;
      }

      try {
        await addDoc(collection(db, "clientes"), {
          nombre,
          correo,
          telefono,
          empresa,
          nit,
          direccion,
          estado: "activo",
          archivos: []
        });

        mostrarToast("✅ Cliente registrado correctamente.");
        clienteForm.reset();
      } catch (error) {
        console.error("Error guardando cliente:", error);
        mostrarToast("❌ Error guardando cliente.", "error");
      }
    });
  }
});

function mostrarToast(mensaje, tipo = "ok") {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.className = "toast";
  toast.classList.add("show");
  toast.style.backgroundColor = tipo === "error" ? "#e74c3c" : "#2ecc71";
  setTimeout(() => toast.classList.remove("show"), 3000);
}





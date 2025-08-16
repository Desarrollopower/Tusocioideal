function mostrarToast(mensaje, tipo = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = mensaje;
  toast.className = `toast ${tipo}`;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

function obtenerClientes() {
  return JSON.parse(localStorage.getItem("clientes")) || [];
}

function guardarClientes(clientes) {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

// data.js

// CLIENTES
function obtenerClientes() {
  return JSON.parse(localStorage.getItem("clientes")) || [];
}

function guardarClientes(clientes) {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

// CITAS
function obtenerCitas() {
  return JSON.parse(localStorage.getItem("citas")) || [];
}

function guardarCitas(citas) {
  localStorage.setItem("citas", JSON.stringify(citas));
}

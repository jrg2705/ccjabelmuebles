function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let resumenCredito = "";

function calcularCredito() {
  const precio = parseFloat(document.getElementById('precio').value);
  const inicial = parseFloat(document.getElementById('inicial').value) || 0;
  const meses = parseInt(document.getElementById('meses').value);
  const esEmpleado = document.getElementById('esEmpleado').checked;

  if (isNaN(precio) || precio < 1) {
    mostrarAlerta("El precio debe ser mayor a 0.");
    return;
  }
  if (isNaN(meses) || meses < 1 || meses > 36) {
    mostrarAlerta("Los meses deben estar entre 1 y 36.");
    return;
  }

  const saldo = precio - inicial;
  let tasaMensual = 0;

  if (esEmpleado) {
    tasaMensual = 0.04;
  } else if (precio <= 9999) {
    tasaMensual = 0.10;
  } else if (precio <= 24999) {
    tasaMensual = 0.07;
  } else {
    tasaMensual = 0.05;
  }

  const interesTotal = saldo * (tasaMensual * meses);
  let totalConIntereses = saldo + interesTotal;
  totalConIntereses = Math.ceil(totalConIntereses / 50) * 50;
  const pagoMensual = Math.ceil((totalConIntereses / meses) / 50) * 50;
  const precioCredito = (pagoMensual * meses) + inicial;

  resumenCredito = `
📄 Resumen del Crédito:
- Precio del producto: RD$ ${formatNumber(precio.toFixed(2))}
- Inicial aplicado: RD$ ${formatNumber(inicial.toFixed(2))}
- Interés aplicado: ${(tasaMensual * 100).toFixed(2)}%
- Precio crédito: RD$ ${formatNumber(precioCredito.toFixed(2))}
- Cuota mensual (${meses}): RD$ ${formatNumber(pagoMensual.toFixed(2))}
  `;

  const resultado = resumenCredito.replace(/\n/g, "<br>");
  document.getElementById('resultado').innerHTML = `<h2>Resumen del Crédito</h2><p>${resultado}</p>`;
  document.getElementById('resultado').style.display = 'block';
}

function limpiarCampos() {
  document.getElementById('precio').value = '';
  document.getElementById('inicial').value = '';
  document.getElementById('meses').value = '';
  document.getElementById('esEmpleado').checked = false;
  document.getElementById('sugerenciaInicial').textContent = 'Inicial sugerida (25%): RD$ 0';
  document.getElementById('resultado').innerHTML = '';
  document.getElementById('resultado').style.display = 'none';
}

function toggleTema() {
  document.body.classList.toggle('dark');
}

function mostrarAlerta(msg) {
  const alerta = document.getElementById("alerta");
  alerta.textContent = msg;
  alerta.classList.remove("oculto");
  alerta.style.display = "block";
  setTimeout(() => alerta.style.display = "none", 3000);
}

function compartirWhatsApp() {
  if (!resumenCredito) {
    mostrarAlerta("Primero realiza un cálculo.");
    return;
  }
  const url = `https://wa.me/?text=${encodeURIComponent(resumenCredito)}`;
  window.open(url, "_blank");
}

document.getElementById('precio').addEventListener('input', function () {
  const precio = parseFloat(this.value);
  const sugerencia = precio ? (precio * 0.25).toFixed(2) : 0;
  document.getElementById('sugerenciaInicial').textContent = `Inicial sugerida (25%): RD$ ${formatNumber(sugerencia)}`;
});
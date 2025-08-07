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

// ==== MODAL DE ACTUALIZACIÓN ====
function showUpdateModal(installingWorker) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";

  const modal = document.createElement("div");
  modal.style.backgroundColor = "#007bff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "12px";
  modal.style.maxWidth = "320px";
  modal.style.textAlign = "center";
  modal.style.color = "white";
  modal.style.fontFamily = "Arial, sans-serif";
  modal.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";

  const logo = document.createElement("img");
  logo.src = "./logo.png";
  logo.alt = "Jabel Muebles";
  logo.style.width = "80px";
  logo.style.height = "80px";
  logo.style.borderRadius = "50%";
  logo.style.objectFit = "cover";
  logo.style.marginBottom = "10px";

  const title = document.createElement("h2");
  title.textContent = "Nueva versión disponible";
  title.style.fontSize = "18px";
  title.style.marginBottom = "10px";

  const message = document.createElement("p");
  message.textContent = "¿Quieres actualizar ahora para obtener las últimas mejoras?";
  message.style.fontSize = "14px";
  message.style.marginBottom = "20px";

  const btnAccept = document.createElement("button");
  btnAccept.textContent = "Actualizar";
  btnAccept.style.backgroundColor = "#28a745";
  btnAccept.style.color = "white";
  btnAccept.style.border = "none";
  btnAccept.style.padding = "10px 15px";
  btnAccept.style.marginRight = "10px";
  btnAccept.style.borderRadius = "8px";
  btnAccept.style.cursor = "pointer";
  btnAccept.onclick = () => {
    installingWorker.postMessage("SKIP_WAITING");
    document.body.removeChild(overlay);
  };

  const btnCancel = document.createElement("button");
  btnCancel.textContent = "Después";
  btnCancel.style.backgroundColor = "#dc3545";
  btnCancel.style.color = "white";
  btnCancel.style.border = "none";
  btnCancel.style.padding = "10px 15px";
  btnCancel.style.borderRadius = "8px";
  btnCancel.style.cursor = "pointer";
  btnCancel.onclick = () => {
    document.body.removeChild(overlay);
  };

  modal.appendChild(logo);
  modal.appendChild(title);
  modal.appendChild(message);
  modal.appendChild(btnAccept);
  modal.appendChild(btnCancel);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// ==== REGISTRO DEL SERVICE WORKER ====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(registration => {
        console.log("Service Worker registrado:", registration);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                showUpdateModal(installingWorker);
              } else {
                console.log("Contenido cacheado por primera vez");
              }
            }
          };
        };
      })
      .catch(error => console.error("Error al registrar Service Worker:", error));

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  });
}

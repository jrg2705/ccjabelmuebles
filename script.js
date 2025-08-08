/* ---------- utilidades de formato ---------- */
function formatNumber(num){
  return Number(num).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function unformatNumber(str){
  if (str === null || str === undefined) return 0;
  if (typeof str === 'number') return str;
  const cleaned = String(str).replace(/,/g,'').trim();
  if (cleaned === '') return 0;
  return Number(cleaned) || 0;
}

/* ---------- estado ---------- */
let resumenCredito = "";
let productos = []; // array de {id, descripcion, costo}
let productosCargados = false;

/* ---------- elementos ---------- */
const precioInput = () => document.getElementById('precio');
const inicialInput = () => document.getElementById('inicial');
const mesesInput = () => document.getElementById('meses');
const esEmpleadoInput = () => document.getElementById('esEmpleado');
const sugerenciaEl = () => document.getElementById('sugerenciaInicial');
const resultadoEl = () => document.getElementById('resultado');
const alertaEl = () => document.getElementById('alerta');

/* ---------- funciones principales ---------- */
function calcularCredito(){
  const precio = unformatNumber(precioInput().value);
  const inicial = unformatNumber(inicialInput().value);
  const meses = parseInt(mesesInput().value,10);
  const esEmpleado = esEmpleadoInput().checked;

  if (isNaN(precio) || precio < 1){
    mostrarAlerta("El precio debe ser mayor a 0.");
    return;
  }
  if (isNaN(meses) || meses < 1 || meses > 36){
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

  resumenCredito =
`📄 Resumen del Crédito:
- Precio del producto: RD$ ${formatNumber(precio)}
- Inicial aplicado: RD$ ${formatNumber(inicial)}
- Interés aplicado: ${(tasaMensual*100).toFixed(2)}%
- Precio crédito: RD$ ${formatNumber(precioCredito)}
- Cuota mensual (${meses}): RD$ ${formatNumber(pagoMensual)}
`;

  resultadoEl().style.display = "block";
  resultadoEl().innerHTML = `<h2>Resumen del Crédito</h2><p style="white-space:pre-line">${resumenCredito.replace(/\n/g,'<br>')}</p>`;
}

/* ---------- limpiar ---------- */
function limpiarCampos(){
  precioInput().value = '';
  inicialInput().value = '';
  mesesInput().value = '';
  esEmpleadoInput().checked = false;
  sugerenciaEl().textContent = 'Inicial sugerida (25%): RD$ 0';
  resultadoEl().style.display = 'none';
  resultadoEl().innerHTML = '';
  resumenCredito = "";
}

/* ---------- alerta ---------- */
function mostrarAlerta(msg, timeout = 3000){
  const a = alertaEl();
  a.textContent = msg;
  a.classList.remove('oculto');
  a.style.display = 'block';
  setTimeout(()=>{ a.style.display = 'none'; }, timeout);
}

/* ---------- compartir WhatsApp ---------- */
function compartirWhatsApp(){
  if (!resumenCredito){
    mostrarAlerta("Primero realiza un cálculo.");
    return;
  }
  const url = `https://wa.me/?text=${encodeURIComponent(resumenCredito)}`;
  window.open(url, "_blank");
}

/* ---------- formateo inputs en vivo ---------- */
function formatInputField(el){
  let v = el.value;
  // permitir solo dígitos y punto
  v = v.replace(/[^\d.]/g,'');
  // permitir un solo punto
  const parts = v.split('.');
  if (parts.length > 2) v = parts[0]+'.'+parts.slice(1).join('');
  const [intPart, decPart] = v.split('.');
  const intFmt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g,',') : '';
  el.value = decPart !== undefined ? intFmt + '.' + decPart : intFmt;
}

/* ---------- sugerencia inicial automática ---------- */
function actualizarSugerencia(){
  const precio = unformatNumber(precioInput().value);
  const suger = precio ? (precio * 0.25) : 0;
  sugerenciaEl().textContent = `Inicial sugerida (25%): RD$ ${formatNumber(suger)}`;
}

/* ---------- productos: precarga CM.xlsx desde la raíz (fetch) ---------- */
async function precargarExcelPorDefecto(){
  try {
    const resp = await fetch('./CM.xlsx');
    if (!resp.ok) {
      console.log('No hay CM.xlsx por defecto en la raíz (ok).');
      return;
    }
    const ab = await resp.arrayBuffer();
    const workbook = XLSX.read(ab, {type:'array'});
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, {defval:''});
    productos = json.map(r => {
      const keys = Object.keys(r);
      const idKey = keys.find(k=>k.toLowerCase().includes('id')) || keys[0];
      const descKey = keys.find(k=>k.toLowerCase().includes('desc')) || keys[1] || '';
      const costoKey = keys.find(k=>k.toLowerCase().includes('cost')) || keys.find(k=>k.toLowerCase().includes('costo')) || keys[2] || '';
      return {
        id: String(r[idKey]).trim(),
        descripcion: String(r[descKey] || '').trim(),
        costo: Number(r[costoKey] || 0)
      };
    });
    if (productos.length > 0){
      productosCargados = true;
      habilitarConsulta(true);
      mostrarAlerta(`Productos cargados automáticamente: ${productos.length}`, 2500);
    }
  } catch (err) {
    console.warn('Precarga fallida:', err);
  }
}

/* ---------- cargar excel via file input ---------- */
function leerExcelDesdeFile(file){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = function(e){
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type:'array'});
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, {defval:''});
        const arr = json.map(r => {
          const keys = Object.keys(r);
          const idKey = keys.find(k=>k.toLowerCase().includes('id')) || keys[0];
          const descKey = keys.find(k=>k.toLowerCase().includes('desc')) || keys[1] || '';
          const costoKey = keys.find(k=>k.toLowerCase().includes('cost')) || keys.find(k=>k.toLowerCase().includes('costo')) || keys[2] || '';
          return {
            id: String(r[idKey]).trim(),
            descripcion: String(r[descKey] || '').trim(),
            costo: Number(r[costoKey] || 0)
          };
        });
        resolve(arr);
      } catch (err){
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

/* ---------- habilitar/deshabilitar consulta ---------- */
function habilitarConsulta(enabled){
  const idInput = document.getElementById('consultaId');
  const btnConsultar = document.getElementById('btnConsultarProducto');
  idInput.disabled = !enabled;
  btnConsultar.disabled = !enabled;
}

/* ---------- forzar solo números en el campo ID ---------- */
const idInput = document.getElementById('consultaId');
if (idInput) {
  idInput.addEventListener('input', () => {
    idInput.value = idInput.value.replace(/\D/g, ''); // solo números
  });
}

/* ---------- consultar producto ---------- */
function consultarProductoPorId(){
  const id = (document.getElementById('consultaId').value || '').trim();
  const errorEl = document.getElementById('consultaError');
  errorEl.classList.add('oculto');
  if (!/^[0-9]{4,8}$/.test(id)){
    errorEl.textContent = 'ID inválido. Debe ser solo números (4 a 8 dígitos).';
    errorEl.classList.remove('oculto');
    return;
  }
  const found = productos.find(p=>p.id === id);
  if (!found){
    errorEl.textContent = 'Producto no encontrado. Asegúrate de cargar el archivo y usar el ID correcto.';
    errorEl.classList.remove('oculto');
    return;
  }
  // mostrar modal con datos
  document.getElementById('modalId').textContent = found.id;
  document.getElementById('modalDesc').textContent = found.descripcion || '-';
  document.getElementById('modalCosto').textContent = 'RD$ ' + formatNumber(found.costo || 0);
  abrirModalProducto();
}

/* ---------- modal ---------- */
function abrirModalProducto(){
  const mod = document.getElementById('modalProducto');
  mod.classList.remove('oculto');
  mod.setAttribute('aria-hidden','false');
}
function cerrarModalProducto(){
  const mod = document.getElementById('modalProducto');
  mod.classList.add('oculto');
  mod.setAttribute('aria-hidden','true');
}

/* ---------- tema ---------- */
function toggleTema(){
  document.body.classList.toggle('dark');
}

/* ---------- listeners DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', ()=> {
  // inputs
  const p = document.getElementById('precio');
  const i = document.getElementById('inicial');
  const fInput = document.getElementById('fileProductos');

  if (p){
    p.addEventListener('input', ()=> formatInputField(p));
    p.addEventListener('blur', ()=> {
      if (p.value === '') return;
      const n = unformatNumber(p.value);
      p.value = formatNumber(n);
      actualizarSugerencia();
    });
  }

  if (i){
    i.addEventListener('input', ()=> formatInputField(i));
    i.addEventListener('blur', ()=> {
      if (i.value === '') return;
      i.value = formatNumber(unformatNumber(i.value));
    });
  }

  // botones
  document.getElementById('btnCalcular').addEventListener('click', calcularCredito);
  document.getElementById('btnLimpiar').addEventListener('click', limpiarCampos);
  document.getElementById('btnCompartir').addEventListener('click', compartirWhatsApp);
  document.getElementById('btnTema').addEventListener('click', toggleTema);

  // consultas
  document.getElementById('btnCargarExcel').addEventListener('click', ()=> fInput.click());
  fInput.addEventListener('change', async (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    try {
      const arr = await leerExcelDesdeFile(file);
      productos = arr;
      productosCargados = true;
      habilitarConsulta(true);
      mostrarAlerta('Productos cargados: ' + productos.length, 2500);
    } catch (err){
      mostrarAlerta('Error leyendo archivo. Usa un .xlsx válido.');
      console.error(err);
    } finally {
      fInput.value = '';
    }
  });

  // consulta id
  document.getElementById('btnConsultarProducto').addEventListener('click', consultarProductoPorId);

  // modal close
  document.getElementById('modalClose').addEventListener('click', cerrarModalProducto);
  document.getElementById('modalCloseBtn').addEventListener('click', cerrarModalProducto);
  window.addEventListener('keydown', (e)=> {
    if (e.key === 'Escape') cerrarModalProducto();
  });

  // hamburger simple (abre/oculta panel con 2 funciones)
  const btnMenu = document.getElementById('btnMenu');
  btnMenu.addEventListener('click', ()=> {
    const menuHtml = `
      <div style="position:absolute;right:16px;top:52px;background:#fff;color:#007bff;padding:8px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.12);z-index:9999;">
        <button id="menuLoad" style="display:block;width:100%;padding:8px;border:none;background:#007bff;color:#fff;border-radius:6px;margin-bottom:6px;cursor:pointer">Cargar productos (.xlsx)</button>
        <button id="menuFocus" style="display:block;width:100%;padding:8px;border:none;background:#e9ecef;color:#007bff;border-radius:6px;cursor:pointer">Ir a Consulta</button>
      </div>
    `;
    // remover si ya existe
    const existing = document.getElementById('tempMenu');
    if (existing){ existing.remove(); return; }
    const div = document.createElement('div');
    div.id = 'tempMenu';
    div.innerHTML = menuHtml;
    document.body.appendChild(div);

    // handlers
    document.getElementById('menuLoad').addEventListener('click', ()=> {
      document.getElementById('fileProductos').click();
      div.remove();
    });
    document.getElementById('menuFocus').addEventListener('click', ()=> {
      document.getElementById('consultaId').focus();
      div.remove();
    });

    // click fuera para cerrar
    setTimeout(()=> {
      window.addEventListener('click', function _closeMenu(ev){
        if (!div.contains(ev.target) && ev.target !== btnMenu){
          div.remove();
          window.removeEventListener('click', _closeMenu);
        }
      });
    }, 50);
  });

  // habilitar consulta si precarga funcionó
  habilitarConsulta(false);
  // intentar precargar CM.xlsx si existe en la raíz
  precargarExcelPorDefecto();
});

/* ---------- registro service worker (se actualiza con modal simple) ---------- */
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./service-worker.js').then(reg=>{
      console.log('SW registrado', reg);
      reg.onupdatefound = ()=>{
        const installing = reg.installing;
        installing.onstatechange = ()=>{
          if (installing.state === 'installed'){
            if (navigator.serviceWorker.controller){
              // notificar al usuario
              if (confirm('Nueva versión disponible. Actualizar ahora?')) installing.postMessage('SKIP_WAITING');
            }
          }
        };
      };
    }).catch(err=> console.error('SW error',err));
    navigator.serviceWorker.addEventListener('controllerchange', ()=> window.location.reload());
  });
}

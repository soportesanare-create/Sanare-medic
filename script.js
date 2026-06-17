(function () {
  'use strict';

  /* ── Configuración ───────────────────────────────────── */
  const FOLIO_PREFIX = 'SNR';

  /* ── Referencias DOM ─────────────────────────────────── */
  const folioInput = document.getElementById('folio');
  const fechaInput = document.getElementById('fecha');
  const pesoInput  = document.getElementById('peso');
  const tallaInput = document.getElementById('talla');
  const scInput    = document.getElementById('sc');

  const btnFolio = document.getElementById('btnFolio');
  const btnReset = document.getElementById('btnReset');
  const btnPrint = document.getElementById('btnPrint');

  const generoCheckboxes = document.querySelectorAll('input[name="genero"]');

  const dobDia    = document.getElementById('dobDia');
  const dobMes    = document.getElementById('dobMes');
  const dobAnio   = document.getElementById('dobAnio');
  const edadInput = document.getElementById('edad');

  /* ── Tipos y Catálogo de Medicamentos ───────────────────────── */
  const TABLAS = [
    { tipo: 'premed', label: 'Premedicación', bodyId: 'medsBodyPremed', datalistId: 'medOptionsPremed', defaultRows: 3 },
    { tipo: 'quimio', label: 'Quimioterapia', bodyId: 'medsBodyQuimio', datalistId: 'medOptionsQuimio', defaultRows: 3 },
    { tipo: 'inmuno', label: 'Inmunoterapia', bodyId: 'medsBodyInmuno', datalistId: 'medOptionsInmuno', defaultRows: 3 },
  ];

  const MEDICAMENTOS_CATALOGO = {
    'premed': [
      'Alprazolam', 'Apixaban', 'Aprepitant', 'Atropina', 'Butilhioscina',
      'Butilhioscina/Metamizol', 'Cloropiramina', 'Dexametasona', 'Dexlansoprazol',
      'Dexrazoxano', 'Diazepam', 'Difenhidramina', 'Difenidol', 'Domperidona',
      'Enoxaparina', 'Epinefrina', 'Esomeprazol', 'Famotidina', 'Fexofenadina',
      'Fosaprepitant', 'Furosemida', 'Heparina', 'Hidrocortisona', 'Ipratropio',
      'Ketoprofeno', 'Ketorolaco', 'Lidocaina/Prilocaina', 'Loratadina',
      'Metilprednisolona', 'Metoclopramida', 'Midazolam', 'Morfina', 'Olanzapina',
      'Omeprazol', 'Ondansetron', 'Palonosetron', 'Palonosetron/Netupitant',
      'Pantoprazol', 'Paracetamol', 'Prednisona', 'Rivaroxaban', 'Tramadol'
    ],
    'quimio': [
      'Azacitidina', 'Bendamustina', 'Bortezomib', 'Cabazitaxel', 'Carfilzomib',
      'Ciclofosfamida', 'Cisplatino', 'Doxorrubicina', 'Doxorrubicina Pegilada',
      'Fulvestrant', 'Gemcitabina', 'Goserelina', 'Irinotecán', 'Nab-Paclitaxel',
      'Nivolumab', 'Paclitaxel', 'Pembrolizumab', 'Pemetrexed', 'Trabectedina'
    ],
    'inmuno': [
      'Acido folinico', 'Atezolizumab', 'Avelumab', 'Bevacizumab', 'Blinatumomab',
      'Brentuximab vedotina', 'Capecitabina', 'Carboplatino', 'Cetuximab',
      'Daratumumab', 'Daratumumab/Hialuronidasa', 'Docetaxel', 'Durvalumab',
      'Fluorouracilo', 'Ipilimumab', 'Isatuximab', 'Obinutuzumab', 'Oxaliplatino',
      'Panitumumab', 'Pertuzumab', 'Polatuzumab vedotina', 'Prednisona',
      'Ramucirumab', 'Rituximab', 'Trastuzumab', 'Trastuzumab deruxtecan',
      'Trastuzumab emtansina', 'Vincristina', 'Ziv-aflibercept'
    ],
    'sopor': [
      'Ácido zoledrónico', 'Darbepoetina alfa', 'Denosumab', 'Filgrastim',
      'Inmunoglobulina humana', 'Pegfilgrastim', 'Romiplostim'
    ]
  };

  /* ── Inicialización ──────────────────────────────────── */
  function init() {
    setFechaHoy();
    populateDatalists();
    renderInitialRows();
    restoreFromStorage();
    bindEvents();
  }

  /* ── Datalists de medicamentos por tabla ─────────────── */
  function populateDatalists() {
    TABLAS.forEach(cfg => {
      const dataList = document.getElementById(cfg.datalistId);
      if (!dataList) return;
      dataList.innerHTML = '';
      (MEDICAMENTOS_CATALOGO[cfg.tipo] || []).forEach(med => {
        const option = document.createElement('option');
        option.value = med;
        dataList.appendChild(option);
      });
    });
  }

  /* ── Fecha automática del documento ──────────────────── */
  function setFechaHoy() {
    if (fechaInput && !fechaInput.value) {
      const hoy  = new Date();
      const dd   = String(hoy.getDate()).padStart(2, '0');
      const mm   = String(hoy.getMonth() + 1).padStart(2, '0');
      const aaaa = hoy.getFullYear();
      fechaInput.value = `${dd}/${mm}/${aaaa}`;
    }
  }

  /* ── Generador de folio ──────────────────────────────── */
  function generarFolio() {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `${FOLIO_PREFIX}-${ts}-${rand}`;
  }

  /* ── Superficie corporal (Mosteller) ─────────────────── */
  function calcularSC() {
    const peso  = parseFloat(pesoInput.value);
    const talla = parseFloat(tallaInput.value);
    scInput.value = (peso > 0 && talla > 0)
      ? Math.sqrt((peso * talla) / 3600).toFixed(2)
      : '';
  }

  /* ── DOB → Edad ──────────────────────────────────────── */
  function calcularEdadDesdeDOB() {
    const dia  = parseInt(dobDia?.value,  10);
    const mes  = parseInt(dobMes?.value,  10);
    const anio = parseInt(dobAnio?.value, 10);

    if (!dia || !mes || !anio || anio < 1900 || anio > new Date().getFullYear()) {
      if (edadInput) edadInput.value = '';
      return;
    }

    const nacimiento = new Date(anio, mes - 1, dia);
    if (nacimiento.getMonth() !== mes - 1) {
      if (edadInput) edadInput.value = '';
      return;
    }

    const hoy = new Date();
    let edad  = hoy.getFullYear() - nacimiento.getFullYear();
    if (hoy < new Date(hoy.getFullYear(), mes - 1, dia)) edad--;

    if (edadInput) edadInput.value = edad >= 0 ? edad : '';
  }

  /* ── Edad → DOB (año estimado) ───────────────────────── */
  function calcularDOBDesdeEdad() {
    const edad = parseInt(edadInput?.value, 10);
    if (isNaN(edad) || edad < 0 || edad > 120) return;
    if (dobAnio) dobAnio.value = new Date().getFullYear() - edad;
  }

  /* ── Auto-avance entre campos DOB ───────────────────── */
  function bindDobAutoAdvance() {
    if (!dobDia || !dobMes || !dobAnio) return;

    dobDia.addEventListener('input', () => {
      if (dobDia.value.length >= 2) dobMes.focus();
      calcularEdadDesdeDOB();
      saveToStorage();
    });
    dobMes.addEventListener('input', () => {
      if (dobMes.value.length >= 2) dobAnio.focus();
      calcularEdadDesdeDOB();
      saveToStorage();
    });
    dobAnio.addEventListener('input', () => {
      calcularEdadDesdeDOB();
      saveToStorage();
    });

    dobDia.addEventListener('blur', () => {
      if (dobDia.value && (dobDia.value < 1 || dobDia.value > 31)) dobDia.value = '';
    });
    dobMes.addEventListener('blur', () => {
      if (dobMes.value && (dobMes.value < 1 || dobMes.value > 12)) dobMes.value = '';
    });
  }

  /* ── Crear fila en una tabla específica ──────────────── */
  function createRow(tipo, data = {}) {
    const config = TABLAS.find(t => t.tipo === tipo);
    if (!config) return;
    const body = document.getElementById(config.bodyId);
    if (!body) return;

    const num = body.children.length + 1;

    const tr = document.createElement('tr');
    tr.dataset.tipo = tipo;
    tr.innerHTML = `
      <td class="col-num">${num}</td>
      <td>
        <input type="text" class="med-input" list="${config.datalistId}" placeholder="Escribe o selecciona..."
               value="${esc(data.med || '')}" aria-label="Medicamento ${num}">
      </td>
      <td><textarea class="auto-resize" rows="1" placeholder="p. ej. 500 mg" aria-label="Dosis">${esc(data.dosis || '')}</textarea></td>
      <td><textarea class="auto-resize" rows="1" aria-label="Presentación">${esc(data.pendiente1 || '')}</textarea></td>
      <td><input type="text" list="viaOptions" placeholder="IV"
           value="${esc(data.via || '')}" aria-label="Vía de administración"></td>
      <td><textarea class="auto-resize" rows="1" aria-label="Tiempo">${esc(data.pendiente2 || '')}</textarea></td>
      <td class="col-action no-print">
        <button type="button" class="row-remove" title="Eliminar fila"
                aria-label="Eliminar fila ${num}">×</button>
      </td>
    `;

    tr.querySelector('.row-remove').addEventListener('click', () => {
      tr.remove();
      renumberRows(body);
      saveToStorage();
    });
    
   tr.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('input', saveToStorage);
      inp.addEventListener('change', saveToStorage);
    });
    tr.querySelectorAll('textarea.auto-resize').forEach(ta => {
      const autoResize = () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      };
      ta.addEventListener('input', autoResize);
      setTimeout(autoResize, 0); // Ajustar si se cargaron datos del LocalStorage
    });

    body.appendChild(tr);
  }

  function renderInitialRows() {
    TABLAS.forEach(cfg => {
      const body = document.getElementById(cfg.bodyId);
      if (!body) return;
      body.innerHTML = '';
      for (let i = 0; i < cfg.defaultRows; i++) createRow(cfg.tipo);
    });
  }

  function renumberRows(body) {
    body.querySelectorAll('tr').forEach((tr, idx) => {
      const numCell = tr.querySelector('.col-num');
      if (numCell) numCell.textContent = idx + 1;
    });
  }

  /* ── Validación ──────────────────────────────────────── */
  function validateForm() {
    let valid = true;
    [document.getElementById('nombre'), document.getElementById('medico')].forEach(f => {
      if (!f) return;
      if (!f.value.trim()) { f.classList.add('error'); valid = false; }
      else f.classList.remove('error');
    });
    return valid;
  }

  /* ── Género: selección exclusiva ─────────────────────── */
  generoCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      generoCheckboxes.forEach(o => { if (o !== cb) o.checked = false; });
      saveToStorage();
    });
  });

  /* ── Formato fecha (DD/MM/AAAA) ──────────────────────── */
  fechaInput && fechaInput.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
    this.value = v.slice(0, 10);
    saveToStorage();
  });

  /* ── Persistencia localStorage ───────────────────────── */
  function allRowsData() {
    const result = {};
    TABLAS.forEach(cfg => {
      const body = document.getElementById(cfg.bodyId);
      if (!body) return;
      result[cfg.tipo] = [...body.querySelectorAll('tr')].map(tr => {
        const inputs = tr.querySelectorAll('input, textarea');
        return {
          med:       inputs[0]?.value || '',
          dosis:     inputs[1]?.value || '',
          pendiente1: inputs[2]?.value || '',
          via:       inputs[3]?.value || '',
          pendiente2: inputs[4]?.value || '',
        };
      });
    });
    return result;
  }

  function saveToStorage() {
    try {
      const data = {
        folio:         folioInput?.value  || '',
        fecha:         fechaInput?.value  || '',
        nombre:        val('nombre'),
        dobDia:        dobDia?.value      || '',
        dobMes:        dobMes?.value      || '',
        dobAnio:       dobAnio?.value     || '',
        edad:          edadInput?.value   || '',
        genero:        [...generoCheckboxes].find(c => c.checked)?.value || '',
        diagnostico:   val('diagnostico'),
        peso:          val('peso'),
        talla:         val('talla'),
        acceso:        [...document.querySelectorAll('input[name="acceso"]:checked')].map(c => c.value),
        cicloNo:       val('cicloNo'),
        ciclosTotal:   val('ciclosTotal'),
        dia:           val('dia'),
        observaciones: val('observaciones'),
        medico:        val('medico'),
        cedula:        val('cedula'),
        asesor:        val('asesor'),
        cotizacion:    val('cotizacion'),
        tablas:        allRowsData(),
      };
      localStorage.setItem('sanare_form', JSON.stringify(data));
    } catch (_) {}
  }

  function restoreFromStorage() {
    try {
      const raw = localStorage.getItem('sanare_form');
      if (!raw) return;
      const d = JSON.parse(raw);

      if (folioInput && d.folio) folioInput.value = d.folio;
      if (fechaInput && d.fecha) fechaInput.value = d.fecha;

      setFieldValue('nombre',        d.nombre);
      if (dobDia  && d.dobDia)  dobDia.value  = d.dobDia;
      if (dobMes  && d.dobMes)  dobMes.value  = d.dobMes;
      if (dobAnio && d.dobAnio) dobAnio.value = d.dobAnio;
      if (edadInput && d.edad)  edadInput.value = d.edad;

      setFieldValue('diagnostico',   d.diagnostico);
      setFieldValue('peso',          d.peso);
      setFieldValue('talla',         d.talla);
      setFieldValue('cicloNo',       d.cicloNo);
      setFieldValue('ciclosTotal',   d.ciclosTotal);
      setFieldValue('dia',           d.dia);
      setFieldValue('observaciones', d.observaciones);
      setFieldValue('medico',        d.medico);
      setFieldValue('cedula',        d.cedula);
      setFieldValue('asesor',        d.asesor);
      setFieldValue('cotizacion',    d.cotizacion);

      if (d.genero) generoCheckboxes.forEach(cb => { cb.checked = cb.value === d.genero; });

      if (Array.isArray(d.acceso)) {
        document.querySelectorAll('input[name="acceso"]').forEach(cb => {
          cb.checked = d.acceso.includes(cb.value);
        });
      }

      // Restaurar filas por tabla (nuevo formato)
      if (d.tablas) {
        TABLAS.forEach(cfg => {
          const rows = d.tablas[cfg.tipo];
          if (!Array.isArray(rows) || !rows.length) return;
          const body = document.getElementById(cfg.bodyId);
          if (body) body.innerHTML = '';
          rows.forEach(r => createRow(cfg.tipo, r));
        });
      }

      calcularSC();
      calcularEdadDesdeDOB();
    } catch (_) {}
  }

  /* ── Limpiar formulario ──────────────────────────────── */
  function resetForm() {
    if (!confirm('¿Deseas limpiar todos los datos del formulario?')) return;

    document.getElementById('infusionForm')?.reset();
    if (folioInput) folioInput.value = '';
    setFechaHoy();

    renderInitialRows();

    if (dobDia)    dobDia.value    = '';
    if (dobMes)    dobMes.value    = '';
    if (dobAnio)   dobAnio.value   = '';
    if (edadInput) edadInput.value = '';

    ['cicloNo', 'ciclosTotal', 'dia'].forEach(id => setFieldValue(id, ''));
    if (scInput) scInput.value = '';

    try { localStorage.removeItem('sanare_form'); } catch (_) {}
  }

  /* ── Eventos ─────────────────────────────────────────── */
  function bindEvents() {
    bindDobAutoAdvance();

    edadInput?.addEventListener('change', () => { calcularDOBDesdeEdad(); saveToStorage(); });
    edadInput?.addEventListener('input',  () => { calcularDOBDesdeEdad(); saveToStorage(); });

    // Botón: Generar folio
    btnFolio?.addEventListener('click', () => {
      if (folioInput) folioInput.value = generarFolio();
      saveToStorage();
    });

    // Botón: Limpiar formulario
    btnReset?.addEventListener('click', resetForm);

    // Botón: Imprimir / Guardar PDF — escala automática a una sola página
    btnPrint?.addEventListener('click', () => {
      if (!validateForm()) {
        alert('Por favor, completa los campos obligatorios marcados con *.');
        return;
      }

      const page = document.querySelector('.page');
      if (page) {
        // Altura útil de una hoja Letter en px a 96 dpi (279.4 mm)
        const PAGE_H_PX = 300 * (96 / 25.4);
        // Ancho útil Letter en px (215.9 mm) para calcular la escala real disponible
        const PAGE_W_PX = 210.0 * (96 / 25.4);

        // Quitamos temporalmente la escala previa para medir el tamaño real
        page.style.setProperty('--print-scale', '1');
        const contentH = page.scrollHeight;
        const contentW = page.scrollWidth;

        const scaleH = PAGE_H_PX / contentH;
        const scaleW = PAGE_W_PX / contentW;
        const scale  = Math.min(scaleH, scaleW, 1); // nunca ampliar, solo reducir

        page.style.setProperty('--print-scale', scale.toFixed(4));
      }

      window.print();

      // Restablecer después de imprimir para no afectar la vista normal
      if (page) {
        setTimeout(() => page.style.removeProperty('--print-scale'), 1000);
      }
    });

    // Botones "+ Agregar fila" de cada subsección
    document.querySelectorAll('.btn-add-sub').forEach(btn => {
      btn.addEventListener('click', () => {
        const tipo = btn.dataset.tipo;
        if (tipo) {
          createRow(tipo);
          saveToStorage();
        }
      });
    });

    pesoInput?.addEventListener('input',  () => { calcularSC(); saveToStorage(); });
    tallaInput?.addEventListener('input', () => { calcularSC(); saveToStorage(); });

    document.getElementById('infusionForm')?.addEventListener('input',  saveToStorage);
    document.getElementById('infusionForm')?.addEventListener('change', saveToStorage);

    ['cicloNo', 'ciclosTotal', 'dia'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', saveToStorage);
    });
  }

  /* ── Extraer dosis desde el nombre del medicamento ─────────── */
  function extraerDosis(nombreMed) {
    const match = nombreMed.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|UI|ug|ml)/i);
    if (!match) return '';
    return match[1] + ' ' + match[2].toLowerCase();
  }

  /* ── Autocompletado de dosis al seleccionar medicamento ── */
  document.addEventListener('change', function (e) {
    if (!e.target || !e.target.classList.contains('med-input')) return;
    const fila = e.target.closest('tr');
    if (!fila) return;

    const valorEscrito = e.target.value.trim();
    const todoCatalogo = Object.values(MEDICAMENTOS_CATALOGO).flat();
    const medEncontrado = todoCatalogo.find(m => m.toLowerCase() === valorEscrito.toLowerCase());

    if (medEncontrado) {
const inputs = fila.querySelectorAll('input, textarea');
      // inputs[0] = med-input, inputs[1] = dosis
      const inputDosis = inputs[1];
      if (inputDosis) {
        inputDosis.value = extraerDosis(medEncontrado);
        inputDosis.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });

  /* ── Utilidades ──────────────────────────────────────── */
  function val(id) { return document.getElementById(id)?.value || ''; }

  function setFieldValue(id, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.value = value;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Arranque ─────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
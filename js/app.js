(() => {
  'use strict';

  // Log simple: solo usa la consola del navegador
  function log(...args) {
    console.log(...args);
  }

  window.log = log;

  log(">>> app.js INICIADO <<<");

  // ----- Helpers -----
  
  // ---- Helpers numéricos seguros ----
function parseNumberSafe(value) {
  if (value === null || value === undefined) return 0;
  const raw = String(value).replace(',', '.').trim();
  if (!raw) return 0;
  const num = parseFloat(raw);
  return isNaN(num) ? 0 : num;
}
  const STORAGE_KEY = 'ecoApp_v11c_state';

  // ----- PRO: sistema algorítmico de códigos -----
  const PRO_STORAGE_KEY = 'ecoApp_v11c_pro';

  // No cambies estos valores una vez publicada la app.
  const PRO_CODE_PREFIX = 'FF';  // de Flujo Fácil
  const PRO_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0, O, I, 1

  let proState = {
    active: false,
    code: null,
    activatedAt: null
  };

  function loadProState() {
    try {
      const raw = localStorage.getItem(PRO_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        proState = Object.assign(proState, parsed);
      }
    } catch (e) {
      console.error('Error leyendo estado PRO', e);
    }
  }

  function saveProState() {
    try {
      localStorage.setItem(PRO_STORAGE_KEY, JSON.stringify(proState));
    } catch (e) {
      console.error('Error guardando estado PRO', e);
    }
  }

  function isProActive() {
    return !!(proState && proState.active);
  }

  // Cinta FREE / PRO en la cabecera (SE MANTIENE)
  function updateHeaderPlanBadge() {
    const header = document.getElementById('headerInner');
    if (!header) return;

    header.classList.remove('header-badge-free', 'header-badge-pro');

    if (isProActive()) {
      header.classList.add('header-badge-pro');
    } else {
      header.classList.add('header-badge-free');
    }
  }

  // ---------- LÓGICA DEL CÓDIGO ALGORÍTMICO ----------

  // Normaliza un código introducido por el usuario
  function normalizeProCode(input) {
    if (!input) return '';
    return String(input)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ''); // quita guiones, espacios, etc.
  }

  // Calcula el checksum de un payload de 8 caracteres
  function computeProChecksum(payload) {
    if (!payload || payload.length !== 8) return null;

    const alphabet = PRO_CODE_ALPHABET;
    const base = alphabet.length;
    const idx = [];

    for (let i = 0; i < payload.length; i++) {
      const c = payload[i];
      const pos = alphabet.indexOf(c);
      if (pos === -1) return null;
      idx.push(pos);
    }

    // Primer carácter del checksum: suma de índices + 7
    let sum = 0;
    idx.forEach(v => { sum += v; });
    const idx1 = (sum + 7) % base;

    // Segundo carácter: combinación de algunas posiciones
    const idx2 = (idx[0] * 3 + idx[3] * 5 + idx[7] * 7) % base;

    return alphabet[idx1] + alphabet[idx2];
  }

  // Valida un código PRO. Devuelve info si es válido, null si no.
  function validateProCode(rawCode) {
    const normalized = normalizeProCode(rawCode);
    // Esperamos: FF + 8 payload + 2 checksum = 12 caracteres
    if (!normalized.startsWith(PRO_CODE_PREFIX)) return null;
    if (normalized.length !== 12) return null;

    const body = normalized.slice(PRO_CODE_PREFIX.length); // 10 chars
    const payload = body.slice(0, 8);
    const checksum = body.slice(8); // 2 chars

    const expected = computeProChecksum(payload);
    if (!expected || checksum !== expected) return null;

    return {
      normalized,
      payload
    };
  }

  // Formato bonito con guiones para mostrar al usuario
  function formatProCodeForDisplay(code) {
    if (!code) return '';
    const raw = normalizeProCode(code);
    if (raw.length !== 12) return raw;
    return raw.slice(0, 4) + '-' + raw.slice(4, 8) + '-' + raw.slice(8, 12);
  }

  function updateProUI() {
    const tag = document.getElementById('proStatusTag');
    const msg = document.getElementById('proStatusMessage');
    const input = document.getElementById('proCodeInput');

    if (!tag || !msg) return;

    if (isProActive()) {
      tag.textContent = 'PRO';
      tag.style.background = '#f59e0b'; // ámbar
      tag.style.color = '#111827';

      const code = proState.code || '—';
      const fecha = proState.activatedAt
        ? new Date(proState.activatedAt).toLocaleString('es-ES')
        : 'fecha desconocida';

      const codeDisplay = formatProCodeForDisplay(code);

      msg.innerHTML = `
        Estado actual: <strong>PRO activado</strong>.<br>
        Código: <strong>${codeDisplay}</strong><br>
        Activado el: <strong>${fecha}</strong>
      `;

      if (input) {
        input.value = codeDisplay;
      }
    } else {
      tag.textContent = 'FREE';
      tag.style.background = '#e5e7eb';
      tag.style.color = '#374151';

      msg.innerHTML = `
        Estado actual: <strong>Versión gratuita</strong>.<br>
        Introduce un código PRO válido para activarla en este dispositivo.
      `;

      if (input) {
        input.value = '';
      }
    }

    // Actualizar cinta de cabecera cada vez que redibujamos el estado PRO
    updateHeaderPlanBadge();
  }

  function setupProSystem() {
    const input = document.getElementById('proCodeInput');
    const btn = document.getElementById('btnProActivate');

    if (!btn) {
      return;
    }

    btn.addEventListener('click', () => {
      if (!input) return;
      const rawCode = (input.value || '').trim();
      if (!rawCode) {
        showToast('Introduce un código PRO.');
        return;
      }

      const result = validateProCode(rawCode);
      if (!result) {
        showToast('Código PRO no válido.');
        return;
      }

      proState.active = true;
      proState.code = result.normalized;
      proState.activatedAt = new Date().toISOString();
      saveProState();
      updateProUI();
      showToast('Versión PRO activada en este dispositivo.');
    });

    // Pintar estado inicial (FREE / PRO) y cinta de cabecera
    updateProUI();
  }
    let state = {
    ingresosBase: { juan: 0, saray: 0, otros: 0 },
    fijos: [],              // {id, nombre, importe}
    sobres: [],             // {id, nombre, presupuesto}
    huchas: [],             // {id, nombre, objetivo, saldo}
    ingresosPuntuales: [],  // {id, fecha, desc, importe}
    gastos: [],             // {id, fecha, categoria, desc, importe}
    notasPorMes: {},        // { 'YYYY-MM': 'texto' }
    personalizacion: {
      nombreIngresoPrincipal: 'Ingreso principal',
      tema: 'default'
    }
  };
  const monthNames = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  let currentYear, currentMonth; // month 0-11
  
// ----- Intro de logo FLUJO FÁCIL -----
function setupIntroOverlay() {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  const INTRO_DURATION = 2000; // milisegundos
  let finished = false;

  function finishIntro() {
    if (finished) return;
    finished = true;

    // Desvanecemos la intro
    overlay.classList.add('intro-hidden');

    // Y la quitamos del DOM después de la transición
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 400);
  }

  // Permitir saltar la intro con un toque
  overlay.addEventListener('click', finishIntro);

  // Antes esperábamos al evento 'load', pero en modo app / algunos navegadores
  // puede no dispararse como esperamos. Aquí arrancamos directamente el temporizador
  // cuando el DOM ya está listo (setupIntroOverlay se llama en DOMContentLoaded).
  setTimeout(finishIntro, INTRO_DURATION);

  // Failsafe: si por lo que sea sigue sin cerrarse, la quitamos a los 6 segundos sí o sí.
  window.setTimeout(() => {
    if (!finished) {
      finishIntro();
    }
  }, 6000);
}
  // ----- Personalización: helper interno -----
  function ensurePersonalizacion() {
    if (!state.personalizacion || typeof state.personalizacion !== 'object') {
      state.personalizacion = {
        nombreIngresoPrincipal: 'Ingreso principal',
        tema: 'default'
      };
    }
  }

  function getNombreIngresoPrincipal() {
    ensurePersonalizacion();
    return state.personalizacion.nombreIngresoPrincipal || 'Ingreso principal';
  }

  function applyIngresoPrincipalLabel() {
    const label = document.getElementById('labelIngresoPrincipal');
    if (!label) return;
    const nombre = getNombreIngresoPrincipal();
    label.textContent = nombre + ' (€ / mes)';
  }

  function applyTheme() {
    ensurePersonalizacion();
    const tema = state.personalizacion.tema || 'default';
    const body = document.body;
    if (!body) return;
    body.setAttribute('data-theme', tema);
  }

  function marcarChipTemaActivo(tema) {
    const container = document.getElementById('temaChips');
    if (!container) return;
    const chips = container.querySelectorAll('.chip-selectable');
    chips.forEach(chip => {
      if (chip.dataset.tema === tema) {
        chip.classList.add('chip-active');
      } else {
        chip.classList.remove('chip-active');
      }
    });
  }

  function setupPersonalizacion() {
    ensurePersonalizacion();

    const inputNombre = document.getElementById('personalNombrePrincipal');
    const btnGuardar = document.getElementById('btnGuardarPersonalizacion');
    const container = document.getElementById('temaChips');

    // Nombre del ingreso principal
    if (inputNombre) {
      inputNombre.value = state.personalizacion.nombreIngresoPrincipal || '';
    }

    // Chips de tema
    if (container) {
      const chips = container.querySelectorAll('.chip-selectable');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const tema = chip.dataset.tema;
          if (!tema) return;

          // Si es tema PRO y no hay PRO activo, lo bloqueamos
          if (chip.classList.contains('chip-pro') && typeof isProActive === 'function' && !isProActive()) {
            showToast('Este tema es solo para usuarios PRO.');
            return;
          }

          ensurePersonalizacion();
          state.personalizacion.tema = tema;
          saveState();
          applyTheme();
          marcarChipTemaActivo(tema);
        });
      });

      const temaActual = state.personalizacion.tema || 'default';
      marcarChipTemaActivo(temaActual);
    }

    // Botón guardar personalización
    if (btnGuardar) {
      btnGuardar.addEventListener('click', () => {
        ensurePersonalizacion();
        const nombre = (inputNombre && inputNombre.value.trim()) || 'Ingreso principal';
        state.personalizacion.nombreIngresoPrincipal = nombre;
        saveState();
        applyIngresoPrincipalLabel();
        showToast('Personalización guardada.');
      });
    }

    // Aplicar al cargar
    applyIngresoPrincipalLabel();
    applyTheme();
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error guardando estado', e);
      showToast('No se pudo guardar en este dispositivo.');
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed) {
          state = Object.assign(state, parsed);
        }
      }
    } catch (e) {
      console.error('Error leyendo estado', e);
    }  
  }

  function monthKey(year, month) {
    return year + '-' + String(month + 1).padStart(2, '0');
  }

  function parseDateToYm(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return null;
    return { y: d.getFullYear(), m: d.getMonth() };
  }

  function getCurrentMonthKey() {
    return monthKey(currentYear, currentMonth);
  }

  function formatCurrency(value) {
    const v = Number(value) || 0;
    return v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
  }

let toastTimeout;
// === AVATARES PERFIL ===
const AVATAR_LOCALSTORAGE_KEY = 'economiaFamiliar_avatarId_v1';

const AVATAR_CONFIGS = {
  // FREE
  classic:  { emoji: '💰', tag: '' },
  minimal:  { emoji: '😀', tag: '' },
  focus:    { emoji: '🚀', tag: '' },

  // PRO
  ocean:    { emoji: '🌊', tag: '' },
  forest:   { emoji: '🌲', tag: '' },
  robot:    { emoji: '🤖', tag: '' },
  piggy:    { emoji: '🐷', tag: '' },
  music:    { emoji: '🎧', tag: '' },
  business: { emoji: '💼', tag: '' },
  gamer:    { emoji: '🕹️', tag: '' },
  traveler: { emoji: '🧭', tag: '' },
  volcano:  { emoji: '🌋', tag: '' },
  gold:     { emoji: '⭐', tag: '' },
  spectrum: { emoji: '🌈', tag: '' }
};
// ---- Logotipos de comercios / conceptos en gastos variables ----
// TODOS los logos van en: /assets/logos/<nombre>.svg

const MERCHANT_LOGOS = [
  // ===== SUPERMERCADOS =====
  {
    id: 'mercadona',
    label: 'Mercadona',
    keywords: ['mercadona'],
    logo: 'assets/logos/mercadona.svg'
  },
  {
    id: 'hiperdino',
    label: 'Hiperdino',
    keywords: ['hiperdino', 'superdino', 'hiper dino', 'super dino'],
    logo: 'assets/logos/hiperdino.svg'
  },
  {
    id: 'carrefour',
    label: 'Carrefour',
    keywords: ['carrefour'],
    logo: 'assets/logos/carrefour.svg'
  },
  {
    id: 'lidl',
    label: 'Lidl',
    keywords: ['lidl'],
    logo: 'assets/logos/lidl.svg'
  },
  {
    id: 'aldi',
    label: 'Aldi',
    keywords: ['aldi'],
    logo: 'assets/logos/aldi.svg'
  },
  {
    id: 'spar',
    label: 'Spar',
    keywords: ['spar'],
    logo: 'assets/logos/spar.svg'
  },
  {
    id: 'dia',
    label: 'DIA',
    keywords: ['dia'],
    logo: 'assets/logos/dia.svg'
  },
  {
    id: 'alcampo',
    label: 'Alcampo',
    keywords: ['alcampo'],
    logo: 'assets/logos/alcampo.svg'
  },

  // ===== GASOLINERAS / COCHE =====
  {
    id: 'repsol',
    label: 'Repsol',
    keywords: ['repsol'],
    logo: 'assets/logos/repsol.svg'
  },
  {
    id: 'cepsa',
    label: 'Cepsa',
    keywords: ['cepsa'],
    logo: 'assets/logos/cepsa.svg'
  },
  {
    id: 'bp',
    label: 'BP',
    keywords: ['bp'],
    logo: 'assets/logos/bp.svg'
  },
  {
    id: 'disa',
    label: 'Disa',
    keywords: ['disa'],
    logo: 'assets/logos/disa.svg'
  },
  {
    id: 'shell',
    label: 'Shell',
    keywords: ['shell'],
    logo: 'assets/logos/shell.svg'
  },
  {
    id: 'avia',
    label: 'Avia',
    keywords: ['avia'],
    logo: 'assets/logos/avia.svg'
  },
  {
    id: 'saras',
    label: 'Saras',
    keywords: ['saras'],
    logo: 'assets/logos/saras.svg'
  },
  {
    id: 'coche',
    label: 'Coche / taller',
    keywords: ['coche', 'taller', 'mecanico', 'neumatico', 'itv'],
    logo: 'assets/logos/coche.svg'
  },
  {
    id: 'gasolina',
    label: 'Gasolina',
    keywords: ['gasolina', 'combustible', 'gasoil'],
    logo: 'assets/logos/gasolina.svg'
  },

  // ===== HOGAR / BRICOLAJE / ELECTRÓNICA =====
  {
    id: 'ikea',
    label: 'IKEA',
    keywords: ['ikea'],
    logo: 'assets/logos/ikea.svg'
  },
  {
    id: 'leroymerlin',
    label: 'Leroy Merlin',
    keywords: ['leroy', 'leroy merlin'],
    logo: 'assets/logos/leroymerlin.svg'
  },
  {
    id: 'conforama',
    label: 'Conforama',
    keywords: ['conforama'],
    logo: 'assets/logos/conforama.svg'
  },
  {
    id: 'mediamarkt',
    label: 'MediaMarkt',
    keywords: ['mediamarkt', 'media markt'],
    logo: 'assets/logos/mediamarkt.svg'
  },
  {
    id: 'worten',
    label: 'Worten',
    keywords: ['worten'],
    logo: 'assets/logos/worten.svg'
  },
  {
    id: 'bricomart',
    label: 'Bricomart / Obramat',
    keywords: ['bricomart', 'obrarmat', 'obrabrat', 'obrabmat', 'obrabat', 'obrabramat', 'obrabrat'],
    logo: 'assets/logos/bricomart.svg'
  },

  // ===== BANCOS / FINANZAS =====
  {
    id: 'caixabank',
    label: 'CaixaBank',
    keywords: ['caixabank', 'la caixa', 'caixa'],
    logo: 'assets/logos/caixabank.svg'
  },
  {
    id: 'bbva',
    label: 'BBVA',
    keywords: ['bbva'],
    logo: 'assets/logos/bbva.svg'
  },
  {
    id: 'santander',
    label: 'Santander',
    keywords: ['santander'],
    logo: 'assets/logos/santander.svg'
  },
  {
    id: 'bankinter',
    label: 'Bankinter',
    keywords: ['bankinter'],
    logo: 'assets/logos/bankinter.svg'
  },
  {
    id: 'ing',
    label: 'ING',
    keywords: ['ing'],
    logo: 'assets/logos/ing.svg'
  },
  {
    id: 'unicaja',
    label: 'Unicaja',
    keywords: ['unicaja'],
    logo: 'assets/logos/unicaja.svg'
  },

  // ===== OPERADORES / FIBRA / MÓVIL =====
  {
    id: 'movistar',
    label: 'Movistar',
    keywords: ['movistar', 'telefonica'],
    logo: 'assets/logos/movistar.svg'
  },
  {
    id: 'vodafone',
    label: 'Vodafone',
    keywords: ['vodafone'],
    logo: 'assets/logos/vodafone.svg'
  },
  {
    id: 'orange',
    label: 'Orange',
    keywords: ['orange'],
    logo: 'assets/logos/orange.svg'
  },
  {
    id: 'yoigo',
    label: 'Yoigo',
    keywords: ['yoigo'],
    logo: 'assets/logos/yoigo.svg'
  },
  {
    id: 'digi',
    label: 'Digi',
    keywords: ['digi'],
    logo: 'assets/logos/digi.svg'
  },
  {
    id: 'masmovil',
    label: 'Masmovil',
    keywords: ['masmovil', 'mas movil'],
    logo: 'assets/logos/masmovil.svg'
  },
  {
    id: 'simyo',
    label: 'Simyo',
    keywords: ['simyo'],
    logo: 'assets/logos/simyo.svg'
  },

  // ===== ONLINE / E-COMMERCE =====
  {
    id: 'amazon',
    label: 'Amazon',
    keywords: ['amazon'],
    logo: 'assets/logos/amazon.svg'
  },
  {
    id: 'aliexpress',
    label: 'AliExpress',
    keywords: ['aliexpress', 'ali express'],
    logo: 'assets/logos/aliexpress.svg'
  },
  {
    id: 'temu',
    label: 'Temu',
    keywords: ['temu'],
    logo: 'assets/logos/temu.svg'
  },
  {
    id: 'shein',
    label: 'Shein',
    keywords: ['shein'],
    logo: 'assets/logos/shein.svg'
  },

  // ===== COMIDA RÁPIDA / RESTAURACIÓN =====
  {
    id: 'mcdonalds',
    label: 'McDonald\'s',
    keywords: ['mcdonald', 'mc donald', 'mcdonalds'],
    logo: 'assets/logos/mcdonalds.svg'
  },
  {
    id: 'burguerking',
    label: 'Burger King',
    keywords: ['burgerking', 'burger king', 'burguer king'],
    logo: 'assets/logos/burguerking.svg'
  },
  {
    id: 'kfc',
    label: 'KFC',
    keywords: ['kfc'],
    logo: 'assets/logos/kfc.svg'
  },
  {
    id: 'telepizza',
    label: 'Telepizza',
    keywords: ['telepizza'],
    logo: 'assets/logos/telepizza.svg'
  },
  {
    id: 'dominos',
    label: 'Domino\'s Pizza',
    keywords: ['dominos', 'domino', 'domino s'],
    logo: 'assets/logos/dominos.svg'
  },
  {
    id: '100montaditos',
    label: '100 Montaditos',
    keywords: ['100montaditos', '100 montaditos'],
    logo: 'assets/logos/100montaditos.svg'
  },
  {
    id: 'starbucks',
    label: 'Starbucks',
    keywords: ['starbucks'],
    logo: 'assets/logos/starbucks.svg'
  },
  {
    id: 'restaurante',
    label: 'Restaurante',
    keywords: ['restaurante', 'guachinche', 'bar', 'tasca', 'guachi'],
    logo: 'assets/logos/restaurante.svg'
  },

  // ===== TRANSPORTE / SEGUROS / TENERIFE =====
  {
    id: 'titsa',
    label: 'TITSA',
    keywords: ['titsa'],
    logo: 'assets/logos/titsa.svg'
  },
  {
    id: 'mapfre',
    label: 'Mapfre',
    keywords: ['mapfre'],
    logo: 'assets/logos/mapfre.svg'
  },
  {
    id: 'mutua',
    label: 'Mutua Madrileña',
    keywords: ['mutua'],
    logo: 'assets/logos/mutua.svg'
  },
  {
    id: 'reale',
    label: 'Reale Seguros',
    keywords: ['reale'],
    logo: 'assets/logos/reale.svg'
  },

  // ===== PLATAFORMAS / ENTRETENIMIENTO =====
  {
    id: 'netflix',
    label: 'Netflix',
    keywords: ['netflix'],
    logo: 'assets/logos/netflix.svg'
  },
  {
    id: 'spotify',
    label: 'Spotify',
    keywords: ['spotify'],
    logo: 'assets/logos/spotify.svg'
  },
  {
    id: 'hbo',
    label: 'HBO',
    keywords: ['hbo', 'hbomax', 'hbo max'],
    logo: 'assets/logos/hbo.svg'
  },
  {
    id: 'disneyplus',
    label: 'Disney+',
    keywords: ['disneyplus', 'disney plus', 'disney+'],
    logo: 'assets/logos/disneyplus.svg'
  },
  {
    id: 'amazonprimevideo',
    label: 'Prime Video',
    keywords: ['primevideo', 'prime video', 'amazon prime'],
    logo: 'assets/logos/amazonprimevideo.svg'
  },

  // ===== HOGAR: LUZ / AGUA =====
  {
    id: 'endesa',
    label: 'Endesa',
    keywords: ['endesa'],
    logo: 'assets/logos/endesa.svg'
  },
  {
    id: 'iberdrola',
    label: 'Iberdrola',
    keywords: ['iberdrola'],
    logo: 'assets/logos/iberdrola.svg'
  },
  {
    id: 'aguas',
    label: 'Aguas',
    keywords: ['agua', 'aguas', 'canalgestion', 'canal gestion'],
    logo: 'assets/logos/aguas.svg'
  },

  // ===== SALUD / FARMACIA =====
  {
    id: 'farmacia',
    label: 'Farmacia',
    keywords: ['farmacia', 'parafarmacia'],
    logo: 'assets/logos/farmacia.svg'
  },
  {
    id: 'sanitas',
    label: 'Sanitas',
    keywords: ['sanitas'],
    logo: 'assets/logos/sanitas.svg'
  },
  {
    id: 'asisa',
    label: 'Asisa',
    keywords: ['asisa'],
    logo: 'assets/logos/asisa.svg'
  },
  {
    id: 'adeslas',
    label: 'Adeslas',
    keywords: ['adeslas'],
    logo: 'assets/logos/adeslas.svg'
  },
  {
    id: 'quiron',
    label: 'Quirón',
    keywords: ['quiron', 'quiron salud', 'quironsalud'],
    logo: 'assets/logos/quiron.svg'
  },

  // ===== SERVICIOS LOCALES / COLEGIOS / VARIOS =====
  {
    id: 'colegio',
    label: 'Colegio',
    keywords: ['colegio', 'escuela', 'instituto', 'ampa'],
    logo: 'assets/logos/colegio.svg'
  },
  {
    id: 'online',
    label: 'Compra online',
    keywords: ['compra online', 'online'],
    logo: 'assets/logos/online.svg'
  },
  {
    id: 'suscripcion',
    label: 'Suscripción',
    keywords: ['suscripcion', 'subscription', 'sub'],
    logo: 'assets/logos/suscripcion.svg'
  },
  {
    id: 'ropa',
    label: 'Ropa',
    keywords: ['zara', 'pull and bear', 'pull&bear', 'bershka', 'hm', 'h&m', 'stradivarius', 'lefties'],
    logo: 'assets/logos/ropa.svg'
  },
  {
    id: 'alimentacion',
    label: 'Alimentación',
    keywords: ['alimentacion', 'comida', 'super', 'supermercado'],
    logo: 'assets/logos/alimentacion.svg'
  }
];

// Devuelve info de comercio (logo + etiqueta) según categoría y descripción
function getMerchantInfo(categoriaRaw, descRaw) {
  const categoria = (categoriaRaw || '').toLowerCase();
  const desc = (descRaw || '').toLowerCase();

  for (const cfg of MERCHANT_LOGOS) {
    const kws = cfg.keywords || [];
    const match = kws.some(kw =>
      categoria.includes(kw.toLowerCase()) ||
      desc.includes(kw.toLowerCase())
    );
    if (match) {
      return {
        logoUrl: cfg.logo || null,
        label: cfg.label || cfg.id
      };
    }
  }

  // Si no hay logo configurado, devolvemos solo una etiqueta genérica
  const base =
    categoria ||
    (descRaw || '').split(' ')[0] ||
    '';

  const label = base
    ? base.charAt(0).toUpperCase() + base.slice(1)
    : 'Gasto';

  return {
    logoUrl: null,
    label
  };
}
function isProEnabledForUI() {
  try {
    if (typeof isProActive === 'function') {
      return isProActive();
    }
  } catch (e) {
    // si no existe isProActive, consideramos que no hay PRO
  }
  return false;
}
function stripHtmlToPlainText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || '';
  return text.trim();
}

// Genera una versión en texto plano bonita según el tipo de informe
function buildPlainTextReport(title, containerId, htmlFallback) {
  let lines = [];

  // ---- Informe de HUCHAS ----
  if (containerId === 'informeHuchasContenido') {
    const huchas = state.huchas || [];
    lines.push(title.toUpperCase());
    lines.push('');

    if (!huchas.length) {
      lines.push('No tienes ninguna hucha creada.');
      return lines.join('\n');
    }

    const totalHuchas = huchas.length;
    const totalSaldo = huchas.reduce((s, h) => s + (Number(h.saldo) || 0), 0);
    const totalObjetivo = huchas.reduce((s, h) => s + (Number(h.objetivo) || 0), 0);
    const pctGlobal = totalObjetivo > 0 ? Math.min(100, (totalSaldo / totalObjetivo) * 100) : 0;

    lines.push('Resumen general');
    lines.push(`- Número de huchas: ${totalHuchas}`);
    lines.push(`- Saldo acumulado: ${formatCurrency(totalSaldo)}`);
    if (totalObjetivo > 0) {
      lines.push(`- Objetivo total: ${formatCurrency(totalObjetivo)}`);
      lines.push(`- Progreso global: ${pctGlobal.toFixed(1)} %`);
    }
    lines.push('');
    lines.push('Detalle por hucha:');

    huchas.forEach(h => {
      const saldo = Number(h.saldo) || 0;
      const objetivo = Number(h.objetivo) || 0;
      const nombre = h.nombre || 'Hucha sin nombre';

      lines.push(`• ${nombre}`);
      if (objetivo > 0) {
        const pct = Math.min(100, (saldo / objetivo) * 100);
        lines.push(`   - Saldo: ${formatCurrency(saldo)}`);
        lines.push(`   - Objetivo: ${formatCurrency(objetivo)}`);
        lines.push(`   - Progreso: ${pct.toFixed(1)} %`);
      } else {
        lines.push(`   - Saldo: ${formatCurrency(saldo)}`);
        lines.push('   - Sin objetivo definido');
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  // ---- Informe MENSUAL ----
  if (containerId === 'informeMensualContenido') {
    const ingresosBaseTotal = getIngresosBaseTotal();
    const ingresosPuntualesMes = getIngresosPuntualesMes(currentYear, currentMonth)
      .reduce((s, i) => s + (Number(i.importe) || 0), 0);
    const ingresosTotales = ingresosBaseTotal + ingresosPuntualesMes;

    const gastosMes = getGastosMes(currentYear, currentMonth);
    const totalGastosVar = gastosMes.reduce((s, g) => s + (Number(g.importe) || 0), 0);
    const totalFijos = getTotalFijos();
    const totalGastos = totalFijos + totalGastosVar;
    const balance = ingresosTotales - totalGastos;
    const totalHuchas = (state.huchas || []).reduce((s, h) => s + (Number(h.saldo) || 0), 0);

    const mesLabel = monthNames[currentMonth] + ' ' + currentYear;

    lines.push(`${title.toUpperCase()} - ${mesLabel}`);
    lines.push('');
    lines.push('INGRESOS');
    lines.push(`- Ingresos base: ${formatCurrency(ingresosBaseTotal)}`);
    lines.push(`- Ingresos puntuales: ${formatCurrency(ingresosPuntualesMes)}`);
    lines.push(`- Total ingresos: ${formatCurrency(ingresosTotales)}`);
    lines.push('');
    lines.push('GASTOS');
    lines.push(`- Gastos fijos: ${formatCurrency(totalFijos)}`);
    lines.push(`- Gastos variables: ${formatCurrency(totalGastosVar)}`);
    lines.push(`- Total gastos: ${formatCurrency(totalGastos)}`);
    lines.push('');
    lines.push('BALANCE Y AHORRO');
    lines.push(`- Balance del mes: ${formatCurrency(balance)}`);
    lines.push(`- Saldo acumulado en huchas: ${formatCurrency(totalHuchas)}`);

    return lines.join('\n');
  }

  // ---- Informe de GASTOS FIJOS ----
  if (containerId === 'informesContenido') {
    const categorias = ['Suministros', 'Préstamos', 'Suscripciones', 'Varios'];
    const resumen = {};
    categorias.forEach(cat => {
      resumen[cat] = { total: 0, items: [] };
    });

    (state.fijos || []).forEach(f => {
      const cat = f.categoria || 'Varios';
      if (!resumen[cat]) {
        resumen[cat] = { total: 0, items: [] };
      }
      resumen[cat].total += Number(f.importe) || 0;
      resumen[cat].items.push(f);
    });

    const totalGlobal = Object.values(resumen).reduce((s, r) => s + r.total, 0);

    lines.push(title.toUpperCase());
    lines.push('');

    if (!totalGlobal) {
      lines.push('No tienes gastos fijos configurados.');
      return lines.join('\n');
    }

    lines.push('Totales por categoría:');
    categorias.forEach(cat => {
      const r = resumen[cat];
      if (!r || r.total === 0) return;
      lines.push(`- ${cat}: ${formatCurrency(r.total)}`);
    });
    lines.push('');
    lines.push(`TOTAL GENERAL: ${formatCurrency(totalGlobal)}`);
    lines.push('');
    lines.push('Detalle por categoría:');

    categorias.forEach(cat => {
      const r = resumen[cat];
      if (!r || !r.items.length) return;
      lines.push('');
      lines.push(cat.toUpperCase());
      r.items.forEach(i => {
        lines.push(`• ${i.nombre || 'Sin nombre'}: ${formatCurrency(i.importe)}`);
      });
    });

    return lines.join('\n');
  }

  // Fallback genérico: por si algún día usamos esta función con otro informe
  return stripHtmlToPlainText(htmlFallback || '');
}

function handleProReportExport(action, title, containerId) {
  // 1) Comprobación PRO
  if (!isProActive || !isProActive()) {
    showToast('Solo usuarios PRO pueden compartir o imprimir informes. Activa PRO en Config.');

    // Cambiamos a la pestaña de Configuración
    if (typeof activateTab === 'function') {
      activateTab('config');
    }

    // Después de un pequeño delay, subimos ARRIBA DEL TODO
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 150);

    return;
  }

  // 2) Localizar el contenedor del informe
  const cont = document.getElementById(containerId);
  if (!cont) {
    showToast('No se ha encontrado el contenido del informe.');
    return;
  }

  let html = cont.innerHTML || '';
  if (!html.trim()) {
    showToast('El informe está vacío.');
    return;
  }

  // 3) Compartir (texto plano)
  if (action === 'share') {
    const text = buildPlainTextReport(title, containerId, html);

    if (navigator.share) {
      navigator.share({
        title,
        text
      }).catch(() => {
        // usuario canceló, no pasa nada
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Informe copiado al portapapeles.'))
        .catch(() => showToast('No se pudo copiar el informe.'));
    } else {
      showToast('Tu navegador no permite compartir directamente este informe.');
    }

  // 4) Imprimir (ventana nueva con HTML limpio y CSS controlado)
  } else if (action === 'print') {
    const win = window.open('', '_blank');
    if (!win) {
      showToast('No se pudo abrir la ventana de impresión.');
      return;
    }

    // Función de cierre seguro de la ventana
    const safeClose = () => {
      try {
        win.close();
      } catch (e) {
        // ignoramos errores al cerrar
      }
    };

    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 16px;
            color: #111827;
            background: #ffffff;
          }
          h1 {
            font-size: 1.3rem;
            margin-bottom: 12px;
          }
          .informe-print {
            font-size: 0.9rem;
          }
          .cat-block {
            margin-bottom: 12px;
          }
          .bar-container {
            width: 100%;
            height: 10px;
            background: #e5e7eb;
            border-radius: 999px;
            overflow: hidden;
          }
          .bar {
            height: 100%;
            background: #6366f1;
          }

          /* Límite global para imágenes dentro del informe */
          .informe-print img {
            max-width: 40px;
            max-height: 40px;
            height: auto;
            width: auto;
            display: inline-block;
          }

          /* Wrapper redondo para logos de comercios (si llega en el HTML) */
          .expense-merchant-logo-wrap {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            vertical-align: middle;
            margin-right: 6px;
          }
          .expense-merchant-logo-wrap img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .expense-merchant-initial {
            font-weight: 600;
            font-size: 0.9rem;
            color: #4f46e5;
          }

          /* Cabecera del informe impreso */
          .logo-print {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
          }

          .logo-print img {
            width: 32px;
            height: 32px;
            object-fit: contain;
          }

          .logo-print-title {
            font-size: 1.05rem;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="logo-print">
          <img src="apple-touch-icon.png" alt="Flujo Fácil" />
          <div class="logo-print-title">${title}</div>
        </div>
        <div class="informe-print">
          ${html}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();

    try {
      win.print();
    } catch (e) {
      // si print falla, intentamos cerrar igualmente
      setTimeout(safeClose, 300);
    }
  }
}nction getStoredAvatarId() {
  try {
    const raw = localStorage.getItem(AVATAR_LOCALSTORAGE_KEY);
    if (!raw) return 'classic';
    if (AVATAR_CONFIGS[raw]) return raw;
    return 'classic';
  } catch (e) {
    return 'classic';
  }
}

function storeAvatarId(id) {
  try {
    localStorage.setItem(AVATAR_LOCALSTORAGE_KEY, id);
  } catch (e) {
    // ignorar errores de storage
  }
}

function applyAvatarToHeader() {
  const avatarId = getStoredAvatarId();
  const cfg = AVATAR_CONFIGS[avatarId] || AVATAR_CONFIGS.classic;

  const avatarEmojiEl = document.getElementById('userAvatarEmoji');
  const avatarTagEl = document.getElementById('userAvatarTag');
  const avatarRoot = document.getElementById('userAvatar');
  const avatarCurrentEmoji = document.getElementById('avatarCurrentEmoji');

  if (avatarEmojiEl) {
    avatarEmojiEl.textContent = cfg.emoji;
  }
  if (avatarRoot) {
    avatarRoot.dataset.avatarId = avatarId;
  }

  if (avatarTagEl) {
    if (cfg.tag && cfg.tag.trim() !== '') {
      avatarTagEl.textContent = cfg.tag;
      avatarTagEl.style.display = 'inline-flex';
    } else {
      avatarTagEl.textContent = '';
      avatarTagEl.style.display = 'none';
    }
  }

  if (avatarCurrentEmoji) {
    avatarCurrentEmoji.textContent = cfg.emoji;
  }

  markSelectedAvatarInGrid(avatarId);
}

function markSelectedAvatarInGrid(avatarId) {
  const grid = document.getElementById('avatarGridModal');
  if (!grid) return;

  const options = grid.querySelectorAll('.avatar-option');
  options.forEach(btn => {
    const id = btn.getAttribute('data-avatar-id');
    if (id === avatarId) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

function setupAvatarSelector() {
  const grid = document.getElementById('avatarGridModal');
  const modal = document.getElementById('avatarModal');
  const btnOpen = document.getElementById('btnOpenAvatarModal');
  const btnClose = document.getElementById('avatarModalClose');
  const btnCancel = document.getElementById('avatarModalCancel');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => {
      modal.classList.add('active');
      const currentId = getStoredAvatarId();
      markSelectedAvatarInGrid(currentId);
    });
  }

  [btnClose, btnCancel].forEach(btn => {
    if (btn && modal) {
      btn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }
  });

  if (!grid || !modal) return;

  const options = grid.querySelectorAll('.avatar-option');
  const currentId = getStoredAvatarId();
  markSelectedAvatarInGrid(currentId);

  options.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-avatar-id');
      const isProAvatar = btn.classList.contains('avatar-pro');

      if (isProAvatar && !isProEnabledForUI()) {
        showToast('Este avatar es PRO. Activa el modo PRO para usarlo.');
        return;
      }

      storeAvatarId(id);
      applyAvatarToHeader();
      showToast('Avatar actualizado');
      modal.classList.remove('active');
    });
  });
}
function showToast(message) {
  const t = document.getElementById("toast");
  if (!t) return;

  // Limpiar timeout previo
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Meter el mensaje (permitimos HTML simple)
  t.innerHTML = `<div style="padding:4px 0">${message}</div>`;
  t.classList.add("show");

  // Función para ocultar el toast
  const hide = () => {
    t.classList.remove("show");
    document.removeEventListener("click", hide);
    document.removeEventListener("touchstart", hide);
  };

  // IMPORTANTE:
  // Esperamos un poquito antes de enganchar el "tap para cerrar"
  // para NO capturar el mismo click que disparó el toast.
  setTimeout(() => {
    document.addEventListener("click", hide, { once: true });
    document.addEventListener("touchstart", hide, { once: true });
  }, 200);

  // Autocierre a los 6.5 segundos
  toastTimeout = setTimeout(() => {
    hide();
  }, 6500);
}

  // ----- Modal confirmación -----
  let pendingConfirm = null;
  
  function openConfirm(message, onOk, actionLabel) {
  const overlay = document.getElementById('confirmModal');
  const msgEl = document.getElementById('confirmMessage');
  const okBtn = document.getElementById('confirmOk');

  if (!overlay || !msgEl || !okBtn) return;

  // Mensaje del modal
  msgEl.textContent = message || '¿Seguro que quieres eliminar este elemento?';

  // Texto del botón de acción (por defecto "Eliminar")
  okBtn.textContent = actionLabel || 'Eliminar';

  // Guardamos la callback pendiente
  pendingConfirm = typeof onOk === 'function' ? onOk : null;

  overlay.classList.add('active');
}
  function closeConfirm() {
    const overlay = document.getElementById('confirmModal');
    if (overlay) overlay.classList.remove('active');
    pendingConfirm = null;
  }

  // ----- Navegación por meses -----
  function updateMonthDisplay() {
    const span = document.getElementById('monthDisplay');
    if (!span) return;
    span.textContent = monthNames[currentMonth] + ' ' + currentYear;
    const pickerYear = document.getElementById('pickerYear');
    if (pickerYear) pickerYear.textContent = currentYear;
    const mk = getCurrentMonthKey();
    const monthsGrid = document.getElementById('monthsGrid');
    if (monthsGrid) {
      monthsGrid.querySelectorAll('.month-btn').forEach((btn, idx) => {
        const btnKey = monthKey(currentYear, idx);
        btn.classList.toggle('selected', btnKey === mk);
      });
    }
  }

  function changeMonth(diff) {
    currentMonth += diff;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }
    updateMonthDisplay();
    renderAll();
  }

  function setupMonthPicker() {
    const dropdown = document.getElementById('monthPickerDropdown');
    const display = document.getElementById('monthDisplay');
    const monthsGrid = document.getElementById('monthsGrid');
    const yearPrev = document.getElementById('yearPrev');
    const yearNext = document.getElementById('yearNext');

    if (!dropdown || !display || !monthsGrid || !yearPrev || !yearNext) return;

    // construir botones meses
    monthsGrid.innerHTML = '';
    monthNames.forEach((name, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'month-btn';
      btn.textContent = name.slice(0, 3);
      btn.dataset.monthIndex = String(idx);
      monthsGrid.appendChild(btn);
    });

    display.addEventListener('click', () => {
      dropdown.classList.toggle('active');
    });

    yearPrev.addEventListener('click', () => {
      currentYear -= 1;
      updateMonthDisplay();
    });
    yearNext.addEventListener('click', () => {
      currentYear += 1;
      updateMonthDisplay();
    });

    monthsGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.month-btn');
      if (!btn) return;
      const idx = Number(btn.dataset.monthIndex || '0');
      currentMonth = idx;
      updateMonthDisplay();
      dropdown.classList.remove('active');
      renderAll();
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== display) {
        dropdown.classList.remove('active');
      }
    });
  }

// ----- Tabs (botones inferiores) -----
function activateTab(tab, animateDirection) {
  const sections = Array.from(document.querySelectorAll('.tab-section'));
  const btns = Array.from(document.querySelectorAll('.tab-btn'));

  const current = document.querySelector('.tab-section.active');
  const next = sections.find(sec => sec.dataset.tab === tab);
  if (!next || next === current) return;

  // Actualizar estado de los botones inferiores
  btns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tabTarget === tab);
  });

  // Limpiar restos de animación
  sections.forEach(sec => sec.classList.remove('off-left'));

  // Si no hay dirección (click normal) → animación básica de siempre
  if (!animateDirection || !current) {
    if (current) current.classList.remove('active');
    next.classList.add('active');
    return;
  }

  if (animateDirection === 'right') {
    // Swipe hacia la derecha → vamos a la pestaña anterior
    // Queremos que la nueva entre desde la izquierda

    // Colocamos la nueva pestaña a -100% a la izquierda
    next.classList.add('off-left');
    next.classList.add('active'); // activa (opacity 1, pero sigue a -100%)

    // Forzamos reflow para que el navegador “registre” la posición inicial
    // antes de quitar off-left
    void next.offsetWidth;

    // Quitamos off-left → pasa de -100% a 0 con la transición
    next.classList.remove('off-left');

    // La actual pierde active → de 0 pasa a 100% (sale a la derecha)
    current.classList.remove('active');

  } else if (animateDirection === 'left') {
    // Swipe hacia la izquierda → vamos a la pestaña siguiente
    // Comportamiento normal: nueva desde la derecha (100% → 0)
    if (current) current.classList.remove('active');
    next.classList.add('active');
  }
}

window.activateTab = activateTab;

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tabTarget;
      if (!tab) return;
      activateTab(tab); // sin animación especial, solo cambio de pestaña
    });
  });
}

  // ----- Cálculos por mes -----
  function getIngresosBaseTotal() {
    const ib = state.ingresosBase || {};
    return (Number(ib.juan) || 0) + (Number(ib.saray) || 0) + (Number(ib.otros) || 0);
  }

  function getIngresosPuntualesMes(year, month) {
    const mk = monthKey(year, month);
    return state.ingresosPuntuales.filter(ip => {
      const ym = parseDateToYm(ip.fecha);
      return ym && monthKey(ym.y, ym.m) === mk;
    });
  }

  function getGastosMes(year, month) {
    const mk = monthKey(year, month);
    return state.gastos.filter(g => {
      const ym = parseDateToYm(g.fecha);
      return ym && monthKey(ym.y, ym.m) === mk;
    });
  }

  function getTotalFijos() {
    return state.fijos.reduce((s, f) => s + (Number(f.importe) || 0), 0);
  }

  function updateResumenYChips() {
    const mk = getCurrentMonthKey();
    const ingresosBase = getIngresosBaseTotal();
    const ingresosPuntualesMes = getIngresosPuntualesMes(currentYear, currentMonth);
    const totalIngPuntuales = ingresosPuntualesMes.reduce((s, ip) => s + (Number(ip.importe) || 0), 0);
    const ingresosTotales = ingresosBase + totalIngPuntuales;

    const gastosMes = getGastosMes(currentYear, currentMonth);
    const totalGastosVar = gastosMes.reduce((s, g) => s + (Number(g.importe) || 0), 0);
    const totalFijos = getTotalFijos();
    const totalGastos = totalFijos + totalGastosVar;
    const balance = ingresosTotales - totalGastos;

    const chipIngresos = document.getElementById('chipIngresos');
    const chipGastos = document.getElementById('chipGastos');
    const chipBalance = document.getElementById('chipBalance');
    const chipBalanceWrap = document.getElementById('chipBalanceWrap');
    const chipHuchasTotal = document.getElementById('chipHuchasTotal');

    if (chipIngresos) chipIngresos.textContent = formatCurrency(ingresosTotales);
    if (chipGastos) chipGastos.textContent = formatCurrency(totalGastos);
    if (chipBalance) chipBalance.textContent = formatCurrency(balance);
    if (chipBalanceWrap) {
      chipBalanceWrap.classList.remove('balance-pos', 'balance-neg');
      chipBalanceWrap.classList.add(balance >= 0 ? 'balance-pos' : 'balance-neg');
    }

    const totalHuchas = state.huchas.reduce((s, h) => s + (Number(h.saldo) || 0), 0);
    if (chipHuchasTotal) {
      chipHuchasTotal.textContent = 'Huchas: ' + formatCurrency(totalHuchas);
    }

    // Resumen detalle
    const resIngMes = document.getElementById('resIngMes');
    const resFijosMes = document.getElementById('resFijosMes');
    const resVarMes = document.getElementById('resVarMes');
    const resBalMes = document.getElementById('resBalMes');
    if (resIngMes) resIngMes.textContent = formatCurrency(ingresosTotales);
    if (resFijosMes) resFijosMes.textContent = formatCurrency(totalFijos);
    if (resVarMes) resVarMes.textContent = formatCurrency(totalGastosVar);
    if (resBalMes) resBalMes.textContent = formatCurrency(balance);
  }
// ----- Informe de Gastos Fijos -----
function generarInformeFijos() {
  const overlay = document.getElementById("modalInformes");
  const cont = document.getElementById("informesContenido");
  if (!overlay || !cont) return;

  const categorias = ["Suministros", "Préstamos", "Suscripciones", "Varios"];

  // Agrupar totales por categoría
  const resumen = {};
  categorias.forEach(cat => resumen[cat] = { total: 0, items: [] });

  state.fijos.forEach(f => {
    const cat = f.categoria || "Varios";
    if (!resumen[cat]) resumen[cat] = { total: 0, items: [] };
    resumen[cat].total += f.importe;
    resumen[cat].items.push(f);
  });

  const totalGlobal = Object.values(resumen).reduce((a, b) => a + b.total, 0);
  let html = "";

  categorias.forEach(cat => {
    const { total, items } = resumen[cat];
    if (total === 0) return;

    const pct = totalGlobal > 0 ? (total / totalGlobal) * 100 : 0;

    html += `
      <div class="cat-block">
        <h3>${cat}</h3>
        <div class="bar-container">
          <div class="bar" style="width:${pct}%"></div>
        </div>
        <div class="cat-total">Total: ${formatCurrency(total)}</div>
        <div class="elem-list">
          ${items.map(i => `• ${i.nombre}: ${formatCurrency(i.importe)}`).join("<br>")}
        </div>
      </div>
    `;
  });

  html += `
    <div style="margin-top:15px; font-weight:600;">
      TOTAL GENERAL: ${formatCurrency(totalGlobal)}
    </div>
  `;

  cont.innerHTML = html;
  overlay.classList.add("active");
}
  // ----- Informe de gastos variables -----
function generarInformeGastosVariables() {
  const overlay = document.getElementById('modalInformeGastos');
  const cont = document.getElementById('informeGastosContenido');
  if (!overlay || !cont) return;

  const gastosMes = getGastosMes(currentYear, currentMonth);
  if (!Array.isArray(gastosMes) || !gastosMes.length) {
    cont.innerHTML = `
      <div class="cat-block">
        <h3>Sin gastos este mes</h3>
        <p style="font-size:0.9rem; color:var(--muted);">
          Registra algunos gastos en la pestaña <strong>Gastos</strong> para ver el informe detallado.
        </p>
      </div>
    `;
    overlay.classList.add('active');
    return;
  }

  const totalGlobal = gastosMes.reduce(
    (s, g) => s + (Number(g.importe) || 0),
    0
  );
  const mesLabel = monthNames[currentMonth] + ' ' + currentYear;

  const pct = (valor) => {
    if (totalGlobal <= 0) return 0;
    return Math.min(100, (valor / totalGlobal) * 100);
  };

  // 1) Agrupamos por categoría
  const porCategoria = {};
  gastosMes.forEach(g => {
    const cat = (g.categoria || 'Sin categoría').trim() || 'Sin categoría';
    if (!porCategoria[cat]) {
      porCategoria[cat] = {
        total: 0,
        items: []
      };
    }
    const imp = Number(g.importe) || 0;
    porCategoria[cat].total += imp;
    porCategoria[cat].items.push(g);
  });

  let html = `
    <div style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--muted);">
      Mes actual: <strong>${mesLabel}</strong><br>
      Total gastos variables del mes: <strong>${formatCurrency(totalGlobal)}</strong>
    </div>
  `;

  // 2) Por cada categoría, agrupamos por comercio (usando logos)
  Object.keys(porCategoria)
    .sort((a, b) => a.localeCompare(b, 'es'))
    .forEach(cat => {
      const dataCat = porCategoria[cat];
      const totalCat = dataCat.total;
      const itemsCat = dataCat.items;

      // Agrupación por comerciante
      const porMerchant = {};
      itemsCat.forEach(g => {
        const info = getMerchantInfo(g.categoria || '', g.desc || '');
        const key = info.label || 'Otros';
        if (!porMerchant[key]) {
          porMerchant[key] = {
            label: info.label || key,
            logoUrl: info.logoUrl || null,
            total: 0,
            movimientos: 0,
            items: []
          };
        }
        const imp = Number(g.importe) || 0;
        porMerchant[key].total += imp;
        porMerchant[key].movimientos += 1;
        porMerchant[key].items.push(g);
      });

      html += `
        <div class="cat-block">
          <h3>${cat}</h3>
          <div class="cat-total">
            Total categoría: <strong>${formatCurrency(totalCat)}</strong>
            · ${itemsCat.length} movimiento${itemsCat.length === 1 ? '' : 's'}
          </div>
          <div class="bar-container">
            <div class="bar" style="width:${pct(totalCat)}%;"></div>
          </div>
          <div class="merchant-list">
      `;

      Object.values(porMerchant)
        .sort((a, b) => b.total - a.total)
        .forEach(m => {
          const inicial = m.label ? m.label.charAt(0).toUpperCase() : '?';
          const logoHtml = m.logoUrl
            ? `<img src="${m.logoUrl}" alt="${m.label}" />`
            : `<span class="expense-merchant-initial">${inicial}</span>`;

          html += `
            <div class="merchant-block">
              <div class="merchant-header">
                <div class="expense-merchant-logo-wrap">
                  ${logoHtml}
                </div>
                <div class="merchant-header-text">
                  <div class="merchant-name">${m.label}</div>
                  <div class="merchant-total">
                    Total: ${formatCurrency(m.total)}
                    · ${m.movimientos} movimiento${m.movimientos === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <div class="merchant-items">
          `;

          m.items
            .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
            .forEach(g => {
              const descText = (g.desc && g.desc.trim()) ? g.desc.trim() : 'Sin descripción';
              html += `
                <div class="merchant-item-line">
                  ${g.fecha || ''} · ${descText} ·
                  <strong>${formatCurrency(g.importe)}</strong>
                </div>
              `;
            });

          html += `
              </div>
            </div>
          `;
        });

      html += `
          </div>
        </div>
      `;
    });

  cont.innerHTML = html;
  overlay.classList.add('active');
}
  // ----- Informe mensual básico -----
function generarInformeMensual() {
  const overlay = document.getElementById('modalInformeMensual');
  const cont = document.getElementById('informeMensualContenido');
  if (!overlay || !cont) return;

  // Cálculos (mismo criterio que updateResumenYChips)
  const ingresosBaseTotal = getIngresosBaseTotal();
  const ingresosPuntualesMes = getIngresosPuntualesMes(currentYear, currentMonth)
    .reduce((s, i) => s + (Number(i.importe) || 0), 0);
  const ingresosTotales = ingresosBaseTotal + ingresosPuntualesMes;

  const gastosMes = getGastosMes(currentYear, currentMonth);
  const totalGastosVar = gastosMes.reduce((s, g) => s + (Number(g.importe) || 0), 0);
  const totalFijos = getTotalFijos();
  const totalGastos = totalFijos + totalGastosVar;
  const balance = ingresosTotales - totalGastos;

  const totalHuchas = state.huchas.reduce((s, h) => s + (Number(h.saldo) || 0), 0);

  const mesLabel = monthNames[currentMonth] + ' ' + currentYear;

  // Para barras: porcentaje dentro de ingresos totales (limitado al 100%)
  const pct = (valor) => {
    if (ingresosTotales <= 0) return 0;
    return Math.min(100, (valor / ingresosTotales) * 100);
  };

  let html = '';

  html += `
    <div style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--muted);">
      Mes actual: <strong>${mesLabel}</strong>
    </div>

    <div class="cat-block">
      <h3>Ingresos del mes</h3>
      <div class="cat-total">Ingresos base: <strong>${formatCurrency(ingresosBaseTotal)}</strong></div>
      <div class="bar-container">
        <div class="bar" style="width: ${pct(ingresosBaseTotal)}%;"></div>
      </div>

      <div class="cat-total" style="margin-top: 0.5rem;">Ingresos puntuales: <strong>${formatCurrency(ingresosPuntualesMes)}</strong></div>
      <div class="bar-container">
        <div class="bar" style="width: ${pct(ingresosPuntualesMes)}%;"></div>
      </div>

      <div class="cat-total" style="margin-top: 0.6rem; font-size: 1rem;">
        Total ingresos: <strong>${formatCurrency(ingresosTotales)}</strong>
      </div>
    </div>

    <div class="cat-block">
      <h3>Gastos del mes</h3>
      <div class="cat-total">Gastos fijos: <strong>${formatCurrency(totalFijos)}</strong></div>
      <div class="bar-container">
        <div class="bar" style="width: ${pct(totalFijos)}%;"></div>
      </div>

      <div class="cat-total" style="margin-top: 0.5rem;">Gastos variables: <strong>${formatCurrency(totalGastosVar)}</strong></div>
      <div class="bar-container">
        <div class="bar" style="width: ${pct(totalGastosVar)}%;"></div>
      </div>

      <div class="cat-total" style="margin-top: 0.6rem; font-size: 1rem;">
        Total gastos: <strong>${formatCurrency(totalGastos)}</strong>
      </div>
    </div>

    <div class="cat-block">
      <h3>Balance y ahorro</h3>
      <div class="cat-total">
        Balance del mes:
        <strong style="color: ${balance >= 0 ? '#10b981' : '#ef4444'};">
          ${formatCurrency(balance)}
        </strong>
      </div>

      <div class="cat-total" style="margin-top: 0.5rem;">
        Saldo acumulado en huchas:
        <strong>${formatCurrency(totalHuchas)}</strong>
      </div>
    </div>
  `;

  cont.innerHTML = html;
  overlay.classList.add('active');
}
  // ----- Informe básico de huchas -----
  function generarInformeHuchas() {
    const overlay = document.getElementById('modalInformeHuchas');
    const cont = document.getElementById('informeHuchasContenido');
    if (!overlay || !cont) return;

    const huchas = state.huchas || [];

    const totalHuchas = huchas.length;
    const totalSaldo = huchas.reduce((s, h) => s + (Number(h.saldo) || 0), 0);
    const totalObjetivo = huchas.reduce((s, h) => s + (Number(h.objetivo) || 0), 0);

    const pctGlobal = totalObjetivo > 0
      ? Math.min(100, (totalSaldo / totalObjetivo) * 100)
      : 0;

    let html = '';

    if (totalHuchas === 0) {
      html += `
        <div class="cat-block">
          <h3>Sin huchas todavía</h3>
          <p style="font-size:0.9rem; color:var(--muted);">
            Crea tu primera hucha en la pestaña <strong>Huchas</strong> para empezar a ahorrar para objetivos concretos.
          </p>
        </div>
      `;
    } else {
      // Resumen general
      html += `
        <div class="cat-block">
          <h3>Resumen general</h3>
          <div class="cat-total">
            Número de huchas: <strong>${totalHuchas}</strong>
          </div>
          <div class="cat-total" style="margin-top:0.25rem;">
            Saldo acumulado: <strong>${formatCurrency(totalSaldo)}</strong>
          </div>
      `;

      if (totalObjetivo > 0) {
        html += `
          <div class="cat-total" style="margin-top:0.25rem;">
            Objetivo total: <strong>${formatCurrency(totalObjetivo)}</strong>
          </div>
          <div class="cat-total" style="margin-top:0.5rem;">
            Progreso global:
            <strong>${pctGlobal.toFixed(1)}%</strong>
          </div>
          <div class="bar-container">
            <div class="bar" style="width:${pctGlobal}%;"></div>
          </div>
        `;
      }

      html += `
        </div>
      `;

      // Detalle por hucha
      html += `
        <div class="cat-block">
          <h3>Detalle por hucha</h3>
      `;

      huchas.forEach(h => {
        const saldo = Number(h.saldo) || 0;
        const objetivo = Number(h.objetivo) || 0;
        let pct = 0;
        if (objetivo > 0) {
          pct = Math.min(100, (saldo / objetivo) * 100);
        }

        if (objetivo > 0) {
          html += `
            <div class="cat-total" style="margin-top:0.5rem;">
              <div style="font-weight:600;">${h.nombre || 'Hucha sin nombre'}</div>
              <div style="font-size:0.9rem; color:var(--muted); margin-top:0.1rem;">
                Saldo: <strong>${formatCurrency(saldo)}</strong>
                &nbsp;·&nbsp; Objetivo: <strong>${formatCurrency(objetivo)}</strong>
                &nbsp;·&nbsp; Progreso: <strong>${pct.toFixed(1)}%</strong>
              </div>
              <div class="bar-container">
                <div class="bar" style="width:${pct}%;"></div>
              </div>
            </div>
          `;
        } else {
          html += `
            <div class="cat-total" style="margin-top:0.5rem;">
              <div style="font-weight:600;">${h.nombre || 'Hucha sin nombre'}</div>
              <div style="font-size:0.9rem; color:var(--muted); margin-top:0.1rem;">
                Saldo: <strong>${formatCurrency(saldo)}</strong>
                &nbsp;·&nbsp; <span style="font-style:italic;">Sin objetivo definido</span>
              </div>
            </div>
          `;
        }
      });

          // Envolvemos el contenido con la cabecera corporativa, igual que otros informes
    html = `
      <div class="logo-print">
        <img src="assets/logo_flujo_facil.svg" alt="Flujo Fácil" />
        <div class="logo-print-title">Informe de huchas · Flujo Fácil</div>
      </div>
      ${html}
    `;

    cont.innerHTML = html;
    overlay.classList.add('active');
  }
// ----- Ingresos base -----
function setupIngresosBase() {
  const ingJuan = document.getElementById('ingJuan');
  const ingSaray = document.getElementById('ingSaray');
  const ingOtros = document.getElementById('ingOtros');
  const btnSave = document.getElementById('btnSaveIngresos');

  // Garantizar estructura en state
  if (!state.ingresosBase || typeof state.ingresosBase !== 'object') {
    state.ingresosBase = { juan: 0, saray: 0, otros: 0 };
  }

  if (ingJuan) ingJuan.value = state.ingresosBase.juan || '';
  if (ingSaray) ingSaray.value = state.ingresosBase.saray || '';
  if (ingOtros) ingOtros.value = state.ingresosBase.otros || '';

  if (btnSave) {
    btnSave.addEventListener('click', function () {
      state.ingresosBase = {
        juan: parseNumberSafe(ingJuan && ingJuan.value),
        saray: parseNumberSafe(ingSaray && ingSaray.value),
        otros: parseNumberSafe(ingOtros && ingOtros.value)
      };
      saveState();
      updateResumenYChips();
      showToast('Ingresos base guardados.');
    });
  }
}
  // ----- Ingresos puntuales -----
  function renderIngresosPuntualesLista() {
    const cont = document.getElementById('ingresosPuntualesLista');
    if (!cont) return;

    // Garantizar array
    if (!Array.isArray(state.ingresosPuntuales)) {
      state.ingresosPuntuales = [];
    }

    const list = getIngresosPuntualesMes(currentYear, currentMonth);

    if (!list.length) {
      cont.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💶</div>
          No hay ingresos puntuales este mes.
        </div>`;
      return;
    }

    cont.innerHTML = '';
    list
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
      .forEach(ip => {
        const item = document.createElement('div');
        item.className = 'expense-item';
        item.innerHTML = `
          <div class="expense-main">
            <div class="expense-line1">+ ${formatCurrency(parseNumberSafe(ip.importe))}</div>
            <div class="expense-line2">${ip.fecha || ''} · ${ip.desc || ''}</div>
          </div>
          <div class="expense-actions">
            <button class="btn btn-secondary-chip" data-action="edit" data-id="${ip.id}">✏️</button>
            <button class="btn btn-danger-chip" data-action="del" data-id="${ip.id}">🗑</button>
          </div>
        `;
        cont.appendChild(item);
      });

    // Borrar
    cont.querySelectorAll('button[data-action="del"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openConfirm('¿Eliminar este ingreso puntual?', () => {
          state.ingresosPuntuales = state.ingresosPuntuales.filter(
            ip => String(ip.id) !== String(id)
          );
          saveState();
          renderIngresosPuntualesLista();
          updateResumenYChips();
          showToast('Ingreso puntual eliminado.');
        });
      });
    });

    // Editar → ahora abre MODAL
    cont.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const ingreso = state.ingresosPuntuales.find(ip => String(ip.id) === String(id));
        if (!ingreso) return;
        openEditModal('ingresoPuntual', ingreso);
      });
    });
  }
  function setupIngresosPuntuales() {
    const fechaEl = document.getElementById('ingresoPuntualFecha');
    const descEl = document.getElementById('ingresoPuntualDesc');
    const impEl = document.getElementById('ingresoPuntualImporte');
    const btnAdd = document.getElementById('btnAddIngresoPuntual');

    // Garantizar array
    if (!Array.isArray(state.ingresosPuntuales)) {
      state.ingresosPuntuales = [];
    }

    // Fecha por defecto: hoy
    if (fechaEl && !fechaEl.value) {
      const today = new Date();
      fechaEl.value = today.toISOString().slice(0, 10);
    }

    if (btnAdd) {
      btnAdd.addEventListener('click', function () {
        const fecha = fechaEl && fechaEl.value;
        const desc = descEl && descEl.value.trim();
        const importe = parseNumberSafe(impEl && impEl.value);

        if (!fecha) {
          showToast('Pon una fecha.');
          return;
        }
        if (!(importe > 0)) {
          showToast('El importe debe ser mayor que 0.');
          return;
        }

        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        state.ingresosPuntuales.push({ id: id, fecha: fecha, desc: desc, importe: importe });

        saveState();
        if (descEl) descEl.value = '';
        if (impEl) impEl.value = '';
        renderIngresosPuntualesLista();
        updateResumenYChips();
        showToast('Ingreso puntual añadido.');
      });
    }
  }
// ----- Gastos fijos -----
function renderFijosTable() {
  const cont = document.getElementById('fijosTableContainer');
  const totalEl = document.getElementById('totalFijosDisplay');
  if (!cont) return;

  const list = state.fijos || [];
  const total = getTotalFijos();
  if (totalEl) totalEl.textContent = formatCurrency(total);

  if (!list.length) {
    cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏠</div>No hay gastos fijos configurados.</div>';
    return;
  }

  let html = '<table class="fixed-expense-table"><thead><tr><th>Gasto</th><th>Categoría</th><th>Importe mensual</th><th></th></tr></thead><tbody>';
  list.forEach(f => {
    html += `<tr data-id="${f.id}">
      <td>${f.nombre || ''}</td>
      <td>${f.categoria || 'Varios'}</td>
      <td>${formatCurrency(f.importe)}</td>
      <td style="text-align:right;">
        <button class="btn btn-edit" data-action="edit" data-id="${f.id}">✏</button>
        <button class="btn btn-danger-chip" data-action="del" data-id="${f.id}">🗑</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table>';
  cont.innerHTML = html;

  cont.querySelectorAll('button[data-action="del"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openConfirm('¿Eliminar este gasto fijo?', () => {
        state.fijos = state.fijos.filter(f => String(f.id) !== String(id));
        saveState();
        renderFijosTable();
        updateResumenYChips();
        showToast('Gasto fijo eliminado.');
      });
    });
  });

  cont.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const fijo = state.fijos.find(f => String(f.id) === String(id));
      if (!fijo) return;
      openEditModal('fijo', fijo);
    });
  });
}

function setupFijos() {
  const nombreEl = document.getElementById('fijoNombre');
  const impEl = document.getElementById('fijoImporte');
  const btnAdd = document.getElementById('btnAddFijo');

  const catHidden = document.getElementById('fijoCategoria');
  const chipsWrap = document.getElementById('fijoCategoriaChips');

  // Gestión de selección / deselección de chips
  if (chipsWrap && catHidden) {
    chipsWrap.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.chip');
      if (!btn) return;

      const value = btn.dataset.cat || '';
      const yaSeleccionada = btn.classList.contains('chip-selected');

      if (yaSeleccionada) {
        // Si ya estaba seleccionada, la desmarcamos y vaciamos la categoría
        catHidden.value = '';
        chipsWrap.querySelectorAll('.chip').forEach(ch => {
          ch.classList.remove('chip-selected');
        });
      } else {
        // Si no lo estaba, la marcamos y desmarcamos las demás
        catHidden.value = value;
        chipsWrap.querySelectorAll('.chip').forEach(ch => {
          ch.classList.toggle('chip-selected', ch === btn);
        });
      }
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const nombre = nombreEl && nombreEl.value.trim();
      const importe = Number(impEl && impEl.value);
      const categoria = catHidden && catHidden.value ? catHidden.value : '';

      if (!nombre) {
        showToast('Pon un nombre al gasto fijo.');
        return;
      }
      if (!categoria) {
        showToast('Selecciona una categoría.');
        return;
      }
      if (!(importe >= 0)) {
        showToast('El importe debe ser un número válido.');
        return;
      }

      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      state.fijos.push({ id, nombre, categoria, importe });
      saveState();

      if (nombreEl) nombreEl.value = '';
      if (impEl) impEl.value = '';
      if (catHidden) catHidden.value = '';
      if (chipsWrap) {
        chipsWrap.querySelectorAll('.chip').forEach(ch => ch.classList.remove('chip-selected'));
      }

      renderFijosTable();
      updateResumenYChips();
      showToast('Gasto fijo añadido.');
    });
  }
}

  // ----- Gastos variables -----
  function rebuildCategoriasSugerencias() {
    const dl = document.getElementById('catSugerencias');
    if (!dl) return;
    const cats = new Set();
    state.gastos.forEach(g => {
      if (g.categoria) cats.add(g.categoria);
    });
    state.sobres.forEach(s => {
      if (s.nombre) cats.add(s.nombre);
    });
    dl.innerHTML = '';
    Array.from(cats).sort().forEach(c => {
      const o = document.createElement('option');
      o.value = c;
      dl.appendChild(o);
    });
  }

  function renderGastosLista() {
    const cont = document.getElementById('gastosLista');
    if (!cont) return;
    const list = getGastosMes(currentYear, currentMonth);
    if (!list.length) {
      cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div>No hay gastos registrados este mes.</div>';
      return;
    }
    cont.innerHTML = '';
    list
  .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
  .forEach(g => {
    const item = document.createElement('div');
    item.className = 'expense-item';

    // Descripción segura
    const descText = (g.desc && g.desc.trim())
      ? g.desc.trim()
      : 'Sin descripción';

        // Info de comercio (logo + etiqueta) basada en categoría y descripción
    const merchant = getMerchantInfo(g.categoria || '', descText);

    const merchantHtml = merchant.logoUrl
      ? `
        <div class="expense-merchant">
          <div class="expense-merchant-logo">
            <img src="${merchant.logoUrl}" alt="${merchant.label}" loading="lazy" />
          </div>
          <div class="expense-merchant-label">${merchant.label}</div>
        </div>
      `
      : `
        <div class="expense-merchant expense-merchant-fallback">
          <span class="expense-merchant-fallback-text">${merchant.label}</span>
        </div>
      `;

    item.innerHTML = `
      <div class="expense-main">
        <div class="expense-line1">
          <span class="amount-neg">- ${formatCurrency(g.importe)}</span> · ${g.categoria || 'Sin categoría'}
        </div>
        <div class="expense-line2">
          ${g.fecha || ''} · ${descText}
          ${merchantHtml}
        </div>
      </div>
      <div class="expense-actions">
        <button class="btn btn-edit" data-action="edit" data-id="${g.id}">✏</button>
        <button class="btn btn-danger-chip" data-action="del" data-id="${g.id}">🗑</button>
      </div>
    `;
    cont.appendChild(item);
  });

cont.querySelectorAll('button[data-action="del"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;

    // Buscar el gasto en estado
    const gasto = state.gastos.find(g => String(g.id) === String(id));

    if (gasto) {
      // 1) Si es un gasto de tipo "hucha_inicial", NO permitimos borrarlo
      if (gasto.tipo === 'hucha_inicial') {
        showToast('Este gasto es la aportación inicial de una hucha. Si quieres recuperar ese dinero, registra un retiro desde la sección Huchas.');
        return;
      }

      // 2) Si es un gasto de aportación a hucha ("Ahorro en ..."), tampoco permitimos borrarlo
      const desc = (gasto.desc || '').trim().toLowerCase();
      if (gasto.categoria === 'Huchas' && desc.startsWith('ahorro en')) {
        showToast('Este gasto pertenece a una hucha. Para deshacerlo, haz un retiro desde la hucha.');
        return;
      }
    }

    // Para el resto de gastos, comportamiento normal
    openConfirm('¿Eliminar este gasto?', () => {
      state.gastos = state.gastos.filter(g => String(g.id) !== String(id));
      saveState();
      renderGastosLista();
      renderSobresLista();
      updateResumenYChips();
      showToast('Gasto eliminado.');
    });
  });
});

    cont.querySelectorAll('button[data-action="edit"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    const gasto = state.gastos.find(g => String(g.id) === String(id));
    if (!gasto) return;

    // Si es la aportación inicial de una hucha, NO se permite editar
    if (gasto.tipo === 'hucha_inicial') {
      showToast(
        'Este movimiento es la aportación inicial de una hucha. ' +
        'Si necesitas cambiarla, edita la hucha o elimínala y vuelve a crearla.'
      );
      return;
    }

    // El resto de gastos se editan con normalidad
    openEditModal('gasto', gasto);
  });
});
  }

  function setupGastos() {
    const fechaEl = document.getElementById('gastoFecha');
    const catEl = document.getElementById('gastoCategoria');
    const descEl = document.getElementById('gastoDesc');
    const impEl = document.getElementById('gastoImporte');
    const btnAdd = document.getElementById('btnAddGasto');

    if (fechaEl && !fechaEl.value) {
      const today = new Date();
      fechaEl.value = today.toISOString().slice(0,10);
    }

    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const fecha = fechaEl && fechaEl.value;
        const categoria = catEl && catEl.value.trim();
        const desc = descEl && descEl.value.trim();
        const importe = Number(impEl && impEl.value);
        if (!fecha) {
          showToast('Pon una fecha.');
          return;
        }
        if (!categoria) {
          showToast('Pon una categoría.');
          return;
        }
        if (!(importe > 0)) {
          showToast('El importe debe ser mayor que 0.');
          return;
        }
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        state.gastos.push({ id, fecha, categoria, desc, importe });
        saveState();
        if (descEl) descEl.value = '';
        if (impEl) impEl.value = '';
        renderGastosLista();
        renderSobresLista();
        rebuildCategoriasSugerencias();
        updateResumenYChips();
        showToast('Gasto añadido.');
      });
    }
  }

  // ----- Sobres / presupuestos -----
  function renderSobresLista() {
    const cont = document.getElementById('sobresLista');
    if (!cont) return;
    const sobres = state.sobres || [];
    if (!sobres.length) {
      cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📩</div>No hay presupuestos creados.</div>';
      return;
    }
    const gastosMes = getGastosMes(currentYear, currentMonth);
    cont.innerHTML = '';
    sobres.forEach(s => {
      const totalGastado = gastosMes
        .filter(g => (g.categoria || '').toLowerCase() === (s.nombre || '').toLowerCase())
        .reduce((sum, g) => sum + (Number(g.importe) || 0), 0);
      const presupuesto = Number(s.presupuesto) || 0;
      const restante = presupuesto - totalGastado;
      let statusClass = 'good';
      let statusText = 'Dentro de presupuesto';
      const ratio = presupuesto > 0 ? totalGastado / presupuesto : 0;
      if (presupuesto === 0) {
        statusClass = 'warning';
        statusText = 'Sin presupuesto definido';
      } else if (ratio >= 0.9 && ratio < 1) {
        statusClass = 'warning';
        statusText = 'A punto de agotar presupuesto';
      } else if (ratio >= 1) {
        statusClass = 'over';
        statusText = 'Presupuesto superado';
      }

      const pct = presupuesto > 0 ? Math.min(100, (totalGastado / presupuesto) * 100) : 0;
      const card = document.createElement('div');
      card.className = 'budget-card';
      card.innerHTML = `
        <div class="budget-card-header">
          <div class="budget-name">📩 ${s.nombre || 'Sin nombre'}</div>
          <div>
            <button class="btn btn-edit" data-action="edit" data-id="${s.id}">✏</button>
            <button class="btn btn-danger-chip" data-action="del" data-id="${s.id}">🗑</button>
          </div>
        </div>
        <div class="budget-amounts">
          <div class="budget-amount-item">
            <div class="budget-amount-label">Presupuesto</div>
            <div class="budget-amount-value">${formatCurrency(presupuesto)}</div>
          </div>
          <div class="budget-amount-item">
            <div class="budget-amount-label">Gastado</div>
            <div class="budget-amount-value">${formatCurrency(totalGastado)}</div>
          </div>
        </div>
        <div class="budget-progress-bar">
          <div class="budget-progress-fill ${ratio >= 1 ? 'over' : ''}" style="width:${pct}%;"></div>
        </div>
        <div class="budget-status ${statusClass}">
          ${statusText} · Restante: ${formatCurrency(restante)}
        </div>
      `;
      cont.appendChild(card);
    });

    cont.querySelectorAll('button[data-action="del"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openConfirm('¿Eliminar este sobre/presupuesto?', () => {
          state.sobres = state.sobres.filter(s => String(s.id) !== String(id));
          saveState();
          renderSobresLista();
          rebuildCategoriasSugerencias();
          showToast('Presupuesto eliminado.');
        });
      });
    });

    cont.querySelectorAll('button[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const sobre = state.sobres.find(s => String(s.id) === String(id));
        if (!sobre) return;
        openEditModal('sobre', sobre);
      });
    });
  }

  function setupSobres() {
    const nombreEl = document.getElementById('sobreNombre');
    const impEl = document.getElementById('sobreImporte');
    const btnAdd = document.getElementById('btnAddSobre');

    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        // Bloqueo para versión FREE
if (!isProActive() && state.sobres.length >= 2) {
    showToast("Versión FREE: máximo 2 sobres. Activa PRO para usar ilimitados.");
    return;
}
        const nombre = nombreEl && nombreEl.value.trim();
        const presupuesto = Number(impEl && impEl.value);
        if (!nombre) {
          showToast('Pon un nombre al sobre.');
          return;
        }
        if (!(presupuesto >= 0)) {
          showToast('El presupuesto debe ser un número válido.');
          return;
        }
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        state.sobres.push({ id, nombre, presupuesto });
        saveState();
        if (nombreEl) nombreEl.value = '';
        if (impEl) impEl.value = '';
        renderSobresLista();
        rebuildCategoriasSugerencias();
        showToast('Presupuesto creado.');
      });
    }
  }

  // ----- Huchas -----
  function renderHuchas() {
    const cont = document.getElementById('huchasLista');
    const select = document.getElementById('huchaSelect');
    if (select) {
      select.innerHTML = '<option value="">-- Elige una hucha --</option>';
    }
    const list = state.huchas || [];
    if (!cont) return;
    if (!list.length) {
      cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🐷</div>No has creado ninguna hucha todavía.</div>';
    } else {
      cont.innerHTML = '';
      list.forEach(h => {
        const objetivo = Number(h.objetivo) || 0;
        const saldo = Number(h.saldo) || 0;
        const ratio = objetivo > 0 ? Math.min(1, saldo / objetivo) : 0;
        const pct = objetivo > 0 ? Math.min(100, (saldo / objetivo) * 100) : 0;
        const card = document.createElement('div');
        card.className = 'budget-card';
        card.innerHTML = `
          <div class="budget-card-header">
            <div class="budget-name">🐷 ${h.nombre || 'Sin nombre'}</div>
<div class="hucha-actions-single">
  <button class="btn btn-danger-chip btn-hucha-break" data-action="del" data-id="${h.id}">
    🔨 Romper hucha
  </button>
</div>
          </div>
          <div class="budget-amounts">
            <div class="budget-amount-item">
              <div class="budget-amount-label">Saldo</div>
              <div class="budget-amount-value">${formatCurrency(saldo)}</div>
            </div>
            <div class="budget-amount-item">
              <div class="budget-amount-label">Objetivo</div>
              <div class="budget-amount-value">${objetivo ? formatCurrency(objetivo) : '—'}</div>
            </div>
          </div>
          <div class="budget-progress-bar">
            <div class="budget-progress-fill" style="width:${pct}%;"></div>
          </div>
          <div class="budget-status ${ratio >= 1 ? 'good' : 'warning'}">
            ${objetivo ? (ratio >= 1 ? '¡Objetivo conseguido!' : 'Progreso hacia objetivo') : 'Hucha sin objetivo fijo'}
          </div>
        `;
        cont.appendChild(card);

        if (select) {
          const opt = document.createElement('option');
          opt.value = h.id;
          opt.textContent = `${h.nombre} (${formatCurrency(saldo)})`;
          select.appendChild(opt);
        }
      });

            cont.querySelectorAll('button[data-action="del"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const hucha = state.huchas.find(h => String(h.id) === String(id));
          if (!hucha) return;

          const saldoActual = Number(hucha.saldo) || 0;
          const mensaje = saldoActual > 0
            ? 'Esta hucha tiene saldo. Si la rompes, su saldo se registrará como un ingreso puntual del mes actual y la hucha se eliminará. ¿Quieres continuar?'
            : 'Esta hucha no tiene saldo. Si la rompes, simplemente se eliminará del listado. ¿Quieres continuar?';

          openConfirm(mensaje, () => {
            const teniaSaldo = saldoActual > 0;

            // Si tenía saldo, creamos un ingreso puntual de tipo "hucha_retiro"
            if (teniaSaldo) {
              if (!Array.isArray(state.ingresosPuntuales)) {
                state.ingresosPuntuales = [];
              }

              const today = new Date();
              const fecha = today.toISOString().slice(0, 10);
              const ingresoId = Date.now().toString(36) + Math.random().toString(36).slice(2);

              state.ingresosPuntuales.push({
                id: ingresoId,
                fecha: fecha,
                desc: 'Romper hucha ' + (hucha.nombre || ''),
                importe: saldoActual,
                tipo: 'hucha_retiro',
                huchaId: hucha.id
              });
            }

            // Eliminar la hucha del estado
            state.huchas = state.huchas.filter(h => String(h.id) !== String(id));

            // Guardar y refrescar interfaz
            saveState();
            renderHuchas();
            if (typeof renderIngresosPuntualesLista === 'function') {
              renderIngresosPuntualesLista();
            }
            updateResumenYChips();

            const msg = teniaSaldo
              ? 'Has roto la hucha. Su saldo se ha registrado como ingreso puntual del mes actual.'
              : 'Has roto la hucha. No tenía saldo pendiente.';
            showToast(msg);
          });
        });
      });

      cont.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const hucha = state.huchas.find(h => String(h.id) === String(id));
          if (!hucha) return;
          openEditModal('hucha', hucha);
        });
      });
    }
  }

  function setupHuchas() {
    const nombreEl = document.getElementById('huchaNombre');
const objEl = document.getElementById('huchaObjetivo');
const saldoEl = document.getElementById('huchaSaldoInicial');
const btnAdd = document.getElementById('btnAddHucha');

const select = document.getElementById('huchaSelect');
const impMovEl = document.getElementById('huchaImporte');
const accionEl = document.getElementById('huchaAccion');
const btnMov = document.getElementById('btnHuchaMovimiento');
const regIngresoEl = document.getElementById('huchaRegistrarIngreso');
        if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        // Bloqueo para versión FREE
if (!isProActive() && state.huchas.length >= 1) {
    showToast("Versión FREE: solo 1 hucha. Activa PRO para crear más.");
    return;
}
        const nombre = nombreEl && nombreEl.value.trim();
        const objetivo = Number(objEl && objEl.value) || 0;
        const saldoInicial = Number(saldoEl && saldoEl.value) || 0;

        if (!nombre) {
          showToast('Pon un nombre a la hucha.');
          return;
        }

        const id = Date.now().toString(36) + Math.random().toString(36).slice(2);

        // 1) Crear la hucha con el saldo inicial
        state.huchas.push({ id, nombre, objetivo, saldo: saldoInicial });

        // 2) Si hay saldo inicial, registrar también un gasto tipo "aportar a hucha"
        if (saldoInicial > 0) {
          if (!Array.isArray(state.gastos)) {
            state.gastos = [];
          }
          const today = new Date();
          const fecha = today.toISOString().slice(0, 10);
          const gastoId = Date.now().toString(36) + Math.random().toString(36).slice(2);

  state.gastos.push({
    id: gastoId,
    fecha,
    categoria: 'Huchas',
    desc: 'Ahorro inicial en ' + (nombre || ''),
    importe: saldoInicial,
    tipo: 'hucha_inicial',   // <- flag especial
    huchaId: id              // <- por si en el futuro quieres enlazar aún más
  });
        }

        saveState();

        if (nombreEl) nombreEl.value = '';
        if (objEl) objEl.value = '';
        if (saldoEl) saldoEl.value = '';

        renderHuchas();
        renderGastosLista();      // ver el movimiento en la lista de gastos
        renderSobresLista();      // por si hay un sobre "Huchas"
        updateResumenYChips();
        rebuildCategoriasSugerencias();
        showToast('Hucha creada.');
      });
    }

    if (btnMov) {
      btnMov.addEventListener('click', () => {
        const huchaId = select && select.value;
        const importe = Number(impMovEl && impMovEl.value);
        const accion = accionEl && accionEl.value;
        if (!huchaId) {
          showToast('Elige una hucha.');
          return;
        }
        if (!(importe > 0)) {
          showToast('El importe debe ser mayor que 0.');
          return;
        }
        const hucha = state.huchas.find(h => String(h.id) === String(huchaId));
        if (!hucha) {
          showToast('Hucha no encontrada.');
          return;
        }
        if (accion === 'aportar') {
  // APORTAR: igual que antes
  hucha.saldo = (Number(hucha.saldo) || 0) + importe;

  const today = new Date();
  const fecha = today.toISOString().slice(0, 10);
  const idGasto = Date.now().toString(36) + Math.random().toString(36).slice(2);

  if (!Array.isArray(state.gastos)) {
    state.gastos = [];
  }

  state.gastos.push({
    id: idGasto,
    fecha,
    categoria: 'Huchas',
    desc: 'Ahorro en ' + (hucha.nombre || ''),
    importe
  });

  showToast('Aportación registrada en la hucha y como gasto.');
} else {
  // RETIRAR
  const saldoActual = Number(hucha.saldo) || 0;
  if (importe > saldoActual) {
    showToast('No hay saldo suficiente en la hucha.');
    return;
  }

  const registrarIngreso =
    regIngresoEl && regIngresoEl.checked ? true : false;

  hucha.saldo = saldoActual - importe;

  // Si el usuario ha marcado la casilla, creamos un ingreso puntual
  if (registrarIngreso) {
    if (!Array.isArray(state.ingresosPuntuales)) {
      state.ingresosPuntuales = [];
    }

    const today = new Date();
    const fecha = today.toISOString().slice(0, 10);
    const idIng = Date.now().toString(36) + Math.random().toString(36).slice(2);

    state.ingresosPuntuales.push({
      id: idIng,
      fecha,
      desc: 'Retiro desde hucha ' + (hucha.nombre || ''),
      importe
    });

    showToast('Retirada registrada y devuelta al balance como ingreso puntual.');
  } else {
    showToast('Retirada registrada en la hucha.');
  }

  // por comodidad, desmarcamos la casilla tras el movimiento
  if (regIngresoEl) regIngresoEl.checked = false;
}

saveState();
if (impMovEl) impMovEl.value = '';
renderHuchas();
renderGastosLista();
renderSobresLista();
renderIngresosPuntualesLista();  // 👉 importante para ver el ingreso al momento
updateResumenYChips();
      });
    }
  }

  // ----- Notas -----
  function loadNotasMes() {
    const area = document.getElementById('notasMes');
    if (!area) return;
    const mk = getCurrentMonthKey();
    area.value = state.notasPorMes[mk] || '';
  }

  function setupNotas() {
    const area = document.getElementById('notasMes');
    const btn = document.getElementById('btnSaveNotas');
    if (!area || !btn) return;
    btn.addEventListener('click', () => {
      const mk = getCurrentMonthKey();
      state.notasPorMes[mk] = area.value || '';
      saveState();
      showToast('Notas del mes guardadas.');
    });
  }

 // ----- Export / Import JSON -----
  function setupExportImportJson() {
    const btnExport = document.getElementById('btnExportJson');
    const fileInput = document.getElementById('importFile');
    const btnImportFile = document.getElementById('btnImportJsonFile');
    const textArea = document.getElementById('importJsonText');
    const btnImportText = document.getElementById('btnImportJsonText');
    // Detectar si ya hay datos en el estado actual
    function hayDatosExistentes() {
      try {
        const ib = state.ingresosBase || {};
        const hayIngresosBase = !!(
          (typeof ib.juan !== 'undefined' && Number(ib.juan) > 0) ||
          (typeof ib.saray !== 'undefined' && Number(ib.saray) > 0) ||
          (typeof ib.otros !== 'undefined' && Number(ib.otros) > 0)
        );

        const hayFijos   = Array.isArray(state.fijos) && state.fijos.length > 0;
        const haySobres  = Array.isArray(state.sobres) && state.sobres.length > 0;
        const hayHuchas  = Array.isArray(state.huchas) && state.huchas.length > 0;
        const hayIngPunt = Array.isArray(state.ingresosPuntuales) && state.ingresosPuntuales.length > 0;
        const hayGastos  = Array.isArray(state.gastos) && state.gastos.length > 0;

        const notasObj = state.notasPorMes;
        const hayNotas = notasObj && typeof notasObj === 'object' && Object.keys(notasObj).length > 0;

        return hayIngresosBase || hayFijos || haySobres || hayHuchas || hayIngPunt || hayGastos || hayNotas;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const mk = getCurrentMonthKey();
        a.href = url;
        a.download = 'economia_familiar_' + mk + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Copia de seguridad descargada.');
      });
    }

    if (btnImportFile && fileInput) {
      btnImportFile.addEventListener('click', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
          showToast('Selecciona un archivo JSON primero.');
          return;
        }

        const doImportFromFile = () => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target.result);
              applyBackupPayload(data);
              saveState();
              renderAll();
              showToast('Datos importados correctamente.');
            } catch (e) {
              console.error(e);
              showToast('Error al leer el JSON.');
            } finally {
              // Limpia el input de archivo para poder volver a elegir el mismo si quieres
              fileInput.value = '';
            }
          };
          reader.readAsText(file, 'utf-8');
        };

if (hayDatosExistentes()) {
  openConfirm(
    'Ya tienes datos guardados. ¿Quieres sobrescribirlos con el archivo importado?',
    () => { doImportFromFile(); },
    'Sobrescribir datos'
  );
} else {
  doImportFromFile();
}
      });
    }

        if (btnImportText && textArea) {
      btnImportText.addEventListener('click', () => {
        const content = textArea.value.trim();
        if (!content) {
          showToast('Pega el contenido JSON primero.');
          return;
        }

        const doImportFromText = () => {
          try {
            const data = JSON.parse(content);
            applyBackupPayload(data);
            saveState();
            renderAll();
            showToast('Datos importados correctamente.');
          } catch (e) {
            console.error(e);
            showToast('El texto no es un JSON válido.');
          }
        };

        if (hayDatosExistentes()) {
  openConfirm(
    'Ya tienes datos guardados. ¿Quieres sobrescribirlos con el JSON pegado?',
    () => { doImportFromText(); },
    'Sobrescribir datos'
  );
} else {
  doImportFromText();
}
      });
    }
  }

  // Acepta backups antiguos y nuevos y los mapea al schema actual de "state"
  function applyBackupPayload(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Backup inválido');
    }

    const newState = {
      ingresosBase: { juan: 0, saray: 0, otros: 0 },
      fijos: [],
      sobres: [],
      huchas: [],
      ingresosPuntuales: [],
      gastos: [],
      notasPorMes: {}
    };

    // 1) Ingresos base: formato nuevo (ingresosBase) o antiguo (baseConfig)
    if (data.ingresosBase && typeof data.ingresosBase === 'object') {
      newState.ingresosBase = {
        juan: Number(data.ingresosBase.juan || 0),
        saray: Number(data.ingresosBase.saray || 0),
        otros: Number(data.ingresosBase.otros || 0)
      };
    } else if (data.baseConfig && typeof data.baseConfig === 'object') {
      newState.ingresosBase = {
        juan: Number(data.baseConfig.juan || 0),
        saray: Number(data.baseConfig.saray || 0),
        otros: Number(data.baseConfig.otros || 0)
      };
    }

    // 2) Gastos fijos: array "fijos" o antiguo "gastosFijos"
   if (Array.isArray(data.fijos)) {
  newState.fijos = data.fijos.map(f => ({
    id: f.id,
    nombre: f.nombre,
    // 👉 recuperamos la categoría si existe en el JSON
    categoria: (typeof f.categoria === 'string' && f.categoria.trim() !== '')
      ? f.categoria
      : 'Varios',
    importe: Number(f.importe) || 0
  }));
} else if (Array.isArray(data.gastosFijos)) {
      newState.fijos = data.gastosFijos.map(f => ({
        id: String(f.id || (Date.now().toString(36) + Math.random().toString(36).slice(2))),
        nombre: f.nombre || '',
        importe: Number(f.importe || 0)
      }));
    }

    // 3) Sobres / presupuestos
    if (Array.isArray(data.sobres)) {
      // Formato nuevo: array de sobres
      newState.sobres = data.sobres.map(s => ({
        id: String(s.id || (Date.now().toString(36) + Math.random().toString(36).slice(2))),
        nombre: s.nombre || '',
        presupuesto: Number(s.presupuesto || s.importe || 0)
      }));
    } else if (data.sobres && typeof data.sobres === 'object') {
      // Formato antiguo: objeto { nombre: importe }
      newState.sobres = Object.keys(data.sobres).map(nombre => ({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        nombre,
        presupuesto: Number(data.sobres[nombre] || 0)
      }));
    }

    // 4) Huchas
    if (Array.isArray(data.huchas)) {
      newState.huchas = data.huchas.map(h => ({
        id: String(h.id || (Date.now().toString(36) + Math.random().toString(36).slice(2))),
        nombre: h.nombre || '',
        objetivo: Number(h.objetivo || 0),
        saldo: Number(h.saldo || 0)
      }));
    }

    // 5) Ingresos puntuales
    if (Array.isArray(data.ingresosPuntuales)) {
      newState.ingresosPuntuales = data.ingresosPuntuales.map(ip => ({
        id: String(ip.id || (Date.now().toString(36) + Math.random().toString(36).slice(2))),
        fecha: ip.fecha || '',
        desc: ip.desc || '',
        importe: Number(ip.importe || 0)
      }));
    }

    // 6) Gastos
    if (Array.isArray(data.gastos)) {
      newState.gastos = data.gastos.map(g => ({
        id: String(g.id || (Date.now().toString(36) + Math.random().toString(36).slice(2))),
        fecha: g.fecha || '',
        categoria: g.categoria || 'Otros',
        desc: g.desc || '',
        importe: Number(g.importe || 0)
      }));
    } else if (Array.isArray(data.movimientos)) {
      newState.gastos = data.movimientos.map(g => ({
        id: String(g.id || (Date.now().toString(36) + Math.random().toString(36).slice(2))),
        fecha: g.fecha || '',
        categoria: g.categoria || 'Otros',
        desc: g.desc || '',
        importe: Number(g.importe || 0)
      }));
    }

 // 7) Notas por mes
if (data.notasPorMes && typeof data.notasPorMes === 'object') {
  newState.notasPorMes = data.notasPorMes;
} else if (data.notasByMonth && typeof data.notasByMonth === 'object') {
  newState.notasPorMes = data.notasByMonth;
}

state = newState;

}
// ----- Reset total -----
function setupReset() {
  const btn = document.getElementById('btnResetAll');
  if (!btn) return;

  btn.addEventListener('click', () => {
    openConfirm(
      'Se borrarán todos los datos de la app en este dispositivo. ¿Seguro?',
      () => {
                state = {
          ingresosBase: { juan: 0, saray: 0, otros: 0 },
          fijos: [],
          sobres: [],
          huchas: [],
          ingresosPuntuales: [],
          gastos: [],
          notasPorMes: {},
          personalizacion: {
            nombreIngresoPrincipal: 'Ingreso principal',
            tema: 'default'
          }
        };
        saveState();
        applyIngresoPrincipalLabel();
        applyTheme();
        renderAll();
        showToast('Datos eliminados. Empezamos de cero.');
      }
    );
  });
} 
// genérica -----
function openEditModal(type, data) {
  const overlay = document.getElementById('editModal');
  const titleEl = document.getElementById('modalTitle');
  const contentEl = document.getElementById('modalContent');
  const saveBtn = document.getElementById('modalSave');
  if (!overlay || !titleEl || !contentEl || !saveBtn) return;

  let html = '';

  if (type === 'fijo') {
    titleEl.textContent = 'Editar gasto fijo';
    html = `
      <div class="field-group">
        <label>Nombre</label>
        <input type="text" id="editNombre" value="${data.nombre || ''}" />
      </div>

      <div class="field-group">
        <label>Categoría</label>
        <div class="chips-row" id="editCategoriaChips">
          <button type="button" class="chip chip-small ${data.categoria === 'Suministros' ? 'chip-selected' : ''}" data-cat="Suministros">💡 Suministros</button>
          <button type="button" class="chip chip-small ${data.categoria === 'Préstamos' ? 'chip-selected' : ''}" data-cat="Préstamos">💳 Préstamos</button>
          <button type="button" class="chip chip-small ${data.categoria === 'Suscripciones' ? 'chip-selected' : ''}" data-cat="Suscripciones">📺 Suscripciones</button>
          <button type="button" class="chip chip-small ${data.categoria === 'Varios' ? 'chip-selected' : ''}" data-cat="Varios">📦 Varios</button>
        </div>
        <input type="hidden" id="editCategoria" value="${data.categoria || ''}">
      </div>

      <div class="field-group">
        <label>Importe mensual (€)</label>
        <input type="number" id="editImporte" step="0.01" inputmode="decimal" value="${data.importe}" />
      </div>
    `;
  }

  else if (type === 'gasto') {
    titleEl.textContent = 'Editar gasto';
    html = `
      <div class="field-group">
        <label>Fecha</label>
        <input type="date" id="editFecha" value="${data.fecha || ''}" />
      </div>
      <div class="field-group">
        <label>Categoría</label>
        <input type="text" id="editCategoria" value="${data.categoria || ''}" />
      </div>
      <div class="field-group">
        <label>Descripción</label>
        <input type="text" id="editDesc" value="${data.desc || ''}" />
      </div>
      <div class="field-group">
        <label>Importe (€)</label>
        <input type="number" id="editImporte" step="0.01" inputmode="decimal" value="${data.importe}" />
      </div>
    `;
  }

  else if (type === 'sobre') {
    titleEl.textContent = 'Editar presupuesto';
    html = `
      <div class="field-group">
        <label>Nombre del sobre</label>
        <input type="text" id="editNombre" value="${data.nombre || ''}" />
      </div>
      <div class="field-group">
        <label>Presupuesto mensual (€)</label>
        <input type="number" id="editImporte" step="0.01" inputmode="decimal" value="${data.presupuesto}" />
      </div>
    `;
  }

  else if (type === 'hucha') {
    titleEl.textContent = 'Editar hucha';
    html = `
      <div class="field-group">
        <label>Nombre</label>
        <input type="text" id="editNombre" value="${data.nombre || ''}" />
      </div>
      <div class="field-group">
        <label>Objetivo (€)</label>
        <input type="number" id="editObjetivo" step="0.01" inputmode="decimal" value="${data.objetivo || 0}" />
      </div>
      <div class="field-group">
        <label>Saldo actual (€)</label>
        <input type="number" id="editSaldo" step="0.01" inputmode="decimal" value="${data.saldo || 0}" />
      </div>
    `;
  }

  else if (type === 'ingresoPuntual') {
    titleEl.textContent = 'Editar ingreso puntual';
    html = `
      <div class="field-group">
        <label>Fecha</label>
        <input type="date" id="editFecha" value="${data.fecha || ''}" />
      </div>
      <div class="field-group">
        <label>Descripción</label>
        <input type="text" id="editDesc" value="${data.desc || ''}" />
      </div>
      <div class="field-group">
        <label>Importe (€)</label>
        <input type="number" id="editImporte" step="0.01" inputmode="decimal" value="${data.importe}" />
      </div>
    `;
  }

  else {
    titleEl.textContent = 'Editar';
    html = '<p>No hay campos para editar.</p>';
  }

  contentEl.innerHTML = html;
  saveBtn.dataset.editType = type;
  saveBtn.dataset.editId = data.id;
  overlay.classList.add('active');

  // chips en fijos
  if (type === 'fijo') {
        const chipsWrap = document.getElementById('editCategoriaChips');
    const catHidden = document.getElementById('editCategoria');
    if (chipsWrap && catHidden) {
      chipsWrap.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.chip');
        if (!btn) return;

        const value = btn.dataset.cat || '';
        const yaSeleccionada = btn.classList.contains('chip-selected');

        if (yaSeleccionada) {
          // Si ya estaba seleccionada, desmarcamos y dejamos sin categoría
          catHidden.value = '';
          chipsWrap.querySelectorAll('.chip').forEach(ch => {
            ch.classList.remove('chip-selected');
          });
        } else {
          // Si no lo estaba, seleccionamos solo esta
          catHidden.value = value;
          chipsWrap.querySelectorAll('.chip').forEach(ch => {
            ch.classList.toggle('chip-selected', ch === btn);
          });
        }
      });
    }
  }
}
  function closeEditModal() {
    const overlay = document.getElementById('editModal');
    const contentEl = document.getElementById('modalContent');
    const saveBtn = document.getElementById('modalSave');
    if (overlay) overlay.classList.remove('active');
    if (contentEl) contentEl.innerHTML = '';
    if (saveBtn) {
      saveBtn.dataset.editType = '';
      saveBtn.dataset.editId = '';
    }
  }

  function setupEditModalEvents() {
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalSave = document.getElementById('modalSave');
    const overlay = document.getElementById('editModal');

    if (modalClose) modalClose.addEventListener('click', closeEditModal);
    if (modalCancel) modalCancel.addEventListener('click', closeEditModal);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeEditModal();
      });
    }
    if (modalSave) {
      modalSave.addEventListener('click', () => {
        const type = modalSave.dataset.editType;
        const id = modalSave.dataset.editId;
        if (!type || !id) {
          closeEditModal();
          return;
        }

        if (type === 'fijo') {
          const nombreEl = document.getElementById('editNombre');
          const catEl = document.getElementById('editCategoria');
          const impEl = document.getElementById('editImporte');
          const fijo = state.fijos.find(f => String(f.id) === String(id));
          if (fijo && nombreEl && impEl && catEl) {
            fijo.nombre = nombreEl.value.trim();
            const nuevaCat = catEl.value.trim();
            if (nuevaCat) {
              fijo.categoria = nuevaCat;
            }
            fijo.importe = Number(impEl.value) || 0;
            saveState();
            renderFijosTable();
            updateResumenYChips();
            showToast('Gasto fijo actualizado.');
          }
        } else if (type === 'gasto') {
          const fechaEl = document.getElementById('editFecha');
          const catEl = document.getElementById('editCategoria');
          const descEl = document.getElementById('editDesc');
          const impEl = document.getElementById('editImporte');
          const gasto = state.gastos.find(g => String(g.id) === String(id));
          if (gasto && fechaEl && catEl && descEl && impEl) {
            gasto.fecha = fechaEl.value || gasto.fecha;
            gasto.categoria = catEl.value.trim() || gasto.categoria;
            gasto.desc = descEl.value.trim();
            gasto.importe = Number(impEl.value) || 0;
            saveState();
            renderGastosLista();
            renderSobresLista();
            rebuildCategoriasSugerencias();
            updateResumenYChips();
            showToast('Gasto actualizado.');
          }
        } else if (type === 'sobre') {
          const nombreEl = document.getElementById('editNombre');
          const impEl = document.getElementById('editImporte');
          const sobre = state.sobres.find(s => String(s.id) === String(id));
          if (sobre && nombreEl && impEl) {
            sobre.nombre = nombreEl.value.trim() || sobre.nombre;
            sobre.presupuesto = Number(impEl.value) || 0;
            saveState();
            renderSobresLista();
            rebuildCategoriasSugerencias();
            showToast('Presupuesto actualizado.');
          }
        } else if (type === 'hucha') {
          const nombreEl = document.getElementById('editNombre');
          const objEl = document.getElementById('editObjetivo');
          const saldoEl = document.getElementById('editSaldo');
          const hucha = state.huchas.find(h => String(h.id) === String(id));
          if (hucha && nombreEl && objEl && saldoEl) {
            hucha.nombre = nombreEl.value.trim() || hucha.nombre;
            hucha.objetivo = Number(objEl.value) || 0;
            hucha.saldo = Number(saldoEl.value) || 0;
            saveState();
            renderHuchas();
            updateResumenYChips();
            showToast('Hucha actualizada.');
          }
        } else if (type === 'ingresoPuntual') {
          // 👉 NUEVO CASE: guardar cambios del ingreso puntual
          const fechaEl = document.getElementById('editFecha');
          const descEl = document.getElementById('editDesc');
          const impEl = document.getElementById('editImporte');
          const ingreso = state.ingresosPuntuales.find(ip => String(ip.id) === String(id));
          if (ingreso && fechaEl && descEl && impEl) {
            ingreso.fecha = fechaEl.value || ingreso.fecha;
            ingreso.desc = descEl.value.trim();
            ingreso.importe = parseNumberSafe(impEl.value);
            saveState();
            renderIngresosPuntualesLista();
            updateResumenYChips();
            showToast('Ingreso puntual actualizado.');
          }
        }

                closeEditModal();
      }); // <-- cierre correcto del addEventListener del modalSave
    }     // <-- cierre del if (modalSave)
  }       // <-- cierre de la función setupEditModalEvents()

  // ----- Eventos modal confirm -----
  function setupConfirmModalEvents() {
    const overlay = document.getElementById('confirmModal');
    const btnOk = document.getElementById('confirmOk');
    const btnCancel = document.getElementById('confirmCancel');
    const btnClose = document.getElementById('confirmClose');
    if (btnOk) {
      btnOk.addEventListener('click', () => {
        if (pendingConfirm) pendingConfirm();
        closeConfirm();
      });
    }
    if (btnCancel) btnCancel.addEventListener('click', closeConfirm);
    if (btnClose) btnClose.addEventListener('click', closeConfirm);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeConfirm();
      });
    }
  }

  // ----- Render general -----
  function renderAll() {
    console.log(">>> renderAll() INICIO <<<");
    setupIngresosBase(); // repinta inputs
    renderIngresosPuntualesLista();
    renderFijosTable();
    renderGastosLista();
    renderSobresLista();
    renderHuchas();
    rebuildCategoriasSugerencias();
    loadNotasMes();
    updateResumenYChips();
    console.log(">>> renderAll() FIN <<<");
  }

  // ----- Init -----
  document.addEventListener('DOMContentLoaded', () => {

    log(">>> DOMContentLoaded DISPARADO <<<");  
    loadState();
    loadProState(); // cargamos estado PRO

    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    log("Año actual:", currentYear, "Mes actual:", currentMonth);
    log(">>> Ejecutando setup inicial <<<");

    // Navegación y mes actual
    setupTabs();
    setupMonthPicker();
    updateMonthDisplay();

    const btnPrevMonth = document.getElementById('btnPrevMonth');
    if (btnPrevMonth) {
      btnPrevMonth.addEventListener('click', () => changeMonth(-1));
    }

    const btnNextMonth = document.getElementById('btnNextMonth');
    if (btnNextMonth) {
      btnNextMonth.addEventListener('click', () => changeMonth(1));
    }

    // Secciones principales
    setupIngresosBase();
    setupIngresosPuntuales();
    setupFijos();
    setupGastos();
    setupSobres();
    setupHuchas();
    setupNotas();
    setupExportImportJson();
    //setupImportCsv();
    setupReset();
    setupEditModalEvents();
    setupConfirmModalEvents();

    // Sistema PRO
    setupProSystem();
    
    // Personalización
    setupPersonalizacion();
    applyAvatarToHeader();
    setupAvatarSelector();
  
    // Intro de logo
    setupIntroOverlay();
    
    // Render inicial
    renderAll();
    log(">>> renderAll() ejecutado <<<");

    // ----- Informe de gastos fijos -----
    const btnInf = document.getElementById('btnInformeFijos');
    const btnCloseInf = document.getElementById('btnCerrarInformes');
    const btnInfFijosShare = document.getElementById('informeFijosShare');
    const btnInfFijosPrint = document.getElementById('informeFijosPrint');

    if (btnInf) {
      btnInf.addEventListener('click', generarInformeFijos);
    }

    if (btnCloseInf) {
      btnCloseInf.addEventListener('click', () => {
        const modal = document.getElementById('modalInformes');
        if (modal) modal.classList.remove('active');
      });
    }

    if (btnInfFijosShare) {
      btnInfFijosShare.addEventListener('click', () => {
        handleProReportExport('share', 'Informe de gastos fijos', 'informesContenido');
      });
    }

    if (btnInfFijosPrint) {
      btnInfFijosPrint.addEventListener('click', () => {
        handleProReportExport('print', 'Informe de gastos fijos', 'informesContenido');
      });
    }
    // ----- Informe de gastos variables: eventos -----
    const btnInfGastos = document.getElementById('btnInformeGastos');
    const modalInfGastos = document.getElementById('modalInformeGastos');
    const btnInfGastosClose = document.getElementById('informeGastosClose');
    const btnInfGastosOk = document.getElementById('informeGastosOk');
    const btnInfGastosShare = document.getElementById('informeGastosShare');
    const btnInfGastosPrint = document.getElementById('informeGastosPrint');

    if (btnInfGastos && modalInfGastos) {
      const cerrarInformeGastos = () => {
        modalInfGastos.classList.remove('active');
      };

      btnInfGastos.addEventListener('click', () => {
        generarInformeGastosVariables();
      });

      if (btnInfGastosClose) {
        btnInfGastosClose.addEventListener('click', cerrarInformeGastos);
      }
      if (btnInfGastosOk) {
        btnInfGastosOk.addEventListener('click', cerrarInformeGastos);
      }

      if (btnInfGastosShare) {
        btnInfGastosShare.addEventListener('click', () => {
          handleProReportExport(
            'share',
            'Informe de gastos variables',
            'informeGastosContenido'
          );
        });
      }

      if (btnInfGastosPrint) {
        btnInfGastosPrint.addEventListener('click', () => {
          handleProReportExport(
            'print',
            'Informe de gastos variables',
            'informeGastosContenido'
          );
        });
      }

      modalInfGastos.addEventListener('click', (e) => {
        if (e.target === modalInfGastos) {
          cerrarInformeGastos();
        }
      });
    }
    // ----- Informe mensual: eventos -----
    const btnInfMensual = document.getElementById('btnInformeMensual');
    const modalInfMensual = document.getElementById('modalInformeMensual');
    const btnInfMensualClose = document.getElementById('informeMensualClose');
    const btnInfMensualOk = document.getElementById('informeMensualOk');
    const btnInfMensualShare = document.getElementById('informeMensualShare');
    const btnInfMensualPrint = document.getElementById('informeMensualPrint');

    if (btnInfMensual && modalInfMensual) {
      const cerrarInformeMensual = () => {
        modalInfMensual.classList.remove('active');
      };

      btnInfMensual.addEventListener('click', () => {
        generarInformeMensual();
      });

      if (btnInfMensualClose) {
        btnInfMensualClose.addEventListener('click', cerrarInformeMensual);
      }
      if (btnInfMensualOk) {
        btnInfMensualOk.addEventListener('click', cerrarInformeMensual);
      }

      if (btnInfMensualShare) {
        btnInfMensualShare.addEventListener('click', () => {
          handleProReportExport('share', 'Informe mensual Flujo Fácil', 'informeMensualContenido');
        });
      }

      if (btnInfMensualPrint) {
        btnInfMensualPrint.addEventListener('click', () => {
          handleProReportExport('print', 'Informe mensual Flujo Fácil', 'informeMensualContenido');
        });
      }

      // Cerrar tocando fuera de la tarjeta
      modalInfMensual.addEventListener('click', (e) => {
        if (e.target === modalInfMensual) {
          cerrarInformeMensual();
        }
      });
    }

    // ----- Informe de huchas: eventos -----
    const btnInfHuchas = document.getElementById('btnInformeHuchas');
    const modalInfHuchas = document.getElementById('modalInformeHuchas');
    const btnInfHuchasClose = document.getElementById('informeHuchasClose');
    const btnInfHuchasOk = document.getElementById('informeHuchasOk');
    const btnInfHuchasShare = document.getElementById('informeHuchasShare');
    const btnInfHuchasPrint = document.getElementById('informeHuchasPrint');

    if (btnInfHuchas && modalInfHuchas) {
      const cerrarInformeHuchas = () => {
        modalInfHuchas.classList.remove('active');
      };

      btnInfHuchas.addEventListener('click', () => {
        generarInformeHuchas();
      });

      if (btnInfHuchasClose) {
        btnInfHuchasClose.addEventListener('click', cerrarInformeHuchas);
      }
      if (btnInfHuchasOk) {
        btnInfHuchasOk.addEventListener('click', cerrarInformeHuchas);
      }

      if (btnInfHuchasShare) {
        btnInfHuchasShare.addEventListener('click', () => {
          handleProReportExport('share', 'Informe de huchas', 'informeHuchasContenido');
        });
      }

      if (btnInfHuchasPrint) {
        btnInfHuchasPrint.addEventListener('click', () => {
          handleProReportExport('print', 'Informe de huchas', 'informeHuchasContenido');
        });
      }

      // Cerrar tocando fuera de la tarjeta
      modalInfHuchas.addEventListener('click', (e) => {
        if (e.target === modalInfHuchas) {
          cerrarInformeHuchas();
        }
      });
    }
  });
})();

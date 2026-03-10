/* ========================================
   AsiSeguros - Admin Panel Logic (v2)
   ======================================== */

var STORAGE_KEY = 'asiseguros_admin';

/* ---------- Default Config ---------- */
var DEFAULT_CONFIG = {
  site: {
    name: 'AsiSeguros',
    phone: '+57 317 371 2260',
    email: 'contacto@asiseguros.com',
    whatsapp: '573173712260',
    schedule: 'Lun - Vie: 8:00 AM - 6:00 PM',
    location: 'Cobertura nacional - Colombia',
    facebook: 'https://www.facebook.com/asiseguros',
    instagram: 'https://www.instagram.com/asiseguros',
    linkedin: 'https://www.linkedin.com/company/asiseguros',
    tiktok: 'https://www.tiktok.com/@asiseguros',
    youtube: 'https://www.youtube.com/@asiseguros'
  },
  hero: {
    badge: 'Agencia de Seguros en Colombia',
    title: 'Protegemos <span class="highlight">lo que más importa</span> para ti',
    subtitle: 'Soluciones de seguros diseñadas para tu tranquilidad, tu empresa y tu futuro. Te acompañamos con asesoría experta y el respaldo de las mejores aseguradoras del país.',
    ctaPrimary: 'Cotiza tu seguro ahora',
    ctaSecondary: 'Ver portafolio',
    stat1Number: '15+',
    stat1Label: 'Aseguradoras',
    stat2Number: '37K+',
    stat2Label: 'Clientes',
    stat3Number: '10+',
    stat3Label: 'Años'
  },
  about: {
    subtitle: 'Sobre nosotros',
    title: 'Tu tranquilidad es nuestro compromiso',
    paragraph1: 'En <strong>AsiSeguros</strong> somos una agencia de seguros comprometida con la protección integral de personas, familias y empresas en Colombia. Nos especializamos en la intermediación de seguros con un enfoque estratégico, humano y profesional.',
    paragraph2: 'Trabajamos con las aseguradoras más reconocidas del país para ofrecerte soluciones personalizadas que se ajusten a tus necesidades reales, con asesoría experta en cada paso.',
    experienceNumber: '10+',
    experienceText: 'Años de experiencia',
    features: [
      'Asesoría personalizada',
      '+15 aseguradoras aliadas',
      'Cobertura nacional',
      'Acompañamiento permanente',
      'Gestión de siniestros',
      'Asesoría sin costo'
    ]
  },
  stats: {
    stat1: { number: 37000, suffix: '+', label: 'Clientes protegidos' },
    stat2: { number: 15, suffix: '+', label: 'Aseguradoras aliadas' },
    stat3: { number: 10, suffix: '+', label: 'Años de experiencia' },
    stat4: { number: 98, suffix: '%', label: 'Satisfacción del cliente' }
  },
  why: {
    subtitle: 'Nuestros diferenciales',
    title: '¿Por qué elegir AsiSeguros?',
    description: 'No solo vendemos seguros, construimos relaciones de confianza con cada cliente.',
    cards: [
      { icon: 'fas fa-user-tie', title: 'Asesoría Personalizada', text: 'Analizamos tu perfil de riesgo y diseñamos la solución de seguros ideal para ti, tu familia o tu empresa.' },
      { icon: 'fas fa-scale-balanced', title: 'Asesoría Jurídica Sin Costo', text: 'Te acompañamos en procesos de reclamación y siniestros con soporte legal incluido en nuestro servicio.' },
      { icon: 'fas fa-handshake-angle', title: 'Acompañamiento Permanente', text: 'No desaparecemos después de la venta. Estamos contigo en cada renovación, ajuste y momento que necesites.' }
    ]
  },
  testimonials: [
    { name: 'Carlos Martínez', role: 'Gerente General, LogiTransport S.A.S.', initials: 'CM', text: 'AsiSeguros nos ayudó a encontrar la póliza perfecta para nuestra empresa. Su asesoría fue clave para proteger nuestros activos con la mejor relación costo-beneficio.' },
    { name: 'Laura Rodríguez', role: 'Cliente particular', initials: 'LR', text: 'Excelente acompañamiento en todo el proceso. Cuando tuve un siniestro con mi vehículo, me guiaron paso a paso hasta la resolución. Totalmente recomendados.' },
    { name: 'Andrés Peña', role: 'Director Financiero, Constructora Altus', initials: 'AP', text: 'Llevamos más de 5 años con AsiSeguros y su servicio siempre es impecable. Nos asesoran de manera honesta y transparente, sin presionar ventas innecesarias.' }
  ],
  modules: {
    topbar: { enabled: true, label: 'Barra superior', description: 'Teléfono, email y redes sociales' },
    hero: { enabled: true, label: 'Hero / Banner principal', description: 'Sección principal con CTA' },
    marquee: { enabled: true, label: 'Marquee de aseguradoras', description: 'Carrusel de logos de aseguradoras' },
    about: { enabled: true, label: 'Nosotros', description: 'Información sobre la empresa' },
    services: { enabled: true, label: 'Portafolio de seguros', description: 'Tarjetas de categorías de seguros' },
    why: { enabled: true, label: '¿Por qué elegirnos?', description: 'Diferenciales y propuesta de valor' },
    stats: { enabled: true, label: 'Estadísticas', description: 'Contadores animados' },
    productHighlight: { enabled: true, label: 'Seguro de autos (destacado)', description: 'Landing del producto estrella' },
    testimonials: { enabled: true, label: 'Testimonios', description: 'Opiniones de clientes' },
    cta: { enabled: true, label: 'CTA de conversión', description: 'Llamado a la acción principal' },
    contact: { enabled: true, label: 'Formulario de contacto', description: 'Formulario de cotización' },
    whatsappFloat: { enabled: true, label: 'Botón flotante WhatsApp', description: 'Botón fijo en esquina inferior' }
  },
  insuranceTypes: {
    personas: {
      enabled: true,
      label: 'Seguros de Personas',
      icon: 'fas fa-heart-pulse',
      description: 'Protege a los tuyos con seguros de vida, salud, accidentes personales, educación, viajes y exequias.',
      subtypes: {
        vida: { enabled: true, label: 'Seguro de Vida' },
        salud: { enabled: true, label: 'Seguro de Salud' },
        accidentes: { enabled: true, label: 'Accidentes Personales' },
        viajes: { enabled: true, label: 'Seguro de Viajes' },
        educacion: { enabled: true, label: 'Seguro Educativo' },
        exequias: { enabled: true, label: 'Exequias' },
        mascotas: { enabled: false, label: 'Mascotas' }
      }
    },
    generales: {
      enabled: true,
      label: 'Seguros Generales',
      icon: 'fas fa-car-side',
      description: 'Vehículos, hogar, comercio, maquinaria, equipos electrónicos y arrendamiento con coberturas a tu medida.',
      subtypes: {
        autos: { enabled: true, label: 'Seguro de Autos' },
        hogar: { enabled: true, label: 'Seguro de Hogar' },
        maquinaria: { enabled: true, label: 'Maquinaria / Equipos' },
        arrendamiento: { enabled: true, label: 'Arrendamiento' },
        comercio: { enabled: false, label: 'Comercio / Pyme' }
      }
    },
    empresariales: {
      enabled: true,
      label: 'Seguros Empresariales',
      icon: 'fas fa-building-shield',
      description: 'Responsabilidad civil, cumplimiento, transporte de mercancías y pólizas corporativas para tu empresa.',
      subtypes: {
        rc: { enabled: true, label: 'Responsabilidad Civil' },
        cumplimiento: { enabled: true, label: 'Cumplimiento' },
        transporte: { enabled: true, label: 'Transporte de Mercancías' },
        pyme: { enabled: true, label: 'Pyme / Comercio' },
        rcProfesional: { enabled: false, label: 'RC Profesional' }
      }
    },
    arl: {
      enabled: true,
      label: 'ARL',
      icon: 'fas fa-hard-hat',
      description: 'Gestión integral de riesgos laborales, afiliación ARL y asesoría en seguridad y salud en el trabajo.',
      subtypes: {
        afiliacion: { enabled: true, label: 'ARL' },
        sst: { enabled: true, label: 'Seguridad y Salud en el Trabajo' }
      }
    }
  },
  ctaSection: {
    title: '¿Listo para proteger lo que más importa?',
    description: 'Cotiza tu seguro en minutos. Nuestro equipo de asesores está listo para ayudarte a encontrar la cobertura ideal.',
    btnPrimary: 'Cotiza tu seguro ahora',
    btnSecondary: 'Escríbenos por WhatsApp'
  }
};

/* ==========================================
   HELPERS
   ========================================== */
function escAttr(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setVal(id, value) {
  var el = document.getElementById(id);
  if (el) el.value = (value !== undefined && value !== null) ? value : '';
}

function getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : '';
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepMerge(target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

/* ==========================================
   STORAGE
   ========================================== */
function loadConfig() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      return deepMerge(deepClone(DEFAULT_CONFIG), parsed);
    }
  } catch (e) {
    console.warn('Admin: Error loading config from localStorage', e);
  }
  return deepClone(DEFAULT_CONFIG);
}

function saveConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    return true;
  } catch (e) {
    console.error('Admin: Error saving config', e);
    return false;
  }
}

/* ==========================================
   TOAST NOTIFICATIONS
   ========================================== */
function showToast(message, type) {
  type = type || 'success';
  var container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<i class="fas ' + (icons[type] || icons.success) + '"></i> ' + escHTML(message);
  container.appendChild(toast);
  setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3200);
}

/* ==========================================
   GLOBAL STATE
   ========================================== */
var config = loadConfig();

/* ==========================================
   INIT - DOMContentLoaded
   ========================================== */
document.addEventListener('DOMContentLoaded', function () {
  console.log('Admin: Initializing panel...');

  try { initSidebar(); } catch (e) { console.error('initSidebar failed', e); }
  try { initTabs(); } catch (e) { console.error('initTabs failed', e); }
  try { renderDashboard(); } catch (e) { console.error('renderDashboard failed', e); }
  try { renderAllForms(); } catch (e) { console.error('renderAllForms failed', e); }
  try { initTopbarButtons(); } catch (e) { console.error('initTopbarButtons failed', e); }
  try { initMobileMenu(); } catch (e) { console.error('initMobileMenu failed', e); }
  try { initAddTestimonialBtn(); } catch (e) { console.error('initAddTestimonialBtn failed', e); }

  // Version indicator
  var versionEl = document.getElementById('adminVersion');
  if (versionEl) versionEl.textContent = 'v3 - OK';

  console.log('Admin: Panel v3 ready.');
});

/* ==========================================
   SIDEBAR & TAB NAVIGATION
   ========================================== */
function initSidebar() {
  var links = document.querySelectorAll('.sidebar-nav a[data-tab]');
  for (var i = 0; i < links.length; i++) {
    (function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var tabId = link.getAttribute('data-tab');
        switchTab(tabId);
        var title = link.textContent ? link.textContent.trim() : '';
        var pageTitle = document.getElementById('pageTitle');
        if (pageTitle && title) pageTitle.textContent = title;
        var sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) sidebar.classList.remove('open');
      });
    })(links[i]);
  }
}

function initTabs() {
  var hash = window.location.hash ? window.location.hash.replace('#', '') : '';
  if (hash && document.getElementById(hash)) {
    switchTab(hash);
  }
}

function switchTab(tabId) {
  // Hide all panels
  var panels = document.querySelectorAll('.tab-panel');
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove('active');
    panels[i].style.display = 'none';
  }
  // Deactivate sidebar links
  var sideLinks = document.querySelectorAll('.sidebar-nav a');
  for (var j = 0; j < sideLinks.length; j++) {
    sideLinks[j].classList.remove('active');
  }
  // Show target panel
  var panel = document.getElementById(tabId);
  if (panel) {
    panel.classList.add('active');
    panel.style.display = 'block';
  }
  // Activate sidebar link
  var link = document.querySelector('[data-tab="' + tabId + '"]');
  if (link) link.classList.add('active');

  // Update hash without scrolling
  if (history.replaceState) {
    history.replaceState(null, null, '#' + tabId);
  }
}

function initMobileMenu() {
  var btn = document.querySelector('.mobile-menu-btn');
  var sidebar = document.querySelector('.admin-sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      sidebar.classList.toggle('open');
    });
  }
}

function initAddTestimonialBtn() {
  var btn = document.getElementById('btnAddTestimonial');
  if (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      addTestimonial();
    });
  }
}

/* ==========================================
   TOPBAR BUTTONS (Save, Preview, Reset)
   ========================================== */
function initTopbarButtons() {
  // SAVE button (only topbar, NOT the "Agregar" btn)
  var saveBtn = document.getElementById('btnSaveMain');
  if (saveBtn) {
    saveBtn.addEventListener('click', function (e) {
      e.preventDefault();
      collectAndSave();
    });
  }

  // PREVIEW button
  var previewBtn = document.getElementById('btnPreview');
  if (previewBtn) {
    previewBtn.addEventListener('click', function (e) {
      e.preventDefault();
      collectAndSave();
      window.open('index.html', '_blank');
    });
  }

  // RESET button
  var resetBtn = document.getElementById('btnReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('¿Estás seguro de restaurar toda la configuración a valores por defecto? Esta acción no se puede deshacer.')) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
        config = deepClone(DEFAULT_CONFIG);
        renderAllForms();
        renderDashboard();
        showToast('Configuración restaurada a valores por defecto', 'warning');
      }
    });
  }
}

/* ==========================================
   DASHBOARD
   ========================================== */
function renderDashboard() {
  var activeModules = 0;
  var totalModules = 0;
  for (var mk in config.modules) {
    if (config.modules.hasOwnProperty(mk)) {
      totalModules++;
      if (config.modules[mk].enabled) activeModules++;
    }
  }

  var activeInsurance = 0;
  var totalSubtypes = 0;
  for (var ik in config.insuranceTypes) {
    if (config.insuranceTypes.hasOwnProperty(ik)) {
      if (config.insuranceTypes[ik].enabled) activeInsurance++;
      var subs = config.insuranceTypes[ik].subtypes;
      for (var sk in subs) {
        if (subs.hasOwnProperty(sk) && subs[sk].enabled) totalSubtypes++;
      }
    }
  }

  var el1 = document.getElementById('dashActiveModules');
  var el2 = document.getElementById('dashActiveInsurance');
  var el3 = document.getElementById('dashActiveSubtypes');
  var el4 = document.getElementById('dashTestimonials');
  if (el1) el1.textContent = activeModules + '/' + totalModules;
  if (el2) el2.textContent = activeInsurance;
  if (el3) el3.textContent = totalSubtypes;
  if (el4) el4.textContent = config.testimonials.length;
}

/* ==========================================
   RENDER ALL FORMS
   ========================================== */
function renderAllForms() {
  renderSiteInfo();
  renderHeroForm();
  renderAboutForm();
  renderStatsForm();
  renderWhyForm();
  renderCtaForm();
  renderModulesPanel();
  renderInsurancePanel();
  renderTestimonialsPanel();
}

function renderSiteInfo() {
  setVal('sitePhone', config.site.phone);
  setVal('siteEmail', config.site.email);
  setVal('siteWhatsapp', config.site.whatsapp);
  setVal('siteSchedule', config.site.schedule);
  setVal('siteLocation', config.site.location);
  setVal('siteFacebook', config.site.facebook);
  setVal('siteInstagram', config.site.instagram);
  setVal('siteLinkedin', config.site.linkedin);
  setVal('siteTiktok', config.site.tiktok);
  setVal('siteYoutube', config.site.youtube);
}

function renderHeroForm() {
  setVal('heroBadge', config.hero.badge);
  setVal('heroTitle', config.hero.title);
  setVal('heroSubtitle', config.hero.subtitle);
  setVal('heroCtaPrimary', config.hero.ctaPrimary);
  setVal('heroCtaSecondary', config.hero.ctaSecondary);
  setVal('heroStat1Number', config.hero.stat1Number);
  setVal('heroStat1Label', config.hero.stat1Label);
  setVal('heroStat2Number', config.hero.stat2Number);
  setVal('heroStat2Label', config.hero.stat2Label);
  setVal('heroStat3Number', config.hero.stat3Number);
  setVal('heroStat3Label', config.hero.stat3Label);
}

function renderAboutForm() {
  setVal('aboutSubtitle', config.about.subtitle);
  setVal('aboutTitle', config.about.title);
  setVal('aboutParagraph1', config.about.paragraph1);
  setVal('aboutParagraph2', config.about.paragraph2);
  setVal('aboutExpNumber', config.about.experienceNumber);
  setVal('aboutExpText', config.about.experienceText);
}

function renderStatsForm() {
  setVal('statsNum1', config.stats.stat1.number);
  setVal('statsSuffix1', config.stats.stat1.suffix);
  setVal('statsLabel1', config.stats.stat1.label);
  setVal('statsNum2', config.stats.stat2.number);
  setVal('statsSuffix2', config.stats.stat2.suffix);
  setVal('statsLabel2', config.stats.stat2.label);
  setVal('statsNum3', config.stats.stat3.number);
  setVal('statsSuffix3', config.stats.stat3.suffix);
  setVal('statsLabel3', config.stats.stat3.label);
  setVal('statsNum4', config.stats.stat4.number);
  setVal('statsSuffix4', config.stats.stat4.suffix);
  setVal('statsLabel4', config.stats.stat4.label);
}

function renderWhyForm() {
  setVal('whySubtitle', config.why.subtitle);
  setVal('whyTitle', config.why.title);
  setVal('whyDescription', config.why.description);
  for (var i = 0; i < config.why.cards.length; i++) {
    setVal('whyIcon' + i, config.why.cards[i].icon);
    setVal('whyCardTitle' + i, config.why.cards[i].title);
    setVal('whyCardText' + i, config.why.cards[i].text);
  }
}

function renderCtaForm() {
  setVal('ctaTitle', config.ctaSection.title);
  setVal('ctaDescription', config.ctaSection.description);
  setVal('ctaBtnPrimary', config.ctaSection.btnPrimary);
  setVal('ctaBtnSecondary', config.ctaSection.btnSecondary);
}

/* ==========================================
   MODULES PANEL
   ========================================== */
function renderModulesPanel() {
  var container = document.getElementById('modulesToggleList');
  if (!container) return;

  var icons = {
    topbar: 'fas fa-bars',
    hero: 'fas fa-image',
    marquee: 'fas fa-images',
    about: 'fas fa-info-circle',
    services: 'fas fa-th-large',
    why: 'fas fa-star',
    stats: 'fas fa-chart-bar',
    productHighlight: 'fas fa-car',
    testimonials: 'fas fa-comments',
    cta: 'fas fa-bullhorn',
    contact: 'fas fa-envelope',
    whatsappFloat: 'fab fa-whatsapp'
  };

  var html = '';
  for (var key in config.modules) {
    if (!config.modules.hasOwnProperty(key)) continue;
    var mod = config.modules[key];
    html += '<div class="toggle-item">' +
      '<div class="toggle-info">' +
        '<div class="toggle-icon"><i class="' + (icons[key] || 'fas fa-puzzle-piece') + '"></i></div>' +
        '<div class="toggle-text">' +
          '<strong>' + escHTML(mod.label) + '</strong>' +
          '<span>' + escHTML(mod.description) + '</span>' +
        '</div>' +
      '</div>' +
      '<label class="toggle-switch">' +
        '<input type="checkbox" data-module="' + key + '"' + (mod.enabled ? ' checked' : '') + '>' +
        '<span class="toggle-slider"></span>' +
      '</label>' +
    '</div>';
  }
  container.innerHTML = html;

  // Bind change events
  var inputs = container.querySelectorAll('input[data-module]');
  for (var i = 0; i < inputs.length; i++) {
    (function (input) {
      input.addEventListener('change', function () {
        config.modules[input.getAttribute('data-module')].enabled = input.checked;
      });
    })(inputs[i]);
  }
}

/* ==========================================
   INSURANCE TYPES PANEL
   ========================================== */
function renderInsurancePanel() {
  var container = document.getElementById('insurancePanel');
  if (!container) return;

  var html = '';
  for (var catKey in config.insuranceTypes) {
    if (!config.insuranceTypes.hasOwnProperty(catKey)) continue;
    var cat = config.insuranceTypes[catKey];

    html += '<div class="admin-card">' +
      '<div class="admin-card-header">' +
        '<h3><i class="' + escAttr(cat.icon) + '"></i> ' + escHTML(cat.label) + '</h3>' +
        '<label class="toggle-switch">' +
          '<input type="checkbox" data-insurance-cat="' + catKey + '"' + (cat.enabled ? ' checked' : '') + '>' +
          '<span class="toggle-slider"></span>' +
        '</label>' +
      '</div>' +
      '<div class="admin-card-body">' +
        '<div class="form-group" style="margin-bottom:16px">' +
          '<label>Descripción de la categoría</label>' +
          '<textarea data-insurance-desc="' + catKey + '" rows="2">' + escHTML(cat.description) + '</textarea>' +
        '</div>' +
        '<label style="font-weight:600;font-size:0.82rem;margin-bottom:8px;display:block">Subtipos de seguros</label>' +
        '<div class="insurance-types-grid">';

    for (var subKey in cat.subtypes) {
      if (!cat.subtypes.hasOwnProperty(subKey)) continue;
      var sub = cat.subtypes[subKey];
      html += '<div class="insurance-type-card' + (sub.enabled ? '' : ' disabled') + '" id="card-' + catKey + '-' + subKey + '">' +
        '<div class="insurance-type-info">' +
          '<i class="' + escAttr(cat.icon) + '"></i>' +
          '<strong>' + escHTML(sub.label) + '</strong>' +
        '</div>' +
        '<label class="toggle-switch">' +
          '<input type="checkbox" data-insurance-sub="' + catKey + '.' + subKey + '"' + (sub.enabled ? ' checked' : '') + '>' +
          '<span class="toggle-slider"></span>' +
        '</label>' +
      '</div>';
    }

    html += '</div></div></div>';
  }

  container.innerHTML = html;

  // Bind category toggles
  var catInputs = container.querySelectorAll('input[data-insurance-cat]');
  for (var c = 0; c < catInputs.length; c++) {
    (function (input) {
      input.addEventListener('change', function () {
        config.insuranceTypes[input.getAttribute('data-insurance-cat')].enabled = input.checked;
      });
    })(catInputs[c]);
  }

  // Bind subtype toggles
  var subInputs = container.querySelectorAll('input[data-insurance-sub]');
  for (var s = 0; s < subInputs.length; s++) {
    (function (input) {
      input.addEventListener('change', function () {
        var parts = input.getAttribute('data-insurance-sub').split('.');
        var catK = parts[0];
        var subK = parts[1];
        config.insuranceTypes[catK].subtypes[subK].enabled = input.checked;
        var card = document.getElementById('card-' + catK + '-' + subK);
        if (card) {
          if (input.checked) {
            card.classList.remove('disabled');
          } else {
            card.classList.add('disabled');
          }
        }
      });
    })(subInputs[s]);
  }

  // Bind description textareas
  var descTAs = container.querySelectorAll('textarea[data-insurance-desc]');
  for (var d = 0; d < descTAs.length; d++) {
    (function (ta) {
      ta.addEventListener('input', function () {
        config.insuranceTypes[ta.getAttribute('data-insurance-desc')].description = ta.value;
      });
    })(descTAs[d]);
  }
}

/* ==========================================
   TESTIMONIALS PANEL
   ========================================== */
function renderTestimonialsPanel() {
  var container = document.getElementById('testimonialsEditor');
  if (!container) return;

  var html = '';
  for (var i = 0; i < config.testimonials.length; i++) {
    var t = config.testimonials[i];
    var disabledAttr = config.testimonials.length <= 1 ? ' disabled' : '';
    html += '<div class="testimonial-edit-card">' +
      '<div class="testimonial-edit-header">' +
        '<h4><i class="fas fa-quote-left" style="color:var(--admin-accent);margin-right:6px"></i> Testimonio ' + (i + 1) + '</h4>' +
        '<button class="btn-remove" data-remove-testimonial="' + i + '"' + disabledAttr + '>' +
          '<i class="fas fa-trash"></i> Eliminar' +
        '</button>' +
      '</div>' +
      '<div class="form-grid">' +
        '<div class="form-group">' +
          '<label>Nombre</label>' +
          '<input type="text" value="' + escAttr(t.name) + '" data-testimonial="' + i + '" data-field="name">' +
        '</div>' +
        '<div class="form-group">' +
          '<label>Cargo / Empresa</label>' +
          '<input type="text" value="' + escAttr(t.role) + '" data-testimonial="' + i + '" data-field="role">' +
        '</div>' +
      '</div>' +
      '<div class="form-group" style="margin-top:12px">' +
        '<label>Testimonio</label>' +
        '<textarea data-testimonial="' + i + '" data-field="text" rows="3">' + escHTML(t.text) + '</textarea>' +
      '</div>' +
      '<div class="form-group" style="margin-top:12px">' +
        '<label>Iniciales (para avatar)</label>' +
        '<input type="text" value="' + escAttr(t.initials) + '" data-testimonial="' + i + '" data-field="initials" maxlength="3" style="width:80px">' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;

  // Bind input changes
  var fields = container.querySelectorAll('[data-testimonial][data-field]');
  for (var f = 0; f < fields.length; f++) {
    (function (el) {
      el.addEventListener('input', function () {
        var idx = parseInt(el.getAttribute('data-testimonial'), 10);
        var field = el.getAttribute('data-field');
        if (config.testimonials[idx]) {
          config.testimonials[idx][field] = el.value;
        }
      });
    })(fields[f]);
  }

  // Bind remove buttons
  var removeBtns = container.querySelectorAll('[data-remove-testimonial]');
  for (var r = 0; r < removeBtns.length; r++) {
    (function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var idx = parseInt(btn.getAttribute('data-remove-testimonial'), 10);
        removeTestimonial(idx);
      });
    })(removeBtns[r]);
  }
}

function addTestimonial() {
  config.testimonials.push({
    name: 'Nuevo Cliente',
    role: 'Cargo, Empresa',
    initials: 'NC',
    text: 'Escribe el testimonio aquí...'
  });
  renderTestimonialsPanel();
  renderDashboard();
  showToast('Testimonio agregado', 'success');
}

function removeTestimonial(index) {
  if (config.testimonials.length <= 1) {
    showToast('Debe haber al menos un testimonio', 'warning');
    return;
  }
  config.testimonials.splice(index, 1);
  renderTestimonialsPanel();
  renderDashboard();
  showToast('Testimonio eliminado', 'warning');
}

/* ==========================================
   COLLECT & SAVE
   ========================================== */
function collectAndSave() {
  // Site info
  config.site.phone = getVal('sitePhone');
  config.site.email = getVal('siteEmail');
  config.site.whatsapp = getVal('siteWhatsapp');
  config.site.schedule = getVal('siteSchedule');
  config.site.location = getVal('siteLocation');
  config.site.facebook = getVal('siteFacebook');
  config.site.instagram = getVal('siteInstagram');
  config.site.linkedin = getVal('siteLinkedin');
  config.site.tiktok = getVal('siteTiktok');
  config.site.youtube = getVal('siteYoutube');

  // Hero
  config.hero.badge = getVal('heroBadge');
  config.hero.title = getVal('heroTitle');
  config.hero.subtitle = getVal('heroSubtitle');
  config.hero.ctaPrimary = getVal('heroCtaPrimary');
  config.hero.ctaSecondary = getVal('heroCtaSecondary');
  config.hero.stat1Number = getVal('heroStat1Number');
  config.hero.stat1Label = getVal('heroStat1Label');
  config.hero.stat2Number = getVal('heroStat2Number');
  config.hero.stat2Label = getVal('heroStat2Label');
  config.hero.stat3Number = getVal('heroStat3Number');
  config.hero.stat3Label = getVal('heroStat3Label');

  // About
  config.about.subtitle = getVal('aboutSubtitle');
  config.about.title = getVal('aboutTitle');
  config.about.paragraph1 = getVal('aboutParagraph1');
  config.about.paragraph2 = getVal('aboutParagraph2');
  config.about.experienceNumber = getVal('aboutExpNumber');
  config.about.experienceText = getVal('aboutExpText');

  // Stats
  config.stats.stat1 = { number: parseInt(getVal('statsNum1'), 10) || 0, suffix: getVal('statsSuffix1'), label: getVal('statsLabel1') };
  config.stats.stat2 = { number: parseInt(getVal('statsNum2'), 10) || 0, suffix: getVal('statsSuffix2'), label: getVal('statsLabel2') };
  config.stats.stat3 = { number: parseInt(getVal('statsNum3'), 10) || 0, suffix: getVal('statsSuffix3'), label: getVal('statsLabel3') };
  config.stats.stat4 = { number: parseInt(getVal('statsNum4'), 10) || 0, suffix: getVal('statsSuffix4'), label: getVal('statsLabel4') };

  // Why
  config.why.subtitle = getVal('whySubtitle');
  config.why.title = getVal('whyTitle');
  config.why.description = getVal('whyDescription');
  for (var i = 0; i < config.why.cards.length; i++) {
    var iconVal = getVal('whyIcon' + i);
    var titleVal = getVal('whyCardTitle' + i);
    var textVal = getVal('whyCardText' + i);
    if (iconVal) config.why.cards[i].icon = iconVal;
    if (titleVal) config.why.cards[i].title = titleVal;
    if (textVal) config.why.cards[i].text = textVal;
  }

  // CTA
  config.ctaSection.title = getVal('ctaTitle');
  config.ctaSection.description = getVal('ctaDescription');
  config.ctaSection.btnPrimary = getVal('ctaBtnPrimary');
  config.ctaSection.btnSecondary = getVal('ctaBtnSecondary');

  // Modules and Insurance are already updated in real-time via change listeners

  var ok = saveConfig(config);
  renderDashboard();

  if (ok) {
    showToast('Cambios guardados correctamente', 'success');
  } else {
    showToast('Error al guardar los cambios', 'error');
  }
}

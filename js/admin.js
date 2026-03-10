/* ========================================
   AsiSeguros - Admin Panel Logic
   ======================================== */

const STORAGE_KEY = 'asiseguros_admin';

// Default configuration
const DEFAULT_CONFIG = {
  // -- Site Info --
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

  // -- Hero --
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

  // -- About --
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

  // -- Stats --
  stats: {
    stat1: { number: 37000, suffix: '+', label: 'Clientes protegidos' },
    stat2: { number: 15, suffix: '+', label: 'Aseguradoras aliadas' },
    stat3: { number: 10, suffix: '+', label: 'Años de experiencia' },
    stat4: { number: 98, suffix: '%', label: 'Satisfacción del cliente' }
  },

  // -- Why Choose Us --
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

  // -- Testimonials --
  testimonials: [
    { name: 'Carlos Martínez', role: 'Gerente General, LogiTransport S.A.S.', initials: 'CM', text: 'AsiSeguros nos ayudó a encontrar la póliza perfecta para nuestra empresa. Su asesoría fue clave para proteger nuestros activos con la mejor relación costo-beneficio.' },
    { name: 'Laura Rodríguez', role: 'Cliente particular', initials: 'LR', text: 'Excelente acompañamiento en todo el proceso. Cuando tuve un siniestro con mi vehículo, me guiaron paso a paso hasta la resolución. Totalmente recomendados.' },
    { name: 'Andrés Peña', role: 'Director Financiero, Constructora Altus', initials: 'AP', text: 'Llevamos más de 5 años con AsiSeguros y su servicio siempre es impecable. Nos asesoran de manera honesta y transparente, sin presionar ventas innecesarias.' }
  ],

  // -- Modules Toggle --
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

  // -- Insurance Types --
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

  // -- CTA --
  ctaSection: {
    title: '¿Listo para proteger lo que más importa?',
    description: 'Cotiza tu seguro en minutos. Nuestro equipo de asesores está listo para ayudarte a encontrar la cobertura ideal.',
    btnPrimary: 'Cotiza tu seguro ahora',
    btnSecondary: 'Escríbenos por WhatsApp'
  }
};

// ==========================================
// STORAGE
// ==========================================
function loadConfig() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), JSON.parse(saved));
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// ==========================================
// INIT
// ==========================================
let config = loadConfig();

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTabs();
  renderDashboard();
  renderAllForms();
  initSaveButtons();
  initMobileMenu();
});

// ==========================================
// SIDEBAR & TABS
// ==========================================
function initSidebar() {
  document.querySelectorAll('.sidebar-nav a[data-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);

      // Update topbar title
      document.getElementById('pageTitle').textContent = link.textContent.trim();

      // Close mobile sidebar
      document.querySelector('.admin-sidebar').classList.remove('open');
    });
  });
}

function initTabs() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    switchTab(hash);
  }
}

function switchTab(tabId) {
  // Hide all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  // Deactivate sidebar links
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

  // Show target panel
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');

  // Activate sidebar link
  const link = document.querySelector(`[data-tab="${tabId}"]`);
  if (link) link.classList.add('active');

  window.location.hash = tabId;
}

function initMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.admin-sidebar');
  if (btn) {
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// ==========================================
// DASHBOARD
// ==========================================
function renderDashboard() {
  const activeModules = Object.values(config.modules).filter(m => m.enabled).length;
  const totalModules = Object.keys(config.modules).length;
  const activeInsurance = Object.values(config.insuranceTypes).filter(t => t.enabled).length;
  const totalSubtypes = Object.values(config.insuranceTypes).reduce((acc, t) => {
    return acc + Object.values(t.subtypes).filter(s => s.enabled).length;
  }, 0);

  document.getElementById('dashActiveModules').textContent = `${activeModules}/${totalModules}`;
  document.getElementById('dashActiveInsurance').textContent = activeInsurance;
  document.getElementById('dashActiveSubtypes').textContent = totalSubtypes;
  document.getElementById('dashTestimonials').textContent = config.testimonials.length;
}

// ==========================================
// RENDER ALL FORMS
// ==========================================
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

// -- Site Info --
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

// -- Hero --
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

// -- About --
function renderAboutForm() {
  setVal('aboutSubtitle', config.about.subtitle);
  setVal('aboutTitle', config.about.title);
  setVal('aboutParagraph1', config.about.paragraph1);
  setVal('aboutParagraph2', config.about.paragraph2);
  setVal('aboutExpNumber', config.about.experienceNumber);
  setVal('aboutExpText', config.about.experienceText);
}

// -- Stats --
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

// -- Why --
function renderWhyForm() {
  setVal('whySubtitle', config.why.subtitle);
  setVal('whyTitle', config.why.title);
  setVal('whyDescription', config.why.description);
  config.why.cards.forEach((card, i) => {
    setVal(`whyIcon${i}`, card.icon);
    setVal(`whyCardTitle${i}`, card.title);
    setVal(`whyCardText${i}`, card.text);
  });
}

// -- CTA --
function renderCtaForm() {
  setVal('ctaTitle', config.ctaSection.title);
  setVal('ctaDescription', config.ctaSection.description);
  setVal('ctaBtnPrimary', config.ctaSection.btnPrimary);
  setVal('ctaBtnSecondary', config.ctaSection.btnSecondary);
}

// -- Modules --
function renderModulesPanel() {
  const container = document.getElementById('modulesToggleList');
  if (!container) return;

  const icons = {
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

  container.innerHTML = Object.entries(config.modules).map(([key, mod]) => `
    <div class="toggle-item">
      <div class="toggle-info">
        <div class="toggle-icon"><i class="${icons[key] || 'fas fa-puzzle-piece'}"></i></div>
        <div class="toggle-text">
          <strong>${mod.label}</strong>
          <span>${mod.description}</span>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" data-module="${key}" ${mod.enabled ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join('');

  // Bind events
  container.querySelectorAll('input[data-module]').forEach(input => {
    input.addEventListener('change', () => {
      config.modules[input.dataset.module].enabled = input.checked;
    });
  });
}

// -- Insurance Types --
function renderInsurancePanel() {
  const container = document.getElementById('insurancePanel');
  if (!container) return;

  container.innerHTML = Object.entries(config.insuranceTypes).map(([catKey, cat]) => `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3><i class="${cat.icon}"></i> ${cat.label}</h3>
        <label class="toggle-switch">
          <input type="checkbox" data-insurance-cat="${catKey}" ${cat.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="admin-card-body">
        <div class="form-group" style="margin-bottom:16px">
          <label>Descripción de la categoría</label>
          <textarea data-insurance-desc="${catKey}" rows="2">${cat.description}</textarea>
        </div>
        <label style="font-weight:600;font-size:0.82rem;margin-bottom:8px;display:block">Subtipos de seguros</label>
        <div class="insurance-types-grid">
          ${Object.entries(cat.subtypes).map(([subKey, sub]) => `
            <div class="insurance-type-card ${sub.enabled ? '' : 'disabled'}" id="card-${catKey}-${subKey}">
              <div class="insurance-type-info">
                <i class="${cat.icon}"></i>
                <strong>${sub.label}</strong>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" data-insurance-sub="${catKey}.${subKey}" ${sub.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  // Bind category toggles
  container.querySelectorAll('input[data-insurance-cat]').forEach(input => {
    input.addEventListener('change', () => {
      config.insuranceTypes[input.dataset.insuranceCat].enabled = input.checked;
    });
  });

  // Bind subtype toggles
  container.querySelectorAll('input[data-insurance-sub]').forEach(input => {
    input.addEventListener('change', () => {
      const [cat, sub] = input.dataset.insuranceSub.split('.');
      config.insuranceTypes[cat].subtypes[sub].enabled = input.checked;
      const card = document.getElementById(`card-${cat}-${sub}`);
      if (card) card.classList.toggle('disabled', !input.checked);
    });
  });

  // Bind description textareas
  container.querySelectorAll('textarea[data-insurance-desc]').forEach(ta => {
    ta.addEventListener('input', () => {
      config.insuranceTypes[ta.dataset.insuranceDesc].description = ta.value;
    });
  });
}

// -- Testimonials --
function renderTestimonialsPanel() {
  const container = document.getElementById('testimonialsEditor');
  if (!container) return;

  container.innerHTML = config.testimonials.map((t, i) => `
    <div class="testimonial-edit-card">
      <div class="testimonial-edit-header">
        <h4><i class="fas fa-quote-left" style="color:var(--admin-accent);margin-right:6px"></i> Testimonio ${i + 1}</h4>
        <button class="btn-remove" onclick="removeTestimonial(${i})" ${config.testimonials.length <= 1 ? 'disabled' : ''}>
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" value="${t.name}" data-testimonial="${i}" data-field="name">
        </div>
        <div class="form-group">
          <label>Cargo / Empresa</label>
          <input type="text" value="${t.role}" data-testimonial="${i}" data-field="role">
        </div>
      </div>
      <div class="form-group" style="margin-top:12px">
        <label>Testimonio</label>
        <textarea data-testimonial="${i}" data-field="text" rows="3">${t.text}</textarea>
      </div>
      <div class="form-group" style="margin-top:12px">
        <label>Iniciales (para avatar)</label>
        <input type="text" value="${t.initials}" data-testimonial="${i}" data-field="initials" maxlength="3" style="width:80px">
      </div>
    </div>
  `).join('');

  // Bind inputs
  container.querySelectorAll('[data-testimonial]').forEach(el => {
    el.addEventListener('input', () => {
      const idx = parseInt(el.dataset.testimonial);
      const field = el.dataset.field;
      config.testimonials[idx][field] = el.value;
    });
  });
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
}

function removeTestimonial(index) {
  if (config.testimonials.length <= 1) return;
  config.testimonials.splice(index, 1);
  renderTestimonialsPanel();
  renderDashboard();
}

// ==========================================
// SAVE & COLLECT
// ==========================================
function initSaveButtons() {
  document.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', collectAndSave);
  });

  document.querySelectorAll('.btn-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de restaurar toda la configuración a valores por defecto? Esta acción no se puede deshacer.')) {
        localStorage.removeItem(STORAGE_KEY);
        config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        renderAllForms();
        renderDashboard();
        showToast('Configuración restaurada a valores por defecto', 'warning');
      }
    });
  });

  document.querySelectorAll('.btn-preview').forEach(btn => {
    btn.addEventListener('click', () => {
      collectAndSave();
      window.open('index.html', '_blank');
    });
  });
}

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
  config.stats.stat1 = { number: parseInt(getVal('statsNum1')) || 0, suffix: getVal('statsSuffix1'), label: getVal('statsLabel1') };
  config.stats.stat2 = { number: parseInt(getVal('statsNum2')) || 0, suffix: getVal('statsSuffix2'), label: getVal('statsLabel2') };
  config.stats.stat3 = { number: parseInt(getVal('statsNum3')) || 0, suffix: getVal('statsSuffix3'), label: getVal('statsLabel3') };
  config.stats.stat4 = { number: parseInt(getVal('statsNum4')) || 0, suffix: getVal('statsSuffix4'), label: getVal('statsLabel4') };

  // Why
  config.why.subtitle = getVal('whySubtitle');
  config.why.title = getVal('whyTitle');
  config.why.description = getVal('whyDescription');
  config.why.cards.forEach((card, i) => {
    card.icon = getVal(`whyIcon${i}`);
    card.title = getVal(`whyCardTitle${i}`);
    card.text = getVal(`whyCardText${i}`);
  });

  // CTA
  config.ctaSection.title = getVal('ctaTitle');
  config.ctaSection.description = getVal('ctaDescription');
  config.ctaSection.btnPrimary = getVal('ctaBtnPrimary');
  config.ctaSection.btnSecondary = getVal('ctaBtnSecondary');

  saveConfig(config);
  renderDashboard();
  showToast('Cambios guardados correctamente', 'success');
}

// ==========================================
// HELPERS
// ==========================================
function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
  toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

/* ========================================
   AsiSeguros - Aviso de cookies y Google Analytics 4
   ========================================
   APAGADO mientras ID_GA esté vacío: el archivo no muestra aviso ni carga nada.
   Encendido tras la aprobación de legal (21-oct-2026).

   Es lo único que carga la etiqueta de Google (gtag.js) del sitio: Google Ads
   (AW-18515961236) y Google Analytics 4. Las páginas ya no la traen en el <head>.
   Mientras el visitante no acepte, no se descarga gtag.js, no se instala ninguna
   cookie de Google (tampoco _gcl_au de Ads) ni se envía nada. Rechazar o aceptar se recuerda 12 meses en
   localStorage (es una preferencia del propio sitio, no una cookie de terceros).
   ======================================== */

(() => {
  // ID de la propiedad de Analytics (cuenta asisegurosmarketing@gmail.com).
  // Vacío = todo apagado (aviso, Analytics y Ads).
  const ID_GA = 'G-D67MJX85QQ';
  // Etiqueta de Google Ads (cuenta 477-175-2639)
  const ID_ADS = 'AW-18515961236';
  if (!ID_GA) return;

  const CLAVE = 'asiseguros-cookies';
  const DOCE_MESES = 365 * 24 * 60 * 60 * 1000;

  function leer() {
    try {
      const d = JSON.parse(localStorage.getItem(CLAVE));
      if (d && (d.v === 'si' || d.v === 'no') && Date.now() - d.t < DOCE_MESES) return d.v;
    } catch (e) { /* almacenamiento bloqueado: se pregunta de nuevo */ }
    return null;
  }

  function guardar(v) {
    try { localStorage.setItem(CLAVE, JSON.stringify({ v, t: Date.now() })); } catch (e) {}
  }

  let cargado = false;
  function cargarAnalytics() {
    if (cargado) return;
    cargado = true;
    // Una sola etiqueta de Google para Ads y Analytics (el documento de Google
    // Ads pide no cargar una segunda). Solo existe después de aceptar.
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID_ADS);
    // Sin señales de Google ni personalización de anuncios (ver borrador, sección 3)
    window.gtag('config', ID_GA, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // 13 meses para las cookies _ga (borrador, sección 5); Google usa 2 años por defecto
      cookie_expires: 13 * 30 * 24 * 60 * 60 + 5 * 24 * 60 * 60
    });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ID_ADS);
    document.head.appendChild(s);
  }

  // Acciones medidas (borrador para legal, sección 6). Solo se envían si el
  // visitante aceptó y van únicamente a Analytics (send_to), no a Google Ads.
  // Ninguna lleva datos personales: solo el paso, el tipo de seguro elegido o
  // la página donde ocurrió el clic.
  function evento(nombre, params) {
    if (!cargado || typeof window.gtag !== 'function') return;
    window.gtag('event', nombre, Object.assign({ send_to: ID_GA }, params || {}));
  }

  let formularioIniciado = false;
  function escucharAcciones() {
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a');
      if (!a || e.defaultPrevented) return; // clic detenido por el aviso de WhatsApp
      const href = a.getAttribute('href') || '';
      const pagina = location.pathname;
      if (href.indexOf('wa.me/') > -1 || href.indexOf('api.whatsapp.com') > -1) evento('clic_whatsapp', { pagina });
      else if (href.indexOf('tel:') === 0) evento('clic_telefono', { pagina });
      else if (href.indexOf('portafolio-asiseguros') > -1) evento('descarga_portafolio', { pagina });
    });
    document.addEventListener('focusin', e => {
      if (formularioIniciado || !e.target.closest || !e.target.closest('#contactForm')) return;
      formularioIniciado = true;
      evento('inicio_formulario', { pagina: location.pathname });
    });
    // main.js emite 'asi:solicitud' cuando el servidor confirma cada paso
    document.addEventListener('asi:solicitud', e => {
      const d = e.detail || {};
      evento(d.paso === 2 ? 'envio_formulario_paso2' : 'envio_formulario', { tipo_seguro: d.tipo_seguro || '' });
    });
  }

  // Al retirar el consentimiento se borran las cookies de Google del dominio:
  // _ga y _ga_* (Analytics), _gcl_* y _gac_* (Google Ads)
  function borrarCookiesGa() {
    document.cookie.split(';').map(c => c.trim().split('=')[0])
      .filter(n => n === '_ga' || n.startsWith('_ga_') || n.startsWith('_gcl_') || n.startsWith('_gac_'))
      .forEach(n => {
        ['', '; domain=.asiseguros.com', '; domain=www.asiseguros.com'].forEach(d => {
          document.cookie = n + '=; Max-Age=0; path=/' + d;
        });
      });
  }

  const CSS = `
    .cookies-aviso { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 1000;
      max-width: 640px; margin: 0 auto; background: var(--primary, #0f2441); color: #fff;
      border-radius: var(--radius-md, 10px); box-shadow: var(--shadow-xl, 0 20px 50px rgba(0,0,0,.15));
      padding: 20px 22px; font-size: .9rem; line-height: 1.55; }
    .cookies-aviso h2 { font-size: 1rem; margin: 0 0 6px; color: #fff; }
    .cookies-aviso p { margin: 0; color: rgba(255,255,255,.88); }
    .cookies-aviso a { color: var(--secondary, #7df89a); }
    .cookies-botones { display: flex; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
    .cookies-botones button { flex: 1 1 120px; padding: 10px 16px; border-radius: var(--radius-sm, 6px);
      border: 0; font: inherit; font-weight: 700; cursor: pointer;
      background: var(--secondary, #7df89a); color: var(--primary, #0f2441); }
    .cookies-botones button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  `;

  function mostrarAviso() {
    if (document.querySelector('.cookies-aviso')) return;
    if (!document.getElementById('cookies-estilos')) {
      const st = document.createElement('style');
      st.id = 'cookies-estilos';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const aviso = document.createElement('section');
    aviso.className = 'cookies-aviso';
    aviso.setAttribute('role', 'region');
    aviso.setAttribute('aria-label', 'Aviso de cookies');
    // Texto del borrador para legal, sección 4. Los dos botones tienen el mismo peso visual.
    aviso.innerHTML = `
      <h2>Cookies en AsiSeguros</h2>
      <p>Usamos cookies necesarias para que el sitio funcione. Si las aceptas, también usamos
      cookies de Google Analytics para saber cómo se usa el sitio y mejorarlo, y de Google Ads para
      medir si nuestros anuncios funcionan; no les enviamos tu nombre, teléfono ni correo. Puedes cambiar tu decisión cuando quieras en «Configurar
      cookies», al pie de la página. Más información en la
      <a href="politica-tratamiento-datos.html">Política de Tratamiento de Datos</a>.</p>
      <div class="cookies-botones">
        <button type="button" data-cookies="si">Aceptar</button>
        <button type="button" data-cookies="no">Rechazar</button>
      </div>`;
    aviso.addEventListener('click', e => {
      const b = e.target.closest('[data-cookies]');
      if (!b) return;
      const v = b.dataset.cookies;
      guardar(v);
      aviso.remove();
      if (v === 'si') cargarAnalytics();
      else borrarCookiesGa();
    });
    document.body.appendChild(aviso);
  }

  // Enlace «Configurar cookies» al pie de cada página
  function enlacePie() {
    const pie = document.querySelector('.footer-bottom, .footer');
    if (!pie || pie.querySelector('.cookies-configurar')) return;
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'cookies-configurar';
    a.textContent = 'Configurar cookies';
    a.style.cssText = 'display:inline-block;margin:12px 0;color:inherit;font-size:.8rem;';
    a.addEventListener('click', e => { e.preventDefault(); mostrarAviso(); });
    pie.appendChild(a);
  }

  function iniciar() {
    enlacePie();
    escucharAcciones();
    const v = leer();
    if (v === 'si') cargarAnalytics();
    else if (v === null) mostrarAviso();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();

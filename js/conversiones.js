/* ========================================
   AsiSeguros - Conversiones de Google Ads
   ========================================
   Instrucciones del 15-oct-2026 (cuenta de Google Ads 477-175-2639, etiqueta
   AW-18515961236). La etiqueta de Google va en el <head> de cada página; este
   archivo solo envía los eventos de conversión.

   - Clic en WhatsApp y clic para llamar: cualquier enlace wa.me/573185231290,
     api.whatsapp.com o tel:, incluidos los botones flotantes.
   - Envío del formulario de cotización: main.js llama a
     asiConversion('formulario') solo cuando el servidor confirma el registro.
     Falta crear esa acción de conversión en Google Ads y pegar aquí su etiqueta;
     mientras esté vacía, el formulario queda con la detección automática.

   No se envían datos personales (nombre, correo, teléfono): el documento lo
   prohíbe sin autorización del Área Jurídica.
   ======================================== */

(() => {
  const CONVERSIONES = {
    whatsapp: 'AW-18515961236/WfOfCMyJup4dEJTLjP1E',
    llamada: 'AW-18515961236/m_TQCM-Jup4dEJTLjP1E',
    formulario: '' // p. ej. 'AW-18515961236/xxxxxxxxxxxx'
  };

  window.asiConversion = function (tipo) {
    const destino = CONVERSIONES[tipo];
    if (!destino || typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', { send_to: destino });
  };

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    // La primera vez por sesión, main.js detiene el enlace de WhatsApp y muestra
    // el aviso de privacidad (#waModal). Ese clic no abre WhatsApp: se cuenta el
    // de «Continuar», que sí lo abre. Así no hay conversiones dobles ni falsas.
    if (e.defaultPrevented) return;
    const href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me/573185231290') > -1 || href.indexOf('api.whatsapp.com') > -1) {
      window.asiConversion('whatsapp');
    } else if (href.indexOf('tel:') === 0) {
      window.asiConversion('llamada');
    }
  });
})();

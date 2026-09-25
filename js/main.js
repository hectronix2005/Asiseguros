/* ========================================
   AsiSeguros - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Apply Admin Config ---------- */
  applyAdminConfig();


  /* ---------- Header Scroll Effect ---------- */
  const header = document.querySelector('.header');
  const scrollTopBtn = document.querySelector('.scroll-top');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Sticky header shadow
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scroll to top button
    if (scrollTopBtn) {
      if (scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }
  });

  // Scroll to top click
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Mobile Menu ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 999; display: none;
  `;
  document.body.appendChild(overlay);

  function toggleMenu() {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    overlay.style.display = navMenu.classList.contains('active') ? 'block' : 'none';
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }

  overlay.addEventListener('click', toggleMenu);

  // Mobile dropdown toggle
  const dropdownParents = document.querySelectorAll('.nav-menu > li');
  dropdownParents.forEach(item => {
    const link = item.querySelector('a');
    const dropdown = item.querySelector('.dropdown-menu');

    if (dropdown && window.innerWidth <= 768) {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle('show');
        }
      });
    }
  });

  // Close menu on nav link click (mobile)
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768 && !link.nextElementSibling) {
        if (navMenu.classList.contains('active')) {
          toggleMenu();
        }
      }
    });
  });

  /* ---------- Scroll Reveal Animation ---------- */
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  /* ---------- Counter Animation ---------- */
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-target'));
        const suffix = counter.getAttribute('data-suffix') || '';
        const prefix = counter.getAttribute('data-prefix') || '';
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
          current += step;
          if (current < target) {
            counter.textContent = prefix + Math.floor(current).toLocaleString('es-CO') + suffix;
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = prefix + target.toLocaleString('es-CO') + suffix;
          }
        };

        updateCounter();
        counterObserver.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  /* ---------- Fotografías opcionales de fondo ----------
     Un elemento con data-photo declara la foto que le corresponde. Si el archivo
     existe se aplica como fondo y se marca .has-photo (que activa la capa oscura y
     el texto en blanco). Si no existe, no pasa nada: la sección se ve con su color
     de respaldo. Así se pueden subir las fotos sin tocar el código. */
  document.querySelectorAll('[data-photo]').forEach(el => {
    const src = el.getAttribute('data-photo');
    if (!src) return;
    const probe = new Image();
    probe.onload = () => {
      el.style.backgroundImage = `url("${src}")`;
      (el.classList.contains('service-media') ? el.closest('.service-card') : el)
        .classList.add('has-photo');
    };
    probe.src = src;
  });

  /* ---------- Marquee Duplication ---------- */
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    const items = marqueeTrack.innerHTML;
    marqueeTrack.innerHTML = items + items;
  }

  /* ---------- Smooth Scroll for Anchor Links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = header.offsetHeight;
        const targetPosition = targetEl.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ---------- Cart ---------- */
  initCart();

  /* ---------- Cuestionarios del paso 2 ----------
     Tras registrar la solicitud (y la autorización), se piden los datos
     técnicos que la aseguradora necesita para cotizar ese producto concreto.
     Van aparte a propósito: pedirlos de entrada alargaría el formulario y
     haría que mucha gente lo abandone antes de autorizar. */
  const CUESTIONARIOS = {
    autos: {
      titulo: 'Datos para cotizar tu seguro de vehículo',
      campos: [
        { id: 'propietario',  etiqueta: 'Nombre y cédula del propietario',
          ayuda: 'Tal como figura en la tarjeta de propiedad', tipo: 'text', obligatorio: true },
        { id: 'placa',        etiqueta: 'Placa del vehículo', tipo: 'text', obligatorio: true },
        { id: 'beneficiario_oneroso', etiqueta: '¿Tiene beneficiario oneroso?', tipo: 'select',
          opciones: ['No', 'Sí'], obligatorio: true },
        { id: 'beneficiario_cual', etiqueta: '¿Cuál? (banco o entidad)', tipo: 'text',
          dependeDe: { campo: 'beneficiario_oneroso', valor: 'Sí' } },
        { id: 'fecha_nacimiento', etiqueta: 'Fecha de nacimiento del propietario',
          tipo: 'date', obligatorio: true },
        { id: 'zona_circulacion', etiqueta: 'Zona de circulación del vehículo',
          ayuda: 'Ciudad o región donde circula habitualmente', tipo: 'text', obligatorio: true }
      ]
    },
    inmueble: {
      titulo: 'Datos para cotizar el seguro del inmueble',
      campos: [
        { id: 'propietario', etiqueta: 'Nombre y cédula del propietario', tipo: 'text', obligatorio: true },
        { id: 'uso', etiqueta: '¿El propietario habita el inmueble o lo arrienda?', tipo: 'select',
          opciones: ['Lo habita', 'Lo arrienda'], obligatorio: true },
        { id: 'direccion', etiqueta: 'Dirección completa del inmueble',
          ayuda: 'Incluye torre, número de apartamento, interior, etc.', tipo: 'textarea', obligatorio: true },
        { id: 'pisos', etiqueta: 'Número de pisos del edificio',
          ayuda: 'Indica también si tiene sótano', tipo: 'text', obligatorio: true },
        { id: 'anio_construccion', etiqueta: 'Año de construcción', tipo: 'text', obligatorio: true },
        { id: 'area_m2', etiqueta: 'Área de construcción (m²)', tipo: 'text', obligatorio: true },
        { id: 'valor_comercial', etiqueta: 'Valor comercial del inmueble', tipo: 'text', obligatorio: true }
      ]
    },
    carga: {
      titulo: 'Datos para cotizar el transporte de carga',
      campos: [
        { id: 'propietario', etiqueta: 'Nombre o razón social y NIT del transportador', tipo: 'text', obligatorio: true },
        { id: 'mercancia', etiqueta: '¿Qué mercancía se transporta?',
          ayuda: 'Tipo de producto y si requiere condiciones especiales', tipo: 'text', obligatorio: true },
        { id: 'rutas', etiqueta: 'Rutas habituales',
          ayuda: 'Ciudades de origen y destino', tipo: 'textarea', obligatorio: true },
        { id: 'valor_despacho', etiqueta: 'Valor máximo por despacho', tipo: 'text', obligatorio: true },
        { id: 'despachos_mes', etiqueta: 'Número aproximado de despachos al mes', tipo: 'text', obligatorio: true },
        { id: 'vehiculos', etiqueta: '¿Los vehículos son propios o contratados?', tipo: 'select',
          opciones: ['Propios', 'Contratados', 'Mixto'], obligatorio: true }
      ]
    },
    cumplimiento: {
      titulo: 'Datos para cotizar la póliza de cumplimiento',
      campos: [
        { id: 'contratista', etiqueta: 'Nombre o razón social y NIT del contratista', tipo: 'text', obligatorio: true },
        { id: 'entidad', etiqueta: 'Entidad contratante', tipo: 'text', obligatorio: true },
        { id: 'objeto', etiqueta: 'Objeto del contrato', tipo: 'textarea', obligatorio: true },
        { id: 'valor_contrato', etiqueta: 'Valor del contrato', tipo: 'text', obligatorio: true },
        { id: 'plazo', etiqueta: 'Plazo de ejecución', tipo: 'text', obligatorio: true },
        { id: 'amparos', etiqueta: '¿Qué amparos exige el pliego?',
          ayuda: 'Cumplimiento, anticipo, salarios, estabilidad… con sus porcentajes si los tienes',
          tipo: 'textarea', obligatorio: true },
        { id: 'anticipo', etiqueta: '¿El contrato tiene anticipo?', tipo: 'select',
          opciones: ['No', 'Sí'], obligatorio: true },
        { id: 'consorcio', etiqueta: '¿Se presenta en consorcio o unión temporal?', tipo: 'select',
          opciones: ['No', 'Sí'], obligatorio: true }
      ]
    },
    obra: {
      titulo: 'Datos para cotizar todo riesgo contratista',
      campos: [
        { id: 'contratista', etiqueta: 'Nombre o razón social y NIT del contratista', tipo: 'text', obligatorio: true },
        { id: 'tipo_obra', etiqueta: 'Tipo de obra',
          ayuda: 'Edificación, vía, red, estructura…', tipo: 'text', obligatorio: true },
        { id: 'ubicacion', etiqueta: 'Ubicación exacta de la obra',
          ayuda: 'Determina la exposición sísmica y de inundación', tipo: 'text', obligatorio: true },
        { id: 'valor_obra', etiqueta: 'Valor total de la obra terminada',
          ayuda: 'Incluye materiales, mano de obra y costos indirectos', tipo: 'text', obligatorio: true },
        { id: 'plazo', etiqueta: 'Plazo de ejecución y fecha de inicio', tipo: 'text', obligatorio: true },
        { id: 'maquinaria', etiqueta: '¿Se amparan maquinaria y equipos?', tipo: 'select',
          opciones: ['No', 'Sí'], obligatorio: true }
      ]
    },
    personas: {
      titulo: 'Datos para cotizar el seguro de personas',
      campos: [
        { id: 'tomador', etiqueta: 'Nombre o razón social del tomador', tipo: 'text', obligatorio: true },
        { id: 'num_asegurados', etiqueta: '¿Cuántas personas se van a asegurar?', tipo: 'text', obligatorio: true },
        { id: 'edades', etiqueta: 'Rango de edades',
          ayuda: 'Por ejemplo: entre 25 y 60 años', tipo: 'text', obligatorio: true },
        { id: 'actividad', etiqueta: 'Actividad u ocupación del grupo',
          ayuda: 'Influye en el riesgo y en la tarifa', tipo: 'text', obligatorio: true },
        { id: 'valor_asegurado', etiqueta: 'Valor asegurado que buscas por persona', tipo: 'text' }
      ]
    },
    empresarial: {
      titulo: 'Datos para cotizar el seguro',
      campos: [
        { id: 'empresa', etiqueta: 'Nombre o razón social y NIT', tipo: 'text', obligatorio: true },
        { id: 'actividad', etiqueta: 'Actividad económica de la empresa', tipo: 'text', obligatorio: true },
        { id: 'ubicacion', etiqueta: 'Dirección donde está el riesgo', tipo: 'textarea', obligatorio: true },
        { id: 'valor_asegurar', etiqueta: 'Valor que se busca asegurar', tipo: 'text', obligatorio: true },
        { id: 'detalle', etiqueta: 'Detalle de lo que se quiere cubrir',
          ayuda: 'Bienes, empleados con manejo de fondos, equipos…', tipo: 'textarea' }
      ]
    }
  };

  // Qué producto del portafolio usa cada cuestionario.
  const CUESTIONARIO_POR_TIPO = {
    // Automóviles
    'Livianos': 'autos',
    'RC para Vehículos de Carga': 'autos',
    // Carga: preguntas propias — lo que importa es la mercancía y la ruta,
    // no la placa de un vehículo concreto.
    'Transporte de Carga por Carretera': 'carga',
    'Transportes': 'carga',
    // Inmuebles
    'Incendio': 'inmueble',
    'Sustracción': 'inmueble',
    // Contratación estatal y privada
    'Cumplimiento Estatal y Particular': 'cumplimiento',
    'Disposiciones Legales': 'cumplimiento',
    'RC derivada de Cumplimiento': 'cumplimiento',
    'Todo Riesgo Contratista': 'obra',
    'Todo Riesgo Maquinaria': 'obra',
    // Personas
    'Vida Grupo': 'personas',
    'Salud': 'personas',
    'Accidentes Personales': 'personas',
    'Póliza Integral Estudiantil': 'personas',
    'Vida Fácil': 'personas',
    'Vida Deudores': 'personas',
    // Resto de empresariales
    'Manejo': 'empresarial',
    'Infidelidad y Riesgos Financieros (IRF)': 'empresarial',
    'Responsabilidad Civil Extracontractual': 'empresarial'
  };

  function construirPaso2(clave, radicado, tipo) {
    const q = CUESTIONARIOS[clave];
    if (!q) return null;

    const caja = document.createElement('div');
    caja.className = 'paso2';
    caja.innerHTML = '<h3>' + q.titulo + '</h3>'
      + '<p class="paso2-intro">Tu solicitud ya quedó registrada con el radicado <strong>'
      + radicado + '</strong>. Estos datos nos permiten cotizar sin llamarte para pedírtelos.</p>';

    const form = document.createElement('form');
    form.className = 'paso2-form';

    q.campos.forEach(c => {
      const g = document.createElement('div');
      g.className = 'form-group';
      if (c.dependeDe) { g.dataset.dependeDe = c.dependeDe.campo; g.dataset.dependeValor = c.dependeDe.valor; g.style.display = 'none'; }

      let control;
      if (c.tipo === 'select') {
        control = document.createElement('select');
        control.innerHTML = c.opciones.map(o => '<option value="' + o + '">' + o + '</option>').join('');
      } else if (c.tipo === 'textarea') {
        control = document.createElement('textarea');
        control.rows = 3;
      } else {
        control = document.createElement('input');
        control.type = c.tipo === 'date' ? 'date' : 'text';
      }
      control.id = 'p2_' + c.id;
      control.name = c.id;
      if (c.obligatorio) control.required = true;

      g.innerHTML = '<label for="p2_' + c.id + '">' + c.etiqueta + (c.obligatorio ? ' *' : '') + '</label>'
        + (c.ayuda ? '<span class="campo-ayuda">' + c.ayuda + '</span>' : '');
      g.appendChild(control);
      form.appendChild(g);
    });

    const acciones = document.createElement('div');
    acciones.className = 'paso2-acciones';
    acciones.innerHTML = '<button type="submit" class="btn btn-primary">'
      + '<i class="fas fa-paper-plane"></i> Enviar datos</button>'
      + '<button type="button" class="btn btn-outline" data-omitir>Prefiero que me llamen</button>';
    form.appendChild(acciones);
    caja.appendChild(form);

    // Campos que solo aplican según otra respuesta
    form.addEventListener('change', () => {
      form.querySelectorAll('[data-depende-de]').forEach(g => {
        const origen = form.querySelector('[name="' + g.dataset.dependeDe + '"]');
        const visible = origen && origen.value === g.dataset.dependeValor;
        g.style.display = visible ? '' : 'none';
        const ctrl = g.querySelector('input,select,textarea');
        if (ctrl) ctrl.required = !!visible;
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const respuestas = {};
      q.campos.forEach(c => {
        const el = form.querySelector('[name="' + c.id + '"]');
        if (el && el.closest('.form-group').style.display !== 'none' && el.value.trim()) {
          respuestas[c.id] = el.value.trim();
        }
      });
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando…';
      try {
        const r = await fetch('api/cotizacion.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion: 'detalle', radicado: radicado, tipo_seguro: tipo, respuestas: respuestas })
        });
        const res = await r.json().catch(() => ({}));
        caja.innerHTML = (r.ok && res.ok)
          ? '<h3>Listo, ya tenemos todo</h3><p class="paso2-intro">Recibimos los datos de tu '
            + 'solicitud <strong>' + radicado + '</strong>. Un asesor te contactará con la cotización.</p>'
          : '<h3>No pudimos guardar los datos</h3><p class="paso2-intro">Tu solicitud '
            + '<strong>' + radicado + '</strong> sí quedó registrada. Un asesor te contactará igualmente.</p>';
      } catch (err) {
        caja.innerHTML = '<h3>No pudimos guardar los datos</h3><p class="paso2-intro">Tu solicitud '
          + '<strong>' + radicado + '</strong> sí quedó registrada. Un asesor te contactará igualmente.</p>';
      }
    });

    acciones.querySelector('[data-omitir]').addEventListener('click', () => {
      caja.innerHTML = '<h3>Solicitud registrada</h3><p class="paso2-intro">Guardamos tu solicitud '
        + '<strong>' + radicado + '</strong>. Un asesor se comunicará contigo para tomar los datos.</p>';
    });

    return caja;
  }

  /* ---------- Contact Form ----------
     El envío va al servidor (api/cotizacion.php), que deja constancia de la
     autorización de tratamiento de datos con fecha, hora y el texto exacto que
     se le mostró al titular. Antes esto salía por WhatsApp: el usuario podía
     editar el mensaje, o no enviarlo, y no quedaba prueba de nada. La Ley 1581
     de 2012 (art. 17 lit. b) exige conservar esa prueba al responsable. */
  /* ---------- Procedencia de la visita ----------
     Se guarda la primera página a la que llegó la persona en esta sesión, el
     dominio que la trajo y los parámetros de campaña (utm_*), para saber qué
     canal produce solicitudes. No se guarda la URL completa del sitio de origen
     ni identificadores de clic: solo el dominio y si venía de un anuncio. */
  const PROCEDENCIA = 'asi_procedencia';
  const procedencia = (() => {
    try {
      const guardada = sessionStorage.getItem(PROCEDENCIA);
      if (guardada) return JSON.parse(guardada);
    } catch (err) { /* modo privado */ }
    const q = new URLSearchParams(location.search);
    let referente = '';
    try {
      const h = document.referrer ? new URL(document.referrer).hostname : '';
      if (h && h.replace(/^www\./, '') !== location.hostname.replace(/^www\./, '')) referente = h;
    } catch (err) { /* referente ilegible */ }
    const p = {
      fuente: (q.get('utm_source') || '').slice(0, 80),
      medio: (q.get('utm_medium') || '').slice(0, 80),
      campana: (q.get('utm_campaign') || '').slice(0, 120),
      anuncio: (q.has('gclid') || q.has('gbraid') || q.has('wbraid') || q.has('fbclid')) ? '1' : '',
      llegada: location.pathname.slice(0, 200),
      referente: referente.slice(0, 120)
    };
    try { sessionStorage.setItem(PROCEDENCIA, JSON.stringify(p)); } catch (err) { /* modo privado */ }
    return p;
  })();

  const contactForm = document.querySelector('#contactForm');
  if (contactForm) {
    const aviso = document.querySelector('#formAviso');

    // Las guías enlazan con ?seguro=<producto> para llegar con el producto ya elegido.
    try {
      const pedido = new URLSearchParams(location.search).get('seguro');
      const sel = contactForm.querySelector('#tipo_seguro');
      if (pedido && sel && [...sel.options].some(o => o.value === pedido)) sel.value = pedido;
    } catch (err) { /* sin preselección */ }

    const mostrarAviso = (tipo, titulo, texto) => {
      if (!aviso) return;
      aviso.className = 'form-aviso ' + tipo;
      aviso.innerHTML = `<strong>${titulo}</strong>${texto}`;
      aviso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validación en el navegador: mejora la experiencia, no acredita nada.
      // La validación que cuenta es la del servidor.
      let isValid = true;
      contactForm.querySelectorAll('[required]').forEach(field => {
        if (field.type === 'checkbox') {
          const wrapper = field.closest('.form-consent');
          if (!field.checked) {
            if (wrapper) wrapper.classList.add('consent-error');
            isValid = false;
          } else if (wrapper) {
            wrapper.classList.remove('consent-error');
          }
        } else if (!field.value.trim()) {
          field.style.borderColor = '#ef4444';
          isValid = false;
        } else {
          field.style.borderColor = '';
        }
      });
      if (!isValid) {
        mostrarAviso('error', 'Faltan datos',
          'Revisa los campos marcados y confirma la autorización de tratamiento de datos.');
        return;
      }

      const datos = Object.fromEntries(new FormData(contactForm));
      // Se envía el texto íntegro de la autorización tal como se mostró, junto
      // con su versión: es lo que se conserva como prueba.
      const textoEl = document.querySelector('#autorizacionTexto');
      datos.autorizacion_texto = textoEl ? textoEl.innerText.replace(/\s+/g, ' ').trim() : '';
      datos.autorizacion_version = contactForm.getAttribute('data-consent-version') || '';
      datos.autorizacion_datos = contactForm.querySelector('#autorizacion_datos').checked ? '1' : '';
      datos.procedencia = procedencia;

      const btn = contactForm.querySelector('button[type="submit"]');
      const textoBtn = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando…';

      try {
        const r = await fetch(contactForm.getAttribute('action'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos)
        });
        const res = await r.json().catch(() => ({}));

        if (r.ok && res.ok) {
          const wa = contactForm.getAttribute('data-whatsapp') || '573173712260';
          const msg = encodeURIComponent(
            `Hola, acabo de enviar una solicitud de cotización por la página web.\n` +
            `Radicado: ${res.radicado}\n` +
            `Nombre: ${datos.nombre}\n` +
            `Interés: ${datos.tipo_seguro}`
          );

          // Si el producto necesita datos técnicos, se pide el paso 2 en lugar
          // del mensaje de cierre. El registro ya está hecho: lo que siga es
          // opcional y no condiciona la autorización.
          const clave = CUESTIONARIO_POR_TIPO[datos.tipo_seguro];
          const paso2 = clave ? construirPaso2(clave, res.radicado, datos.tipo_seguro) : null;

          if (paso2) {
            if (aviso) aviso.className = 'form-aviso';
            contactForm.style.display = 'none';
            contactForm.parentElement.appendChild(paso2);
            paso2.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            mostrarAviso('ok', 'Solicitud recibida',
              `Guardamos tu solicitud con el radicado <strong>${res.radicado}</strong> y un asesor ` +
              `se comunicará contigo. Si quieres adelantar la conversación, ` +
              `<a href="https://wa.me/${wa}?text=${msg}" target="_blank" rel="noopener">escríbenos por WhatsApp</a>.`);
          }
          contactForm.reset();
        } else {
          mostrarAviso('error', 'No pudimos enviar tu solicitud',
            (res.error || 'Inténtalo de nuevo en unos minutos.') +
            ' También puedes escribirnos a <a href="mailto:comercial1@asiseguros.com">comercial1@asiseguros.com</a>.');
        }
      } catch (err) {
        mostrarAviso('error', 'No pudimos enviar tu solicitud',
          'Revisa tu conexión e inténtalo de nuevo, o escríbenos a ' +
          '<a href="mailto:comercial1@asiseguros.com">comercial1@asiseguros.com</a>.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = textoBtn;
      }
    });
  }

  /* ---------- Aviso de privacidad previo a WhatsApp ----------
     WhatsApp es un canal de recolección de datos personales, así que hay que
     informar antes de abrirlo. Todos los enlaces a wa.me pasan por este aviso. */
  const waModal = document.querySelector('#waModal');
  if (waModal) {
    const waContinuar = waModal.querySelector('#waContinuar');
    const YA_AVISADO = 'asi_wa_avisado';

    const cerrar = () => waModal.classList.remove('abierto');

    document.querySelectorAll('a[href*="wa.me"]').forEach(enlace => {
      if (enlace.closest('#waModal') || enlace.closest('.form-aviso')) return;
      enlace.addEventListener('click', (e) => {
        // Una sola vez por sesión: informar en cada clic sería hostil.
        if (sessionStorage.getItem(YA_AVISADO)) return;
        e.preventDefault();
        waContinuar.href = enlace.href;
        waModal.classList.add('abierto');
      });
    });

    waContinuar.addEventListener('click', () => {
      try { sessionStorage.setItem(YA_AVISADO, '1'); } catch (err) { /* modo privado */ }
      cerrar();
    });

    waModal.querySelectorAll('[data-wa-cancelar]').forEach(b => b.addEventListener('click', cerrar));
    waModal.addEventListener('click', (e) => { if (e.target === waModal) cerrar(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && waModal.classList.contains('abierto')) cerrar();
    });
  }

  /* ---------- Form Field Focus Effects ---------- */
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(field => {
    field.addEventListener('focus', () => {
      field.parentElement.classList.add('focused');
    });
    field.addEventListener('blur', () => {
      field.parentElement.classList.remove('focused');
    });
  });

});

/* ========================================
   CART
   ======================================== */
function initCart() {
  let cart = loadCart();

  const cartBtn     = document.getElementById('cartBtn');
  const cartClose   = document.getElementById('cartClose');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer  = document.getElementById('cartDrawer');
  const cartBadge   = document.getElementById('cartBadge');
  const cartItems   = document.getElementById('cartItems');
  const cartEmpty   = document.getElementById('cartEmpty');
  const cartFooter  = document.getElementById('cartFooter');
  const cartTotal   = document.getElementById('cartTotal');
  const cartCheckout = document.getElementById('cartCheckout');
  const cartClear   = document.getElementById('cartClear');

  function openCart() {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (cartBtn)     cartBtn.addEventListener('click', openCart);
  if (cartClose)   cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Add-to-cart buttons
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = btn.dataset.id;
      const name   = btn.dataset.name;
      const price  = parseInt(btn.dataset.price);
      const period = btn.dataset.period || '';

      const existing = cart.find(i => i.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, name, price, period, qty: 1 });
      }

      saveCart(cart);
      renderCart();

      // Visual feedback on button
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Agregado';
      btn.classList.add('added');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('added');
      }, 1600);

      openCart();
    });
  });

  if (cartClear) {
    cartClear.addEventListener('click', () => {
      cart = [];
      saveCart(cart);
      renderCart();
    });
  }

  if (cartCheckout) {
    cartCheckout.addEventListener('click', () => {
      if (!cart.length) return;
      const lines = cart.map(i =>
        `• ${i.name} x${i.qty} = ${fmt(i.price * i.qty)}`
      ).join('\n');
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const msg = encodeURIComponent(
        `Hola, quiero adquirir los siguientes planes ASI:\n\n${lines}\n\n*Total: ${fmt(total)}*`
      );
      window.open(`https://wa.me/573173712260?text=${msg}`, '_blank');
    });
  }

  function renderCart() {
    updateBadge();
    if (!cartItems) return;

    if (!cart.length) {
      if (cartEmpty)  cartEmpty.style.display = 'flex';
      if (cartFooter) cartFooter.style.display = 'none';
      // clear item rows
      cartItems.querySelectorAll('.cart-item').forEach(el => el.remove());
      return;
    }

    if (cartEmpty)  cartEmpty.style.display = 'none';
    if (cartFooter) cartFooter.style.display = 'block';

    // Rebuild item list
    cartItems.querySelectorAll('.cart-item').forEach(el => el.remove());
    cart.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.dataset.id = item.id;
      el.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHTML(item.name)}</div>
          <div class="cart-item-price">${fmt(item.price)}${item.period}</div>
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" data-action="dec">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" data-action="inc">+</button>
        </div>
        <button class="cart-item-remove" title="Eliminar"><i class="fas fa-trash-can"></i></button>
      `;

      el.querySelector('[data-action="inc"]').addEventListener('click', () => {
        item.qty += 1;
        saveCart(cart);
        renderCart();
      });

      el.querySelector('[data-action="dec"]').addEventListener('click', () => {
        item.qty -= 1;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== item.id);
        saveCart(cart);
        renderCart();
      });

      el.querySelector('.cart-item-remove').addEventListener('click', () => {
        cart = cart.filter(i => i.id !== item.id);
        saveCart(cart);
        renderCart();
      });

      cartItems.appendChild(el);
    });

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    if (cartTotal) cartTotal.textContent = fmt(total);
  }

  function updateBadge() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    if (!cartBadge) return;
    cartBadge.textContent = count;
    cartBadge.style.display = count > 0 ? 'flex' : 'none';
  }

  function loadCart() {
    try { return JSON.parse(localStorage.getItem('asi_cart') || '[]'); } catch { return []; }
  }

  function saveCart(c) {
    localStorage.setItem('asi_cart', JSON.stringify(c));
  }

  function fmt(n) {
    return '$' + n.toLocaleString('es-CO');
  }

  // Init render
  renderCart();
}

/* ========================================
   APPLY ADMIN CONFIG TO FRONTEND
   ======================================== */
function applyAdminConfig() {
  const saved = localStorage.getItem('asiseguros_admin_v2');
  if (!saved) return;

  let cfg;
  try { cfg = JSON.parse(saved); } catch { return; }

  // -- Toggle Modules (show/hide sections) --
  if (cfg.modules) {
    const sectionMap = {
      topbar: '.top-bar',
      hero: '.hero',
      marquee: '.marquee-section',
      about: '.about-section',
      services: '.services-section',
      why: '.why-section',
      stats: '.stats-section',
      productHighlight: '.product-highlight',
      testimonials: '.testimonials-section',
      cta: '.cta-section',
      contact: '.contact-section',
      whatsappFloat: '.whatsapp-float'
    };

    Object.entries(cfg.modules).forEach(([key, mod]) => {
      const selector = sectionMap[key];
      if (selector) {
        const el = document.querySelector(selector);
        if (el) el.style.display = mod.enabled ? '' : 'none';
      }
    });
  }

  // -- Site Info --
  if (cfg.site) {
    // Top bar phone
    const topPhone = document.querySelector('.top-bar-left a[href^="tel:"]');
    if (topPhone && cfg.site.phone) {
      topPhone.href = 'tel:' + cfg.site.phone.replace(/\s/g, '');
      topPhone.innerHTML = `<i class="fas fa-phone-alt"></i> ${cfg.site.phone}`;
    }

    // Top bar email
    const topEmail = document.querySelector('.top-bar-left a[href^="mailto:"]');
    if (topEmail && cfg.site.email) {
      topEmail.href = 'mailto:' + cfg.site.email;
      topEmail.innerHTML = `<i class="fas fa-envelope"></i> ${cfg.site.email}`;
    }

    // WhatsApp float
    const waFloat = document.querySelector('.whatsapp-float');
    if (waFloat && cfg.site.whatsapp) {
      waFloat.href = `https://wa.me/${cfg.site.whatsapp}?text=${encodeURIComponent('Hola, quiero información sobre seguros')}`;
    }

    // Footer contact items
    const footerWa = document.querySelector('.footer-contact-item a[href*="wa.me"]');
    if (footerWa && cfg.site.whatsapp) {
      footerWa.href = `https://wa.me/${cfg.site.whatsapp}`;
      footerWa.textContent = cfg.site.phone;
    }

    const footerEmail = document.querySelector('.footer-contact-item a[href^="mailto:"]');
    if (footerEmail && cfg.site.email) {
      footerEmail.href = 'mailto:' + cfg.site.email;
      footerEmail.textContent = cfg.site.email;
    }

    // Social links
    const socialMap = {
      facebook: 'fa-facebook-f',
      instagram: 'fa-instagram',
      linkedin: 'fa-linkedin-in',
      tiktok: 'fa-tiktok',
      youtube: 'fa-youtube'
    };

    Object.entries(socialMap).forEach(([key, iconClass]) => {
      if (cfg.site[key]) {
        document.querySelectorAll(`a[aria-label="${key.charAt(0).toUpperCase() + key.slice(1)}"]`).forEach(a => {
          a.href = cfg.site[key];
        });
      }
    });
  }

  // -- Hero --
  if (cfg.hero) {
    setText('.hero-badge', cfg.hero.badge, true);
    setHTML('.hero h1', cfg.hero.title);
    setText('.hero-text', cfg.hero.subtitle);
    setText('.hero-buttons .btn-primary', cfg.hero.ctaPrimary, true);
    setText('.hero-buttons .btn-secondary', cfg.hero.ctaSecondary, true);

    const stats = document.querySelectorAll('.hero-stat');
    if (stats[0]) {
      stats[0].querySelector('.hero-stat-number').textContent = cfg.hero.stat1Number;
      stats[0].querySelector('.hero-stat-label').textContent = cfg.hero.stat1Label;
    }
    if (stats[1]) {
      stats[1].querySelector('.hero-stat-number').textContent = cfg.hero.stat2Number;
      stats[1].querySelector('.hero-stat-label').textContent = cfg.hero.stat2Label;
    }
    if (stats[2]) {
      stats[2].querySelector('.hero-stat-number').textContent = cfg.hero.stat3Number;
      stats[2].querySelector('.hero-stat-label').textContent = cfg.hero.stat3Label;
    }
  }

  // -- About --
  if (cfg.about) {
    setText('.about-content .section-subtitle', cfg.about.subtitle);
    setText('.about-content .section-title', cfg.about.title);
    const paragraphs = document.querySelectorAll('.about-content > p');
    if (paragraphs[0]) paragraphs[0].innerHTML = cfg.about.paragraph1;
    if (paragraphs[1]) paragraphs[1].innerHTML = cfg.about.paragraph2;

    const badge = document.querySelector('.about-experience-badge');
    if (badge) {
      const num = badge.querySelector('.number');
      const txt = badge.querySelector('.text');
      if (num) num.textContent = cfg.about.experienceNumber;
      if (txt) txt.textContent = cfg.about.experienceText;
    }
  }

  // -- Stats Counters --
  if (cfg.stats) {
    const statItems = document.querySelectorAll('.stats-section .stat-item');
    const statsArr = [cfg.stats.stat1, cfg.stats.stat2, cfg.stats.stat3, cfg.stats.stat4];
    statsArr.forEach((s, i) => {
      if (statItems[i] && s) {
        const numEl = statItems[i].querySelector('.stat-number');
        const labelEl = statItems[i].querySelector('.stat-label');
        if (numEl) {
          numEl.setAttribute('data-target', s.number);
          numEl.setAttribute('data-suffix', s.suffix);
          // Valor final por defecto: si el visitante nunca llega a la franja, no queda en 0
          numEl.textContent = Number(s.number).toLocaleString('es-CO') + (s.suffix || '');
        }
        if (labelEl) labelEl.textContent = s.label;
      }
    });
  }

  // -- Why Choose Us --
  if (cfg.why) {
    const whySection = document.querySelector('.why-section');
    if (whySection) {
      setText('.why-section .section-subtitle', cfg.why.subtitle);
      setText('.why-section .section-title', cfg.why.title);
      setText('.why-section .section-description', cfg.why.description);

      const cards = whySection.querySelectorAll('.why-card');
      cfg.why.cards.forEach((card, i) => {
        if (cards[i]) {
          const icon = cards[i].querySelector('.why-icon i');
          if (icon) icon.className = card.icon;
          const h3 = cards[i].querySelector('h3');
          if (h3) h3.textContent = card.title;
          const p = cards[i].querySelector('p');
          if (p) p.textContent = card.text;
        }
      });
    }
  }

  // -- CTA --
  if (cfg.ctaSection) {
    setText('.cta-content h2', cfg.ctaSection.title);
    setText('.cta-content > p', cfg.ctaSection.description);
    setText('.cta-buttons .btn-primary', cfg.ctaSection.btnPrimary, true);
    setText('.cta-buttons .btn-secondary', cfg.ctaSection.btnSecondary, true);
  }

  // -- Insurance Types (services cards + form select) --
  if (cfg.insuranceTypes) {
    const serviceCards = document.querySelectorAll('.service-card');
    const catKeys = ['personas', 'automoviles', 'generales', 'empresariales'];

    catKeys.forEach((key, i) => {
      const cat = cfg.insuranceTypes[key];
      if (!cat) return;

      // Toggle service card visibility
      if (serviceCards[i]) {
        serviceCards[i].style.display = cat.enabled ? '' : 'none';
        const p = serviceCards[i].querySelector('p');
        if (p) p.textContent = cat.description;
      }
    });

    // Update the contact form select options
    const select = document.getElementById('tipo_seguro');
    if (select) {
      // Keep the first placeholder option
      const placeholder = select.querySelector('option[disabled]');
      const otroOption = '<option value="Asistencias">Asistencias</option><option value="Otro">Otro</option>';
      let optionsHTML = placeholder ? placeholder.outerHTML : '';

      Object.entries(cfg.insuranceTypes).forEach(([catKey, cat]) => {
        if (!cat.enabled) return;
        const enabledSubs = Object.entries(cat.subtypes).filter(([, s]) => s.enabled);
        if (enabledSubs.length === 0) return;

        optionsHTML += `<optgroup label="${cat.label}">`;
        enabledSubs.forEach(([, sub]) => {
          optionsHTML += `<option value="${sub.label}">${sub.label}</option>`;
        });
        optionsHTML += '</optgroup>';
      });

      optionsHTML += otroOption;
      select.innerHTML = optionsHTML;
    }
  }

  // -- Testimonials --
  if (cfg.testimonials && cfg.testimonials.length > 0) {
    const grid = document.querySelector('.testimonials-grid');
    if (grid) {
      grid.innerHTML = cfg.testimonials.map(t => `
        <div class="testimonial-card reveal">
          <i class="fas fa-quote-right testimonial-quote-icon"></i>
          <div class="testimonial-stars">
            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
          </div>
          <p class="testimonial-text">"${escapeHTML(t.text)}"</p>
          <div class="testimonial-author">
            <div class="testimonial-avatar">${escapeHTML(t.initials)}</div>
            <div class="testimonial-info">
              <strong>${escapeHTML(t.name)}</strong>
              <span>${escapeHTML(t.role)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // -- WhatsApp in contact form --
  if (cfg.site && cfg.site.whatsapp) {
    const contactForm = document.querySelector('#contactForm');
    if (contactForm) {
      contactForm.setAttribute('data-whatsapp', cfg.site.whatsapp);
    }
  }
}

/* ---------- Helpers ---------- */
function setText(selector, text, preserveIcon) {
  const el = document.querySelector(selector);
  if (!el || !text) return;
  if (preserveIcon) {
    const icon = el.querySelector('i');
    const iconHTML = icon ? icon.outerHTML + ' ' : '';
    el.innerHTML = iconHTML + text;
  } else {
    el.textContent = text;
  }
}

function setHTML(selector, html) {
  const el = document.querySelector(selector);
  if (el && html) el.innerHTML = html;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

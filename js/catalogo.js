/* Catálogo de seguros (seguros.html): buscador y filtros.

   Todo el contenido ya está en el HTML; aquí solo se muestra u oculta. Los
   filtros quedan en la URL (?para=empresas&q=licitacion…) para que un enlace
   lleve a una vista ya filtrada, por ejemplo desde la portada. */
(function () {
  'use strict';

  const cuerpo = document.querySelector('.cat-cuerpo');
  if (!cuerpo) return;

  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Texto donde se busca: solo letras y números separados por un espacio, con
  // espacios en los extremos, para comparar contra el inicio de cada palabra
  // («moto» encuentra «motocicleta» pero no «terremoto»).
  const indexable = (s) => ' ' + norm(s).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';

  // Cómo busca la gente frente a cómo están escritas las pólizas.
  const SINONIMOS = {
    licitacion: ['licitac', 'pliego', 'seriedad', 'contratista'],
    contrato: ['contrat'],
    carro: ['carro', 'automovil', 'camioneta', 'campero'],
    auto: ['automovil', 'carro', 'vehiculo'],
    vehiculo: ['vehiculo', 'carro', 'automovil', 'moto', 'camion'],
    casa: ['casa', 'hogar', 'vivienda', 'apartamento', 'inmueble'],
    apartamento: ['apartamento', 'hogar', 'vivienda', 'inmueble'],
    camion: ['camion', 'tractocamion', 'volqueta', 'carga'],
    robo: ['robo', 'hurto', 'sustraccion'],
    empleado: ['emplead', 'trabajador', 'colaborador', 'servidor'],
    trabajador: ['trabajador', 'emplead', 'colaborador'],
    negocio: ['negocio', 'empresa', 'pyme', 'comercio', 'local'],
    obra: ['obra', 'construc'],
    medico: ['medic', 'salud', 'clinica', 'odontolog'],
    colegio: ['colegio', 'estudiant', 'educativ'],
    precio: ['precio', 'cuesta', 'valor', 'prima', 'tarifa'],
    cuesta: ['cuesta', 'precio', 'valor', 'prima'],
    reclamar: ['reclam', 'siniestro', 'aviso', 'indemniz'],
    choque: ['choque', 'colision', 'transito']
  };
  // Cada palabra buscada se convierte en la lista de raíces que la satisfacen.
  const raices = (palabra) => {
    let w = palabra;
    if (w.length > 4 && w.endsWith('es')) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
    return [w].concat(SINONIMOS[w] || SINONIMOS[palabra] || []);
  };
  // Palabras que no aportan a la búsqueda («seguro para mi carro» → «carro»).
  const VACIAS = new Set(['de', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'por', 'con', 'mi', 'mis',
    'que', 'en', 'del', 'al', 'se', 'su', 'sus', 'es', 'como', 'cual', 'quiero', 'necesito',
    'seguro', 'seguros', 'poliza', 'polizas']);

  const faqs = Array.from(document.querySelectorAll('.cat-faq')).map((el) => ({
    el, tema: el.dataset.tema, texto: indexable(el.textContent)
  }));
  const polizas = Array.from(document.querySelectorAll('.cat-poliza')).map((el) => {
    const propias = faqs.filter((f) => el.contains(f.el));
    return {
      el, d: el.dataset, faqs: propias,
      detalle: el.querySelector('.cat-detalle'),
      abrir: el.querySelector('.cat-abrir'),
      texto: indexable(el.dataset.texto)
    };
  });
  const ramas = Array.from(document.querySelectorAll('.cat-rama:not(.cat-general)'));
  const generales = Array.from(document.querySelectorAll('.cat-general')).map((el) => ({
    el, faqs: faqs.filter((f) => el.contains(f.el))
  }));

  const busca = document.getElementById('catBusca');
  const selRama = document.getElementById('catRama');
  const destacadas = document.getElementById('catDestacadas');
  const conteo = document.getElementById('catConteo');
  const vacio = document.getElementById('catVacio');
  const activos = document.getElementById('catActivos');
  const filtros = document.getElementById('catFiltros');
  const verBtn = document.getElementById('catVer');
  const total = polizas.length;

  const GRUPOS = ['para', 'familia', 'tema', 'aseguradora'];
  const estado = { q: '', para: '', familia: '', rama: '', tema: '', aseguradora: '', destacadas: false };

  /* ---------- Pintar el estado en los controles ---------- */
  function pintarControles() {
    document.querySelectorAll('.cat-chip').forEach((b) => {
      b.setAttribute('aria-pressed', String(estado[b.dataset.filtro] === b.dataset.valor));
    });
    selRama.value = estado.rama;
    Array.from(selRama.options).forEach((o) => {
      o.hidden = !!(o.value && estado.familia && o.dataset.familia !== estado.familia);
    });
    destacadas.checked = estado.destacadas;
    if (busca.value !== estado.q) busca.value = estado.q;
    const n = GRUPOS.filter((g) => estado[g]).length + (estado.rama ? 1 : 0) + (estado.destacadas ? 1 : 0);
    activos.textContent = n ? String(n) : '';
  }

  /* ---------- Aplicar filtros ---------- */
  function aplicar() {
    const palabras = norm(estado.q).replace(/[^a-z0-9]+/g, ' ').split(' ')
      .filter((w) => w.length > 1 && !VACIAS.has(w)).map(raices);
    const contiene = (t) => palabras.every((opciones) => opciones.some((r) => t.includes(' ' + r)));
    let visibles = 0;
    let preguntas = 0;

    polizas.forEach((p) => {
      let ok = (!estado.para || p.d.para.split(' ').includes(estado.para)) &&
               (!estado.familia || p.d.familia === estado.familia) &&
               (!estado.rama || p.d.rama === estado.rama) &&
               (!estado.aseguradora || p.d.aseguradora === estado.aseguradora) &&
               (!estado.destacadas || p.d.destacada === 'si');

      const delTema = p.faqs.filter((f) => !estado.tema || f.tema === estado.tema);
      if (estado.tema && !delTema.length) ok = false;

      let coinciden = [];
      if (ok && palabras.length) {
        coinciden = delTema.filter((f) => contiene(f.texto));
        ok = contiene(p.texto + ' ' + delTema.map((f) => f.texto).join(' '));
      }

      p.el.hidden = !ok;
      p.faqs.forEach((f) => {
        f.el.hidden = !delTema.includes(f);
        f.el.classList.toggle('cat-coincide', coinciden.includes(f));
      });
      if (p.abrir) {
        const sobre = estado.tema ? ' sobre «' + temaNombre(estado.tema).toLowerCase() + '»' : '';
        p.abrir.textContent = 'Ver coberturas y ' + delTema.length +
          (delTema.length === 1 ? ' pregunta' : ' preguntas') + sobre;
      }
      // Si la búsqueda encontró preguntas, se abre la ficha para que se vean;
      // al cambiar la búsqueda se cierran solo las que se abrieron así.
      if (coinciden.length && !p.detalle.open) { p.detalle.open = true; p.autoAbierta = true; }
      else if (!coinciden.length && p.autoAbierta) { p.detalle.open = false; p.autoAbierta = false; }

      if (ok) { visibles++; preguntas += coinciden.length; }
    });

    ramas.forEach((r) => {
      r.hidden = !r.querySelector('.cat-poliza:not([hidden])');
    });

    let generalesVisibles = 0;
    generales.forEach((g) => {
      let n = 0;
      g.faqs.forEach((f) => {
        const ok = (!estado.tema || f.tema === estado.tema) && (!palabras.length || contiene(f.texto));
        f.el.hidden = !ok;
        f.el.classList.toggle('cat-coincide', ok && palabras.length > 0);
        if (ok) n++;
      });
      g.el.hidden = n === 0;
      generalesVisibles += n;
    });

    vacio.hidden = visibles > 0 || generalesVisibles > 0;
    let texto = visibles === total ? total + ' pólizas' : visibles + ' de ' + total + ' pólizas';
    if (palabras.length && preguntas) texto += ' · ' + preguntas + (preguntas === 1 ? ' pregunta coincide' : ' preguntas coinciden');
    conteo.textContent = texto;
    verBtn.textContent = visibles ? 'Ver ' + visibles + (visibles === 1 ? ' póliza' : ' pólizas') : 'Ver resultados';

    pintarControles();
    guardarEnUrl();
  }

  function temaNombre(clave) {
    const b = document.querySelector('.cat-chip[data-filtro="tema"][data-valor="' + clave + '"]');
    return b ? b.textContent : clave;
  }

  /* ---------- URL ---------- */
  function guardarEnUrl() {
    const q = new URLSearchParams();
    if (estado.q) q.set('q', estado.q);
    GRUPOS.concat('rama').forEach((g) => { if (estado[g]) q.set(g, estado[g]); });
    if (estado.destacadas) q.set('destacadas', '1');
    const s = q.toString();
    try {
      history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
    } catch (err) { /* sin historial: no pasa nada */ }
  }

  function leerUrl() {
    const q = new URLSearchParams(location.search);
    estado.q = (q.get('q') || '').slice(0, 120);
    GRUPOS.concat('rama').forEach((g) => {
      const v = q.get(g) || '';
      const valido = g === 'rama'
        ? Array.from(selRama.options).some((o) => o.value === v)
        : !!document.querySelector('.cat-chip[data-filtro="' + g + '"][data-valor="' + CSS.escape(v) + '"]');
      estado[g] = valido ? v : '';
    });
    estado.destacadas = q.get('destacadas') === '1';
  }

  /* ---------- Eventos ---------- */
  document.querySelectorAll('.cat-chip').forEach((b) => {
    b.addEventListener('click', () => {
      const g = b.dataset.filtro;
      estado[g] = b.dataset.valor;
      if (g === 'familia' && estado.rama) {
        const o = selRama.querySelector('option[value="' + estado.rama + '"]');
        if (estado.familia && o && o.dataset.familia !== estado.familia) estado.rama = '';
      }
      aplicar();
    });
  });

  selRama.addEventListener('change', () => {
    estado.rama = selRama.value;
    const o = selRama.selectedOptions[0];
    if (estado.rama && o) estado.familia = o.dataset.familia;
    aplicar();
  });

  destacadas.addEventListener('change', () => { estado.destacadas = destacadas.checked; aplicar(); });

  let espera;
  busca.addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(() => { estado.q = busca.value.trim().slice(0, 120); aplicar(); }, 180);
  });
  busca.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { busca.value = ''; estado.q = ''; aplicar(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const primera = document.querySelector('.cat-rama:not([hidden])');
      if (primera) primera.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.getElementById('catLimpiar').addEventListener('click', () => {
    Object.assign(estado, { q: '', para: '', familia: '', rama: '', tema: '', aseguradora: '', destacadas: false });
    aplicar();
  });

  document.getElementById('catFiltrosToggle').addEventListener('click', (e) => {
    const abierto = filtros.classList.toggle('abierto');
    e.currentTarget.setAttribute('aria-expanded', String(abierto));
  });

  // En celular el panel de filtros tapa los resultados: este botón lo cierra.
  verBtn.addEventListener('click', () => {
    filtros.classList.remove('abierto');
    document.getElementById('catFiltrosToggle').setAttribute('aria-expanded', 'false');
    conteo.scrollIntoView({ block: 'start' });
  });

  /* ---------- Enlace directo a una póliza o a una pregunta ---------- */
  function irAlAncla() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const destino = document.getElementById(id);
    if (!destino) return;
    const poliza = destino.closest('.cat-poliza');
    if (poliza && poliza.hidden) {
      Object.assign(estado, { q: '', para: '', familia: '', rama: '', tema: '', aseguradora: '', destacadas: false });
      aplicar();
    }
    if (poliza) {
      poliza.querySelector('.cat-detalle').open = true;
      document.querySelectorAll('.cat-enfocada').forEach((x) => x.classList.remove('cat-enfocada'));
      poliza.classList.add('cat-enfocada');
    }
    if (destino.classList.contains('cat-faq')) destino.open = true;
    destino.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', irAlAncla);

  leerUrl();
  aplicar();
  irAlAncla();
})();

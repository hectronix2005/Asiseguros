#!/usr/bin/env python3
"""
Genera el catálogo de seguros a partir de catalogo.json.

Salidas:
  seguros.html     catálogo con buscador, filtros y preguntas frecuentes
  index.html       opciones del formulario de cotización, entre las marcas
                   RAMAS:INICIO/FIN y POLIZAS:INICIO/FIN

catalogo.json es la fuente de verdad del contenido (13 ramas, 71 pólizas).
Para cambiar un texto se edita el JSON y se vuelve a ejecutar:

    python3 scripts/catalogo/generar.py

Reglas que vienen con el catálogo y que este script respeta:
  - El SOAT no se cotiza aquí: solo se compra por los canales oficiales de
    Seguros del Estado. No lleva botón de cotizar ni aparece en el formulario.
  - No se agregan precios: los únicos son los que publica Seguros de Vida del
    Estado y ya vienen en el texto.
"""

import html
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import quote

RAIZ = Path(__file__).resolve().parents[2]
DATOS = json.loads((Path(__file__).parent / 'catalogo.json').read_text(encoding='utf-8'))

FAMILIAS = {
    'Empresas y contratación': 'empresas',
    'Patrimonio': 'patrimonio',
    'Movilidad': 'movilidad',
    'Personas': 'personas',
}

# ¿Para quién? Una póliza puede servir a varios tipos de cliente.
SEGMENTOS = {
    'personas':      'Personas y familias',
    'empresas':      'Empresas y negocios',
    'estado':        'Sector público y contratistas',
    'transporte':    'Transporte y vehículos',
    'profesionales': 'Profesionales independientes',
}
P, E, G, T, R = 'personas', 'empresas', 'estado', 'transporte', 'profesionales'
SEGMENTO_POR_POLIZA = {
    'cumplimiento-estatal': [G, E], 'cumplimiento-particular': [E],
    'rce-derivada-cumplimiento': [G, E], 'disposiciones-legales': [P, E],
    'judiciales': [P, E], 'garantia-ecopetrol': [G, E], 'garantia-ani': [G, E],
    'entidades-regimen-privado': [G, E], 'servicios-publicos-domiciliarios': [G, E],
    'rce': [E], 'rc-profesional-salud': [R], 'rc-directores-administradores': [E],
    'rc-servidores-publicos': [G], 'rc-profesional-miscelaneas': [R],
    'manejo-global-comercial': [E], 'manejo-entidades-estatales': [G], 'irf': [E],
    'manejo-particular': [E, P],
    'transporte-mercancias': [E, T], 'segurcarga-empresarial': [T],
    'transporte-valores': [E], 'segurcarga-propietarios': [T],
    'incendio-todo-riesgo': [E], 'hogar': [P], 'pyme-multiriesgo': [E],
    'incendio-riesgos-nombrados': [E], 'copropiedades': [E], 'sustraccion': [P, E],
    'lucro-cesante': [E],
    'todo-riesgo-construccion': [E, G], 'todo-riesgo-equipo-maquinaria': [E],
    'equipo-electronico': [E, P], 'todo-riesgo-montaje': [E], 'rotura-maquinaria': [E],
    'seguro-para-carros': [P], 'famiestado': [P], 'motoestado': [P], 'taxiestado': [T],
    'genio-comercial': [T, E], 'genio-pasajeros': [T], 'rce-autos-particular-genial': [P],
    'vehiculos-carga-genio': [T], 'rce-basica-carga': [T], 'rce-exceso-carga': [T],
    'soat': [P, T], 'rcc-servicio-publico': [T], 'rce-servicio-publico': [T],
    'rce-exceso-servicio-publico': [T], 'rcc-exceso-servicio-publico': [T],
    'vida-facil': [P], 'vida-facil-deudores': [P], 'siempre-vida': [P],
    'vida-facil-ahorro': [P],
    'vida-grupo-tradicional': [E], 'vida-grupo-deudores': [E],
    'vida-grupo-servidores-publicos': [G], 'vida-grupo-gastos-emergentes': [E],
    'plan-proteccion-vida-estado': [E], 'vida-colectivo-laboral': [E, R],
    'colectivo-convenio-uso': [E],
    'poliza-integral-estudiantil': [E, P], 'ap-colectivo-tradicional': [E],
    'ap-individual': [P], 'ap-transito-livianos': [P, T], 'ap-transito-pesados': [T],
    'hospitalizacion-cirugia': [E], 'diagnostico-cancer': [P, E], 'cuida-mas': [P, E],
    'salud-mental': [P, E], 'complicaciones-medico-quirurgicas': [R],
    'protesis-mamarias': [P],
}

# Cuestionario del paso 2 del formulario (js/main.js, CUESTIONARIOS).
CUESTIONARIO_POR_RAMA = {
    'cumplimiento': 'cumplimiento', 'responsabilidad-civil': 'empresarial',
    'manejo-riesgos-financieros': 'empresarial', 'transportes': 'carga',
    'seguros-generales': 'inmueble', 'ingenieria': 'obra',
    'autos-livianos': 'autos', 'autos-pesados': 'autos',
    'seguros-obligatorios': 'empresarial',
    'vida-individual': 'personas', 'vida-grupo': 'personas',
    'accidentes-personales': 'personas', 'salud': 'personas',
}
CUESTIONARIO_POR_POLIZA = {
    'transporte-valores': 'empresarial', 'pyme-multiriesgo': 'empresarial',
    'lucro-cesante': 'empresarial', 'equipo-electronico': 'empresarial',
    'rotura-maquinaria': 'empresarial',
}

SIN_COTIZACION = {'soat'}

TEMAS = {
    'cobertura':  'Qué cubre',
    'contratar':  'Cotizar y contratar',
    'siniestros': 'Siniestros y reclamos',
    'conceptos':  'Conceptos',
}



# Pólizas que tienen una guía propia: el catálogo las enlaza para que Google
# y el visitante lleguen a la página que trata cada producto en profundidad.
GUIAS = {
    'cumplimiento-estatal': ('poliza-de-cumplimiento.html', 'Guía: póliza de cumplimiento, qué es y cómo tramitarla'),
    'todo-riesgo-construccion': ('todo-riesgo-contratista.html', 'Guía: todo riesgo contratista, qué cubre y cómo se cotiza'),
    'rce': ('responsabilidad-civil-extracontractual.html', 'Guía: responsabilidad civil extracontractual'),
    'manejo-global-comercial': ('poliza-de-manejo.html', 'Guía: póliza de manejo para empresas y entidades'),
    'manejo-entidades-estatales': ('poliza-de-manejo.html', 'Guía: póliza de manejo para empresas y entidades'),
    'transporte-mercancias': ('seguro-transporte-de-carga.html', 'Guía: seguro de transporte de mercancías'),
}

def tema(pregunta: str) -> str:
    q = pregunta.lower()
    if re.search(r'siniestro|reclam|aviso|indemniz|radic|qué hago si|queja|tiempos de respuesta', q):
        return 'siniestros'
    if re.search(r'\bcubre|cobertura|ampar|exclu|incluye|me paga|protege|asistencia', q):
        return 'cobertura'
    if re.search(r'cotiz|necesito|document|requisit|cuánto|precio|prima|expedi|contrat|tomar|toma la|'
                 r'edad|quién puede|vigencia|renov|cancel|demora|compr|obligatori|exige|piden|'
                 r'descargar|factura|carné|debo', q):
        return 'contratar'
    return 'conceptos'


def e(t: str) -> str:
    return html.escape(t, quote=True)


def plano(t: str) -> str:
    """Texto sin etiquetas ni tildes, en minúsculas: lo que usa el buscador."""
    t = re.sub(r'<[^>]+>', ' ', t)
    t = unicodedata.normalize('NFD', html.unescape(t))
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', t).lower().strip()


def enlace_cotizar(nombre: str) -> str:
    return 'index.html?seguro=' + quote(nombre) + '#contacto'


def faq_html(f: dict, id_: str) -> str:
    t = tema(f['pregunta'])
    oficial = f.get('fuente') == 'oficial-seguros-del-estado'
    nota = ('<p class="cat-fuente">Texto de Seguros del Estado.</p>' if oficial else '')
    return (f'      <details class="cat-faq" id="{id_}" data-tema="{t}">\n'
            f'        <summary>{e(f["pregunta"])}</summary>\n'
            f'        <div class="cat-resp">{f["respuesta_html"]}{nota}</div>\n'
            f'      </details>\n')


# ---------------------------------------------------------------- seguros.html
total_polizas = sum(len(r['polizas']) for r in DATOS['ramas'])
total_preguntas = (sum(len(p['faq']) for r in DATOS['ramas'] for p in r['polizas'])
                   + len(DATOS['faq_general']) + len(DATOS['faq_siniestros_oficial']))

for r in DATOS['ramas']:
    for p in r['polizas']:
        assert p['slug'] in SEGMENTO_POR_POLIZA, 'Falta el segmento de ' + p['slug']

bloques = []
for n, r in enumerate(DATOS['ramas'], 1):
    fam = FAMILIAS[r['familia']]
    tarjetas = []
    for p in r['polizas']:
        segs = SEGMENTO_POR_POLIZA[p['slug']]
        guia = (f'<p class="cat-guia"><a href="{GUIAS[p["slug"]][0]}"><i class="fas fa-book-open"></i> '
                f'{e(GUIAS[p["slug"]][1])}</a></p>' if p['slug'] in GUIAS else '')
        buscable = plano(' '.join([p['nombre'], r['nombre'], p['resumen'], p['para_quien'],
                                   ' '.join(p.get('coberturas', []))]))
        cob = ''.join(f'<li>{e(c)}</li>' for c in p.get('coberturas', []))
        faqs = ''.join(faq_html(f, f'{p["slug"]}-p{i}') for i, f in enumerate(p['faq'], 1))
        etiquetas = ''.join(f'<span class="cat-tag">{e(SEGMENTOS[s])}</span>' for s in segs)
        destacada = ('<span class="cat-badge">Más solicitada</span>' if p.get('destacada') else '')
        if p['slug'] in SIN_COTIZACION:
            accion = ('<a href="https://cotizadorsoat.segurosdelestado.com/CotizadorSoat/EmisionContenedor.html" '
                      'class="btn btn-primary btn-sm" target="_blank" rel="noopener">'
                      'Comprar en el canal oficial <i class="fas fa-arrow-up-right-from-square"></i></a>'
                      '<p class="cat-nota-soat">El SOAT solo se compra en los canales oficiales de '
                      'Seguros del Estado. No hagas pagos por WhatsApp ni por enlaces de terceros.</p>')
        else:
            accion = (f'<a href="{e(enlace_cotizar(p["nombre"]))}" class="btn btn-primary btn-sm">'
                      f'<i class="fas fa-file-signature"></i> Cotizar esta póliza</a>')
        oficial = (f'<a href="{e(p["url_oficial"])}" class="cat-oficial" target="_blank" rel="noopener">'
                   f'Ficha en el sitio de la aseguradora <i class="fas fa-arrow-up-right-from-square"></i></a>'
                   if p.get('url_oficial') else '')
        tarjetas.append(f'''    <article class="cat-poliza" id="{p['slug']}" data-familia="{fam}" data-rama="{r['id']}"
             data-para="{' '.join(segs)}" data-aseguradora="{'vida' if 'Vida' in r['aseguradora'] else 'estado'}"
             data-destacada="{'si' if p.get('destacada') else 'no'}" data-texto="{e(buscable)}">
      <div class="cat-poliza-cab">
        <h3>{e(p['nombre'])}</h3>
        <div class="cat-badges">{destacada}<span class="cat-aseg">{e(r['aseguradora'])}</span></div>
      </div>
      <p class="cat-resumen">{e(p['resumen'])}</p>
      <p class="cat-para"><strong>Para:</strong> {e(p['para_quien'])}</p>
      {guia}
      <div class="cat-tags">{etiquetas}</div>
      <details class="cat-detalle">
        <summary><span class="cat-abrir">Ver coberturas y {len(p['faq'])} preguntas frecuentes</span>
                 <span class="cat-cerrar">Ocultar detalle</span></summary>
        <div class="cat-detalle-cuerpo">
          <h4>Coberturas principales</h4>
          <ul class="cat-coberturas">{cob}</ul>
          <h4>Preguntas frecuentes</h4>
{faqs}          <div class="cat-acciones">{accion}{oficial}</div>
        </div>
      </details>
    </article>
''')
    bloques.append(f'''  <section class="cat-rama" id="rama-{r['id']}" data-familia="{fam}" data-rama="{r['id']}">
    <header class="cat-rama-cab">
      <span class="cat-rama-num">{n:02d}</span>
      <div>
        <p class="cat-rama-fam">{e(r['familia'])} · {e(r['aseguradora'])}</p>
        <h2>{e(r['nombre'])}</h2>
        <p class="cat-rama-lema">{e(r['lema'])}</p>
        <p class="cat-rama-intro">{e(r['intro'])}</p>
      </div>
    </header>
{''.join(tarjetas)}  </section>
''')


def chips(grupo: str, opciones: dict) -> str:
    out = [f'<button type="button" class="cat-chip" data-filtro="{grupo}" data-valor="" aria-pressed="true">Todos</button>']
    for k, v in opciones.items():
        out.append(f'<button type="button" class="cat-chip" data-filtro="{grupo}" data-valor="{k}" aria-pressed="false">{e(v)}</button>')
    return '\n          '.join(out)


opciones_rama = '\n            '.join(
    f'<option value="{r["id"]}" data-familia="{FAMILIAS[r["familia"]]}">{e(r["nombre"])}</option>'
    for r in DATOS['ramas'])

faq_general = ''.join(faq_html(f, f'general-p{i}') for i, f in enumerate(DATOS['faq_general'], 1))
faq_siniestros = ''.join(faq_html(f, f'siniestros-p{i}') for i, f in enumerate(DATOS['faq_siniestros_oficial'], 1))

jsonld = json.dumps({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [{
        '@type': 'Question', 'name': f['pregunta'],
        'acceptedAnswer': {'@type': 'Answer', 'text': f['respuesta_html']},
    } for f in DATOS['faq_general'] + DATOS['faq_siniestros_oficial']],
}, ensure_ascii=False, indent=1)

pagina = f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{total_polizas} pólizas de Seguros del Estado explicadas en lenguaje claro: cumplimiento, responsabilidad civil, autos, hogar, vida y salud. Filtra y cotiza.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Seguros y preguntas frecuentes | AsiSeguros">
  <meta property="og:description" content="{total_polizas} pólizas explicadas en lenguaje claro, con filtros por tipo de cliente y necesidad.">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://www.asiseguros.com/assets/img/og-asiseguros.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://www.asiseguros.com/seguros.html">
  <title>Tipos de seguros y preguntas frecuentes | AsiSeguros</title>

  <link rel="icon" href="favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="css/styles.css?v=8">
  <link rel="stylesheet" href="css/articulo.css?v=3">
  <link rel="stylesheet" href="css/catalogo.css?v=2">
  <script>document.documentElement.classList.add('js')</script>
  <script type="application/ld+json">
{jsonld}
  </script>
</head>
<body class="cat-pagina">

  <header class="header" id="header">
    <div class="container">
      <a href="index.html" class="logo">
        <img src="assets/img/logo-web.png" alt="AsiSeguros" height="55">
      </a>
      <nav>
        <ul class="nav-menu">
          <li><a href="index.html#inicio">Inicio</a></li>
          <li class="active"><a href="seguros.html">Seguros y preguntas</a></li>
          <li><a href="#siniestros">¿Tuviste un siniestro?</a></li>
          <li><a href="index.html#contacto">Contacto</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <section class="cat-hero">
    <div class="container">
      <p class="cat-eyebrow">Portafolio 2026 · Seguros del Estado y Seguros de Vida del Estado</p>
      <h1>Encuentra el seguro que necesitas y resuelve tus dudas</h1>
      <p class="cat-hero-texto">
        {total_polizas} pólizas explicadas en lenguaje claro: qué cubren, para quién son y las
        preguntas que más nos hacen. Filtra por lo que quieres proteger o busca con tus palabras.
      </p>
      <label class="cat-buscador" for="catBusca">
        <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
        <span class="sr-only">Buscar en el catálogo</span>
        <input type="search" id="catBusca" placeholder="Ej.: póliza para licitación, seguro de moto, deducible…" autocomplete="off">
      </label>
      <div class="cat-cifras">
        <div><b>{len(DATOS['ramas'])}</b><span>ramas</span></div>
        <div><b>{total_polizas}</b><span>pólizas</span></div>
        <div><b>{total_preguntas}</b><span>respuestas</span></div>
      </div>
      <div class="cat-hero-botones">
        <a href="assets/docs/portafolio-asiseguros-2026.pdf" class="btn btn-primary" download>
          <i class="fas fa-file-pdf"></i> Descargar portafolio (PDF)
        </a>
        <a href="index.html#contacto" class="btn btn-secondary">
          <i class="fas fa-file-signature"></i> Solicitar asesoría
        </a>
      </div>
    </div>
  </section>

  <main class="container cat-cuerpo">
    <aside class="cat-filtros" id="catFiltros" aria-label="Filtros del catálogo">
      <button type="button" class="cat-filtros-toggle" id="catFiltrosToggle" aria-expanded="false" aria-controls="catFiltrosCuerpo">
        <i class="fas fa-sliders"></i> Filtros <span class="cat-filtros-activos" id="catActivos"></span>
      </button>
      <div class="cat-filtros-cuerpo" id="catFiltrosCuerpo">
        <div class="cat-grupo">
          <h3>¿Para quién es?</h3>
          {chips('para', SEGMENTOS)}
        </div>
        <div class="cat-grupo">
          <h3>¿Qué quieres proteger?</h3>
          {chips('familia', {v: k for k, v in FAMILIAS.items()})}
        </div>
        <div class="cat-grupo">
          <h3><label for="catRama">Rama</label></h3>
          <select id="catRama">
            <option value="">Todas las ramas</option>
            {opciones_rama}
          </select>
        </div>
        <div class="cat-grupo">
          <h3>Tema de la pregunta</h3>
          {chips('tema', TEMAS)}
        </div>
        <div class="cat-grupo">
          <h3>Aseguradora</h3>
          {chips('aseguradora', {'estado': 'Seguros del Estado', 'vida': 'Seguros de Vida del Estado'})}
        </div>
        <label class="cat-check">
          <input type="checkbox" id="catDestacadas"> Solo las más solicitadas
        </label>
        <button type="button" class="cat-limpiar" id="catLimpiar">Quitar todos los filtros</button>
        <button type="button" class="btn btn-primary cat-ver" id="catVer">Ver resultados</button>
      </div>
    </aside>

    <div class="cat-resultados">
      <p class="cat-conteo" id="catConteo" aria-live="polite">{total_polizas} pólizas</p>
      <div class="cat-vacio" id="catVacio" hidden>
        <h2>No encontramos pólizas con esos filtros</h2>
        <p>Prueba con otras palabras o quita algún filtro. Si no sabes qué póliza necesitas,
          <a href="index.html?seguro=Otro#contacto">cuéntanos tu caso</a> y te orientamos sin costo.</p>
      </div>

{''.join(bloques)}
      <section class="cat-rama cat-general" id="preguntas-generales" data-familia="" data-rama="">
        <header class="cat-rama-cab">
          <span class="cat-rama-num"><i class="fas fa-circle-question"></i></span>
          <div>
            <p class="cat-rama-fam">Para todas las pólizas</p>
            <h2>Preguntas generales sobre seguros</h2>
            <p class="cat-rama-intro">Lo básico para entender una póliza antes de contratarla.</p>
          </div>
        </header>
        <div class="cat-lista-faq">
{faq_general}        </div>
      </section>

      <section class="cat-rama cat-general" id="siniestros" data-familia="" data-rama="">
        <header class="cat-rama-cab">
          <span class="cat-rama-num"><i class="fas fa-life-ring"></i></span>
          <div>
            <p class="cat-rama-fam">Si ya tienes tu póliza</p>
            <h2>¿Tuviste un siniestro?</h2>
            <p class="cat-rama-intro">Avísalo cuanto antes por los canales oficiales de Seguros del Estado y
              escríbenos: te acompañamos en el trámite sin costo.</p>
          </div>
        </header>
        <div class="cat-canales">
          <div><span>Autos</span><a href="mailto:indemautos@segurosdelestado.com">indemautos@segurosdelestado.com</a></div>
          <div><span>Generales, RC y transportes</span><a href="mailto:siniestros.multiriesgos@segurosdelestado.com">siniestros.multiriesgos@segurosdelestado.com</a></div>
          <div><span>Cumplimiento</span><a href="mailto:correspondenciacrp@segurosdelestado.com">correspondenciacrp@segurosdelestado.com</a></div>
          <div><span>Vida y salud</span><a href="mailto:siniestrosvidaterminosnormales@segurosdelestado.com">siniestrosvidaterminosnormales@segurosdelestado.com</a></div>
          <div><span>Póliza Estudiantil y SOAT</span><a href="https://www.sis.co" target="_blank" rel="noopener">Proveedor SIS · sis.co</a></div>
          <div><span>Asistencias 24 horas</span><a href="tel:+576017443900">#388 · (601) 744 39 00</a></div>
        </div>
        <div class="cat-lista-faq">
{faq_siniestros}        </div>
      </section>

      <div class="art-cta cat-cta">
        <h3>¿No sabes cuál póliza necesitas?</h3>
        <p>Cuéntanos qué quieres proteger y un asesor te responde en menos de 24 horas, sin costo.</p>
        <a href="index.html?seguro=Otro#contacto" class="btn btn-primary">
          <i class="fas fa-file-signature"></i> Solicitar asesoría
        </a>
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-bottom">
        <span>&copy; 2026 AsiSeguros. Todos los derechos reservados.</span>
        <div class="footer-bottom-links">
          <a href="politica-tratamiento-datos.html">Política de Privacidad</a>
          <a href="terminos-y-condiciones.html">Términos y Condiciones</a>
        </div>
      </div>
      <p class="footer-nap">
        ASISEGUROS LTDA · Calle 106 No. 51-19, piso 2, Bogotá D.C. ·
        <a href="tel:+573185231290">+57 318 523 1290</a> · Lunes a viernes, 8:00 a.&nbsp;m. a 6:00 p.&nbsp;m.
      </p>

      <p class="footer-legal-note">
        AsiSeguros es el nombre comercial de ASISEGUROS LTDA, NIT 901.483.323-4, agencia de seguros
        que actúa como intermediario y no asume la calidad de aseguradora. Las pólizas son expedidas
        por Seguros del Estado S.A. y por Seguros de Vida del Estado S.A., según el ramo, compañías
        vigiladas por la Superintendencia Financiera de Colombia. Esta página es informativa y no
        constituye asesoría jurídica ni oferta; las coberturas, exclusiones y deducibles aplicables son
        únicamente los señalados en el clausulado de cada póliza. Precios publicados por Seguros de Vida
        del Estado, sujetos a términos y condiciones. Contenido actualizado el {e(DATOS['generado'])}.
      </p>
    </div>
  </footer>

  <a href="https://wa.me/573185231290?text=Hola%2C%20quiero%20asesor%C3%ADa%20para%20elegir%20un%20seguro"
     class="whatsapp-float" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">
    <i class="fab fa-whatsapp"></i>
  </a>

  <script src="js/main.js?v=8"></script>
  <script src="js/catalogo.js?v=1"></script>
</body>
</html>
'''
(RAIZ / 'seguros.html').write_text(pagina, encoding='utf-8')

# ---------------------------------------------------------------- formulario
ramas_form = []
for r in DATOS['ramas']:
    pols = [{'nombre': p['nombre'], 'slug': p['slug'],
             'cuestionario': CUESTIONARIO_POR_POLIZA.get(p['slug'], CUESTIONARIO_POR_RAMA[r['id']]),
             # Texto para el buscador rápido del formulario: nombre, rama y a quién va dirigida.
             'buscar': plano(' '.join([p['nombre'], r['nombre'], p['para_quien']]))}
            for p in r['polizas'] if p['slug'] not in SIN_COTIZACION]
    ramas_form.append({'id': r['id'], 'nombre': r['nombre'], 'polizas': pols})

# ---------------------------------------------------------------- index.html
opciones = []
for r in ramas_form:
    opciones.append(f'                <optgroup label="{e(r["nombre"])}" data-rama="{r["id"]}">')
    for p in r['polizas']:
        opciones.append(f'                  <option value="{e(p["nombre"])}" data-cuestionario="{p["cuestionario"]}"'
                        f' data-buscar="{e(p["buscar"])}">{e(p["nombre"])}</option>')
    opciones.append('                </optgroup>')
opciones.append('                <option value="Otro">No sé cuál necesito: quiero asesoría</option>')

ramas_sel = [f'                <option value="{r["id"]}">{e(r["nombre"])}</option>' for r in ramas_form]
ramas_sel.append('                <option value="otro">No estoy seguro</option>')

idx = (RAIZ / 'index.html').read_text(encoding='utf-8')
for marca, contenido in (('POLIZAS', opciones), ('RAMAS', ramas_sel)):
    patron = re.compile(rf'(<!-- {marca}:INICIO[^>]*-->).*?(\n *<!-- {marca}:FIN -->)', re.S)
    assert patron.search(idx), f'Faltan las marcas {marca} en index.html'
    idx = patron.sub(lambda m: m.group(1) + '\n' + '\n'.join(contenido) + m.group(2), idx)
(RAIZ / 'index.html').write_text(idx, encoding='utf-8')

print(f'seguros.html: {len(DATOS["ramas"])} ramas, {total_polizas} pólizas, {total_preguntas} preguntas')
print(f'index.html: {sum(len(r["polizas"]) for r in ramas_form)} pólizas cotizables')

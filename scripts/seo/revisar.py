#!/usr/bin/env python3
"""Revisa las páginas del sitio contra lo que Google pide para indexar y posicionar.

Uso:  python3 scripts/seo/revisar.py [archivo.html ...]
Sin argumentos revisa las páginas del sitemap y todas las guías .html de la raíz.

Cubre lo que se puede comprobar en el código, según la documentación de Google
Search Central: rastreo e indexación (canonical, robots, sitemap, enlaces),
title y descripción, encabezados, datos estructurados (Article, BreadcrumbList,
FAQPage) coherentes con lo visible, imágenes, carga sin recursos externos que
bloqueen el render, señales de confianza (autor, fecha, intermediario) y
contenido duplicado entre páginas. La velocidad real se mide aparte con
Lighthouse o PageSpeed Insights.

Sale con código 1 si hay errores; las advertencias no detienen nada.
"""

import json, os, re, sys, html
from html.parser import HTMLParser

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = 'https://www.asiseguros.com/'
NO_CONTENIDO = {'404.html', 'admin.html', 'politica-tratamiento-datos.html', 'terminos-y-condiciones.html'}


class Pagina(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pila, self.h1, self.h, self.imgs, self.enlaces, self.metas = [], [], [], [], [], {}
        self.links, self.ld, self.texto_main, self.summaries, self.migas = [], [], [], [], []
        self._ld, self._main, self._sum, self._h, self._migas, self._head = None, 0, None, None, 0, False
        self.lang = None
        self._noscript = False

    def handle_starttag(self, t, a):
        a = dict(a)
        if t == 'html': self.lang = a.get('lang')
        if t == 'head': self._head = True
        if t == 'meta':
            k = a.get('name') or a.get('property')
            if k: self.metas[k] = a.get('content', '')
        if t == 'noscript': self._noscript = True
        if t == 'link' and not self._noscript: self.links.append(a)
        if t == 'script' and a.get('type') == 'application/ld+json': self._ld = ''
        if t == 'main': self._main += 1
        if t == 'nav' and 'art-migas' in (a.get('class') or ''): self._migas = 1
        if t in ('h1', 'h2', 'h3'): self._h = [t, '']
        if t == 'summary': self._sum = ''
        if t == 'img': self.imgs.append(a)
        if t == 'a' and a.get('href'): self.enlaces.append(a)

    def handle_endtag(self, t):
        if t == 'head': self._head = False
        if t == 'noscript': self._noscript = False
        if t == 'script' and self._ld is not None: self.ld.append(self._ld); self._ld = None
        if t == 'main': self._main -= 1
        if t == 'nav': self._migas = 0
        if t in ('h1', 'h2', 'h3') and self._h:
            txt = re.sub(r'\s+', ' ', self._h[1]).strip()
            (self.h1 if t == 'h1' else self.h).append(txt); self._h = None
        if t == 'summary' and self._sum is not None:
            self.summaries.append(re.sub(r'\s+', ' ', self._sum).strip()); self._sum = None

    def handle_data(self, d):
        if self._ld is not None: self._ld += d
        if self._h: self._h[1] += d
        if self._sum is not None: self._sum += d
        if self._main: self.texto_main.append(d)
        if self._migas and d.strip(): self.migas.append(d.strip())


def paginas_por_defecto():
    sm = open(os.path.join(RAIZ, 'sitemap.xml')).read()
    en_sitemap = [u.replace(BASE, '') or 'index.html' for u in re.findall(r'<loc>([^<]+)</loc>', sm)]
    sueltas = [f for f in os.listdir(RAIZ) if f.endswith('.html') and f not in NO_CONTENIDO]
    return sorted(set(p for p in en_sitemap + sueltas if p not in NO_CONTENIDO)), set(en_sitemap)


def tejas(texto, n=8):
    p = re.findall(r'\w+', texto.lower())
    return {' '.join(p[i:i + n]) for i in range(max(0, len(p) - n))}


def revisar(f, en_sitemap, todas):
    err, adv = [], []
    s = open(os.path.join(RAIZ, f), encoding='utf-8').read()
    p = Pagina(); p.feed(s)
    url = BASE + ('' if f == 'index.html' else f)
    titulo = html.unescape(m.group(1)).strip() if (m := re.search(r'<title>([^<]*)</title>', s)) else ''
    desc = p.metas.get('description', '')

    # --- HTML bien formado en lo que Google lee primero (el <head>)
    if re.search(r'<noscript>(?:(?!</noscript>).)*<noscript>', s, re.S): err.append('<noscript> anidado')
    if s.count('<noscript') != s.count('</noscript>'): err.append('<noscript> sin cerrar')

    # --- Rastreo e indexación
    canon = [l.get('href') for l in p.links if l.get('rel') == 'canonical']
    if canon != [url]: err.append(f'canonical {canon} debería ser [{url}]')
    if 'noindex' in p.metas.get('robots', ''): err.append('tiene noindex')
    if p.lang not in ('es', 'es-CO'): err.append(f'lang="{p.lang}"')
    if 'viewport' not in p.metas: err.append('falta meta viewport')
    if f not in en_sitemap: adv.append('no está en sitemap.xml (agregarla al publicar)')

    # --- Title y descripción (Google muestra ~60 y ~155 caracteres)
    if not 25 <= len(titulo) <= 62: err.append(f'title de {len(titulo)} caracteres')
    if not 70 <= len(desc) <= 160: err.append(f'description de {len(desc)} caracteres')

    # --- Encabezados
    if len(p.h1) != 1: err.append(f'{len(p.h1)} H1')
    if len(p.h) < 3: adv.append('menos de 3 subtítulos H2/H3')

    # --- Vista previa al compartir
    for k in ('og:title', 'og:description', 'og:image', 'og:url' if f != 'index.html' else 'og:type', 'twitter:card'):
        if k not in p.metas: err.append(f'falta {k}')

    # --- Datos estructurados
    tipos, grafo = {}, []
    for bloque in p.ld:
        try:
            d = json.loads(bloque)
        except Exception as e:
            err.append(f'JSON-LD inválido: {e}'); continue
        for nodo in d.get('@graph', [d]):
            tipos[nodo.get('@type')] = nodo; grafo.append(nodo)
    es_guia = f not in ('index.html', 'seguros.html', 'asesoria-juridica.html')
    if es_guia:
        art = tipos.get('Article')
        if not art: err.append('falta Article en JSON-LD')
        else:
            if art.get('headline') != (p.h1[0] if p.h1 else None): err.append('headline del Article distinto del H1')
            if len(art.get('headline', '')) > 110: err.append('headline de más de 110 caracteres')
            for k in ('image', 'datePublished', 'dateModified', 'author', 'publisher'):
                if not art.get(k): err.append(f'Article sin {k}')
            if art.get('author') and not art['author'].get('url'): adv.append('author sin url')
            fecha = art.get('dateModified', '')
            meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
                     'septiembre', 'octubre', 'noviembre', 'diciembre']
            if fecha and f'{meses[int(fecha[5:7]) - 1]} de {fecha[:4]}' not in s:
                adv.append('la fecha visible no coincide con dateModified')
    # El catálogo usa filtros y no lleva migas; el resto de páginas internas sí
    if f not in ('index.html', 'seguros.html'):
        bc = tipos.get('BreadcrumbList')
        if not bc: err.append('falta BreadcrumbList')
        elif p.migas and [i['name'] for i in bc['itemListElement']] != p.migas:
            err.append(f'migas visibles {p.migas} ≠ BreadcrumbList')
        if not p.migas: adv.append('sin ruta visible (migas)')
    faq = tipos.get('FAQPage')
    if faq:
        preguntas = [q['name'] for q in faq['mainEntity']]
        if f != 'seguros.html' and preguntas != p.summaries:
            err.append('las preguntas del FAQPage no coinciden con las visibles')
    elif es_guia:
        adv.append('sin preguntas frecuentes')

    # --- Enlaces
    for a in p.enlaces:
        h = a['href']
        if h.startswith(('http://', 'https://')) and 'asiseguros.com' not in h:
            if a.get('target') == '_blank' and 'noopener' not in (a.get('rel') or ''):
                adv.append(f'enlace externo sin rel=noopener: {h[:60]}')
            continue
        destino = re.split(r'[?#]', h)[0]
        if destino.endswith('.html') and not os.path.exists(os.path.join(RAIZ, destino)):
            err.append(f'enlace roto a {destino}')
        elif destino.endswith('.html') and f in en_sitemap and destino not in en_sitemap \
                and destino not in NO_CONTENIDO and destino != 'index.html':
            err.append(f'página publicada enlaza a {destino}, que aún no está publicada')
    entrantes = sum(1 for g in todas if g != f and f'href="{f}' in open(os.path.join(RAIZ, g)).read())
    if f != 'index.html' and entrantes < 2: adv.append(f'solo {entrantes} enlace(s) interno(s) entrante(s)')

    # --- Imágenes
    for i in p.imgs:
        if not i.get('alt'): err.append(f'imagen sin alt: {i.get("src")}')
        if not (i.get('width') and i.get('height')): adv.append(f'imagen sin width/height: {i.get("src")}')

    # --- Carga: hojas externas que bloquean el render
    for l in p.links:
        if l.get('rel') == 'stylesheet' and l.get('href', '').startswith('http') and l.get('media') != 'print':
            adv.append(f'hoja externa que bloquea el render: {l["href"][:60]}')

    # --- Contenido y confianza
    texto = re.sub(r'\s+', ' ', ' '.join(p.texto_main))
    palabras = len(texto.split())
    if es_guia and palabras < 600 or f == 'asesoria-juridica.html' and palabras < 300: adv.append(f'solo {palabras} palabras en el contenido principal')
    if re.search(r'\bcorredor(es)? de seguros\b', s, re.I) and 'no es corredor' not in s.lower():
        err.append('usa «corredor de seguros»: AsiSeguros es agencia')
    if es_guia and 'art-fuentes' not in s and 'Decreto' in s: adv.append('cita normas sin sección de fuentes enlazadas')
    if 'Seguros del Estado' not in s: adv.append('no nombra a la aseguradora que expide')
    if 'intermediario' not in s: err.append('no aclara que AsiSeguros es intermediario')
    if re.search(r'\btasas?\s+(de|del)\s+\d|\bprima\s+de\s+\$\s?\d', texto, re.I):
        err.append('parece publicar una tasa o prima en cifras')
    return err, adv, palabras, tejas(texto)


def main():
    defecto, en_sitemap = paginas_por_defecto()
    archivos = sys.argv[1:] or defecto
    todas = defecto
    total_err, huellas = 0, {}
    titulos, descs = {}, {}
    for f in archivos:
        err, adv, palabras, huella = revisar(f, en_sitemap, todas)
        huellas[f] = huella
        s = open(os.path.join(RAIZ, f), encoding='utf-8').read()
        titulos.setdefault(re.search(r'<title>([^<]*)', s).group(1), []).append(f)
        descs.setdefault((re.search(r'name="description" content="([^"]*)', s) or [None, ''])[1], []).append(f)
        estado = 'OK ' if not err else 'ERR'
        print(f'{estado} {f}  ({palabras} palabras)')
        for e in err: print(f'     ✗ {e}')
        for a in adv: print(f'     · {a}')
        total_err += len(err)
    for k, v in list(titulos.items()) + list(descs.items()):
        if len(v) > 1: print(f'ERR duplicado entre {v}: {k[:60]}'); total_err += 1
    # Contenido duplicado: proporción de frases de 8 palabras compartidas
    fs = list(huellas)
    for i, a in enumerate(fs):
        for b in fs[i + 1:]:
            if huellas[a] and huellas[b]:
                comun = len(huellas[a] & huellas[b]) / min(len(huellas[a]), len(huellas[b]))
                if comun > 0.15:
                    print(f'  · {a} y {b} comparten el {comun:.0%} del texto')
    print(f'\n{len(archivos)} páginas, {total_err} errores')
    sys.exit(1 if total_err else 0)


if __name__ == '__main__':
    main()

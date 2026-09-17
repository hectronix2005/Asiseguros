<?php
/**
 * Conversor de .docx a HTML.
 *
 * Un .docx es un ZIP que contiene word/document.xml con el texto marcado en
 * WordprocessingML. Aquí se lee ese XML y se traduce a HTML limpio: encabezados,
 * párrafos, listas, negritas, cursivas y tablas. Es deliberadamente conservador:
 * ignora estilos visuales de Word para que el documento herede el diseño del
 * sitio en vez de traerse fuentes y colores ajenos.
 *
 * No usa librerías externas: el hosting no tiene Composer ni pandoc.
 */

declare(strict_types=1);

require_once __DIR__ . '/zip.php';

function docx_a_html(string $rutaDocx): array
{
    if (!is_file($rutaDocx)) {
        return ['ok' => false, 'error' => 'No se encontró el archivo.'];
    }

    // Se lee el ZIP con un lector propio: el hosting corre PHP sin la extensión
    // `zip`, así que ZipArchive no existe.
    $xml = zip_leer($rutaDocx, 'word/document.xml');

    if ($xml === null) {
        return ['ok' => false, 'error' => 'El archivo no es un .docx válido o está dañado.'];
    }

    $previo = libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    if (!$doc->loadXML($xml)) {
        libxml_use_internal_errors($previo);
        return ['ok' => false, 'error' => 'No se pudo leer el contenido del documento.'];
    }
    libxml_use_internal_errors($previo);

    $ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    $xp = new DOMXPath($doc);
    $xp->registerNamespace('w', $ns);

    $html = [];
    $listaAbierta = null;   // 'ul' | 'ol' | null

    $cerrarLista = function () use (&$html, &$listaAbierta) {
        if ($listaAbierta !== null) {
            $html[] = "</{$listaAbierta}>";
            $listaAbierta = null;
        }
    };

    $cuerpo = $xp->query('//w:body')->item(0);
    if (!$cuerpo) {
        return ['ok' => false, 'error' => 'El documento está vacío.'];
    }

    foreach ($cuerpo->childNodes as $nodo) {
        if ($nodo->nodeType !== XML_ELEMENT_NODE) continue;
        $tag = $nodo->localName;

        if ($tag === 'p') {
            [$texto, $estilo, $esLista, $tipoLista] = docx_parrafo($xp, $nodo);

            if ($texto === '') { continue; }

            if ($esLista) {
                $quiere = $tipoLista === 'ol' ? 'ol' : 'ul';
                if ($listaAbierta !== $quiere) {
                    $cerrarLista();
                    $html[] = "<{$quiere}>";
                    $listaAbierta = $quiere;
                }
                $html[] = "  <li>{$texto}</li>";
                continue;
            }

            $cerrarLista();

            // Los estilos de Word se mapean a la jerarquía del sitio. El h1 se
            // reserva para el título de la página, así que Heading 1 baja a h2.
            if (preg_match('/^Heading\s*([1-6])$|^Ttulo\s*([1-6])$|^Título\s*([1-6])$/iu', $estilo, $m)) {
                $nivel = (int)($m[1] ?: $m[2] ?: $m[3]);
                $nivel = min($nivel + 1, 6);
                $html[] = "<h{$nivel}>" . strip_tags($texto, '<strong><em>') . "</h{$nivel}>";
            } elseif (preg_match('/^(Title|Ttulo|Título)$/iu', $estilo)) {
                $html[] = '<h2>' . strip_tags($texto, '<strong><em>') . '</h2>';
            } elseif (docx_parece_titulo($texto)) {
                // Muchos documentos legales no usan estilos de Word y marcan los
                // títulos solo con negrita. Sin esto, el documento entero saldría
                // como un muro de párrafos.
                $html[] = '<h3>' . trim(strip_tags($texto)) . '</h3>';
            } else {
                $html[] = "<p>{$texto}</p>";
            }
            continue;
        }

        if ($tag === 'tbl') {
            $cerrarLista();
            $html[] = docx_tabla($xp, $nodo);
        }
    }
    $cerrarLista();

    $salida = implode("\n", array_filter($html, fn($l) => trim($l) !== ''));

    if (trim(strip_tags($salida)) === '') {
        return ['ok' => false, 'error' => 'No se pudo extraer texto del documento.'];
    }

    return ['ok' => true, 'html' => $salida];
}

/** Devuelve [htmlDelParrafo, nombreDeEstilo, esElementoDeLista, 'ul'|'ol'] */
function docx_parrafo(DOMXPath $xp, DOMNode $p): array
{
    $estilo = '';
    $nodoEstilo = $xp->query('./w:pPr/w:pStyle/@w:val', $p)->item(0);
    if ($nodoEstilo) $estilo = $nodoEstilo->nodeValue;

    $esLista = $xp->query('./w:pPr/w:numPr', $p)->length > 0;

    // Word distingue viñeta de numeración en numbering.xml; como aproximación
    // fiable y barata se usa el nombre del estilo.
    $tipoLista = preg_match('/number|ordenad|decimal/i', $estilo) ? 'ol' : 'ul';

    $partes = [];
    foreach ($xp->query('.//w:r', $p) as $run) {
        $t = '';
        foreach ($xp->query('./w:t|./w:tab|./w:br', $run) as $hijo) {
            if ($hijo->localName === 't')   $t .= $hijo->textContent;
            if ($hijo->localName === 'tab') $t .= ' ';
            if ($hijo->localName === 'br')  $t .= "\n";
        }
        if ($t === '') continue;

        $t = htmlspecialchars($t, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $t = str_replace("\n", '<br>', $t);

        if ($xp->query('./w:rPr/w:b', $run)->length > 0)  $t = "<strong>{$t}</strong>";
        if ($xp->query('./w:rPr/w:i', $run)->length > 0)  $t = "<em>{$t}</em>";

        $partes[] = $t;
    }

    $texto = trim(implode('', $partes));
    $texto = preg_replace('/\s+/u', ' ', $texto);

    // Los correos y las URLs se vuelven enlaces utilizables.
    $texto = preg_replace(
        '/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/',
        '<a href="mailto:$1">$1</a>',
        $texto
    );

    return [$texto, $estilo, $esLista, $tipoLista];
}

function docx_tabla(DOMXPath $xp, DOMNode $tbl): string
{
    $filas = [];
    foreach ($xp->query('./w:tr', $tbl) as $i => $tr) {
        $celdas = [];
        foreach ($xp->query('./w:tc', $tr) as $tc) {
            $texto = [];
            foreach ($xp->query('./w:p', $tc) as $p) {
                [$t] = docx_parrafo($xp, $p);
                if ($t !== '') $texto[] = $t;
            }
            $celdas[] = implode('<br>', $texto);
        }
        if (!$celdas) continue;
        $et = $i === 0 ? 'th' : 'td';
        $filas[] = '  <tr>' . implode('', array_map(fn($c) => "<{$et}>{$c}</{$et}>", $celdas)) . '</tr>';
    }
    if (!$filas) return '';
    return "<div class=\"tabla-scroll\">\n<table>\n" . implode("\n", $filas) . "\n</table>\n</div>";
}

/**
 * ¿Este párrafo es en realidad un título sin estilo de Word?
 *
 * Criterio conservador: todo el contenido va en negrita, es corto, no termina en
 * punto y no parece una frase con dos puntos seguida de texto. Ante la duda se
 * deja como párrafo: convertir un párrafo en título es peor que lo contrario.
 */
function docx_parece_titulo(string $html): bool
{
    $plano = trim(strip_tags($html));
    if ($plano === '' || mb_strlen($plano) > 90) return false;

    // Todo el texto debe estar dentro de una única marca de negrita.
    if (!preg_match('~^\s*<strong>(.*)</strong>\s*$~su', $html, $m)) return false;
    if (str_contains($m[1], '<strong>')) return false;  // negritas parciales
    if (str_contains($html, '<br>')) return false;      // es un bloque, no un título

    if (preg_match('/[.;]$/u', $plano)) return false;   // termina en punto: es frase
    if (preg_match('/:\s*\S/u', $plano)) return false;  // "Objetivo: bla" es párrafo

    return true;
}

<?php
/**
 * Generación de las páginas legales del sitio a partir del HTML convertido.
 *
 * La plantilla replica el diseño de las páginas legales existentes para que un
 * documento cargado desde el panel se vea como parte del sitio y no como un
 * pegote.
 */

declare(strict_types=1);

const RAIZ_SITIO = __DIR__ . '/../..';

/** Documentos que el panel sabe publicar. */
function documentos_disponibles(): array
{
    return [
        'politica' => [
            'titulo'   => 'Política de Tratamiento de Datos Personales',
            'archivo'  => 'politica-tratamiento-datos.html',
            'meta'     => 'Política de Tratamiento de Datos Personales de ASISEGUROS LTDA, conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015.',
            'ayuda'    => 'Se enlaza desde el pie de página y desde la casilla de autorización del formulario.',
        ],
        'terminos' => [
            'titulo'   => 'Términos y Condiciones de uso',
            'archivo'  => 'terminos-y-condiciones.html',
            'meta'     => 'Términos y Condiciones de uso del sitio web de ASISEGUROS LTDA, agencia de seguros intermediaria en Colombia.',
            'ayuda'    => 'Se enlaza desde el pie de página.',
        ],
        'anexos' => [
            'titulo'   => 'Anexos del Manual de Datos Personales',
            'archivo'  => 'anexos-datos-personales.html',
            'meta'     => 'Anexos del Manual de Tratamiento de Datos Personales de ASISEGUROS LTDA.',
            'ayuda'    => 'Se enlaza desde la Política de Tratamiento de Datos.',
        ],
    ];
}

function construir_pagina(string $titulo, string $metaDescripcion, string $contenido, string $fecha): string
{
    $t = htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');
    $m = htmlspecialchars($metaDescripcion, ENT_QUOTES, 'UTF-8');
    $f = htmlspecialchars($fecha, ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{$m}">
  <meta name="robots" content="index, follow">
  <title>{$t} | AsiSeguros</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="stylesheet" href="css/styles.css?v=4">
  <style>
    .legal-page { padding: 60px 0 80px; }
    .legal-page .container { max-width: 860px; }
    .legal-back { display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--gray-500); margin-bottom: 24px; }
    .legal-page h1 { font-size: 2rem; color: var(--primary); margin-bottom: 8px; }
    .legal-meta { font-size: 0.8rem; color: var(--gray-400); margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid var(--gray-200); }
    .legal-page h2 { font-size: 1.3rem; color: var(--primary); margin: 40px 0 14px; }
    .legal-page h3 { font-size: 1.08rem; color: var(--primary); margin: 32px 0 12px; }
    .legal-page h4, .legal-page h5, .legal-page h6 { font-size: 1rem; color: var(--primary); margin: 26px 0 10px; }
    .legal-page p, .legal-page li, .legal-page td, .legal-page th { font-size: 0.95rem; line-height: 1.75; color: var(--gray-600); }
    .legal-page p { margin-bottom: 14px; }
    .legal-page ul, .legal-page ol { margin: 0 0 14px 22px; list-style: disc; }
    .legal-page ol { list-style: decimal; }
    .legal-page li { display: list-item; margin-bottom: 8px; }
    .legal-page a { color: var(--primary); text-decoration: underline; }
    .tabla-scroll { overflow-x: auto; margin: 0 0 20px; }
    .legal-page table { border-collapse: collapse; width: 100%; min-width: 480px; }
    .legal-page th, .legal-page td { border: 1px solid var(--gray-200); padding: 10px 12px; text-align: left; vertical-align: top; }
    .legal-page th { background: var(--gray-50); color: var(--primary); font-weight: 600; }

    @media print {
      .header, .footer, .legal-back { display: none !important; }
      .legal-page { padding: 0; }
      .legal-page .container { max-width: 100%; padding: 0; }
      .legal-page h2, .legal-page h3 { break-after: avoid; page-break-after: avoid; }
      .legal-page p, .legal-page li { break-inside: avoid; }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>

  <header class="header" id="header">
    <div class="container">
      <a href="index.html" class="logo">
        <img src="assets/img/logo.png" alt="AsiSeguros" height="55">
      </a>
      <nav>
        <ul class="nav-menu">
          <li><a href="index.html#inicio">Inicio</a></li>
          <li><a href="index.html#portafolio">Portafolio</a></li>
          <li><a href="index.html#contacto">Contacto</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="legal-page">
    <div class="container">
      <a href="index.html" class="legal-back"><i class="fas fa-arrow-left"></i> Volver al inicio</a>

      <h1>{$t}</h1>
      <p class="legal-meta">ASISEGUROS LTDA · NIT 901.483.323-4 · Última actualización: {$f}</p>

{$contenido}
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-bottom">
        <span>&copy; 2026 AsiSeguros. Todos los derechos reservados.</span>
        <div class="footer-bottom-links">
          <a href="politica-tratamiento-datos.html">Política de Privacidad</a>
          <a href="terminos-y-condiciones.html">Términos y Condiciones</a>
          <a href="anexos-datos-personales.html">Anexos de Datos Personales</a>
        </div>
      </div>
    </div>
  </footer>

</body>
</html>

HTML;
}

/** Publica el documento y deja copia de la versión anterior. */
function publicar_documento(string $clave, string $htmlContenido, string $fecha): array
{
    $docs = documentos_disponibles();
    if (!isset($docs[$clave])) {
        return ['ok' => false, 'error' => 'Documento desconocido.'];
    }
    $doc = $docs[$clave];
    $destino = RAIZ_SITIO . '/' . $doc['archivo'];

    // Copia de seguridad de lo que había, por si hay que volver atrás.
    if (is_file($destino)) {
        $dirBak = RAIZ_SITIO . '/admin/versiones';
        if (!is_dir($dirBak)) @mkdir($dirBak, 0750, true);
        @copy($destino, $dirBak . '/' . date('Ymd-His') . '-' . $doc['archivo']);
    }

    $sangrado = implode("\n", array_map(fn($l) => '      ' . $l, explode("\n", $htmlContenido)));
    $pagina = construir_pagina($doc['titulo'], $doc['meta'], $sangrado, $fecha);

    if (@file_put_contents($destino, $pagina) === false) {
        return ['ok' => false, 'error' => 'No se pudo escribir ' . $doc['archivo'] . '. Revisa los permisos de la carpeta.'];
    }

    return ['ok' => true, 'archivo' => $doc['archivo'], 'bytes' => strlen($pagina)];
}

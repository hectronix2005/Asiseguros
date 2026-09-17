<?php
/**
 * Composición de los avisos de cotización.
 *
 * Se envían en multipart/alternative: una versión en texto plano y otra en HTML.
 * El cliente de correo elige. La de texto no es un descarte — muchos avisos se
 * leen desde el móvil con imágenes bloqueadas, y ahí el texto es lo que se ve.
 *
 * El HTML usa tablas y estilos en línea a propósito: los clientes de correo no
 * soportan flexbox ni hojas de estilo externas.
 */

declare(strict_types=1);

const COLOR_PRIMARIO = '#0f2441';
const COLOR_ACENTO   = '#4db7b3';

function esc(string $t): string {
    return htmlspecialchars($t, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Filas de la tabla de datos, omitiendo lo vacío. */
function filas_html(array $datos): string
{
    $out = '';
    foreach ($datos as $etiqueta => $valor) {
        if (trim((string)$valor) === '') continue;
        $out .= '<tr>'
              . '<td style="padding:8px 14px 8px 0;color:#94a3b8;font-size:13px;vertical-align:top;white-space:nowrap">'
              . esc((string)$etiqueta) . '</td>'
              . '<td style="padding:8px 0;color:#334155;font-size:14px;vertical-align:top">'
              . $valor . '</td></tr>';
    }
    return $out;
}

/**
 * Construye y envía el aviso.
 *
 * @param array $s   Datos de la solicitud
 * @param array $det Respuestas del segundo formulario (puede ir vacío)
 */
function enviar_aviso(string $para, array $s, array $det = []): bool
{
    $rad   = (string)($s['radicado'] ?? '');
    $tipo  = (string)($s['tipo_seguro'] ?? '');
    $nom   = (string)($s['nombre'] ?? '');
    $tel   = (string)($s['telefono'] ?? '');
    $mail  = (string)($s['email'] ?? '');
    $msj   = (string)($s['mensaje'] ?? '');
    $fecha = (string)($s['fecha_hora'] ?? '');
    $texto = (string)($s['texto_autorizacion'] ?? '');
    $ver   = (string)($s['version_autorizacion'] ?? '');

    $fechaLegible = $fecha !== '' ? date('d/m/Y \a \l\a\s H:i', strtotime($fecha)) : '';
    $wa = 'https://wa.me/57' . preg_replace('/\D/', '', $tel);

    /* ---------- versión en texto plano ---------- */
    $plano = "Nueva solicitud de cotización\n"
           . str_repeat('=', 40) . "\n\n"
           . "Radicado: {$rad}\n"
           . "Fecha:    {$fechaLegible}\n"
           . "Producto: {$tipo}\n\n"
           . "Nombre:   {$nom}\n"
           . "Teléfono: {$tel}\n"
           . "Correo:   {$mail}\n";
    if (trim($msj) !== '') $plano .= "\nMensaje:\n{$msj}\n";
    if ($det) {
        $plano .= "\nDatos del riesgo\n" . str_repeat('-', 40) . "\n";
        foreach ($det as $k => $v) {
            $plano .= '  ' . str_pad(ucfirst(str_replace('_', ' ', (string)$k)) . ':', 30) . $v . "\n";
        }
    }
    $plano .= "\nEscribir por WhatsApp: {$wa}\n"
            . "\n" . str_repeat('-', 40) . "\n"
            . "Constancia de autorización (Ley 1581 de 2012)\n"
            . "Otorgada el {$fechaLegible}. Versión del texto: {$ver}\n"
            . "Texto mostrado al titular:\n{$texto}\n";

    /* ---------- versión en HTML ---------- */
    $datos = [
        'Teléfono' => '<a href="' . esc($wa) . '" style="color:' . COLOR_PRIMARIO . '">' . esc($tel) . '</a>',
        'Correo'   => '<a href="mailto:' . esc($mail) . '" style="color:' . COLOR_PRIMARIO . '">' . esc($mail) . '</a>',
        'Producto' => esc($tipo),
    ];

    $bloqueDet = '';
    if ($det) {
        $filas = [];
        foreach ($det as $k => $v) {
            $filas[ucfirst(str_replace('_', ' ', (string)$k))] = esc((string)$v);
        }
        $bloqueDet =
            '<tr><td style="padding:22px 28px 0">'
          . '<div style="border-top:1px solid #e2e8f0;padding-top:18px">'
          . '<p style="margin:0 0 10px;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#94a3b8">Datos del riesgo</p>'
          . '<table cellpadding="0" cellspacing="0" style="width:100%">' . filas_html($filas) . '</table>'
          . '</div></td></tr>';
    }

    $bloqueMsj = '';
    if (trim($msj) !== '') {
        $bloqueMsj =
            '<tr><td style="padding:18px 28px 0">'
          . '<div style="background:#f8fafc;border-radius:8px;padding:14px 16px;font-size:14px;color:#334155;line-height:1.6">'
          . nl2br(esc($msj)) . '</div></td></tr>';
    }

    $html =
      '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    . '<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif">'
    . '<table cellpadding="0" cellspacing="0" style="width:100%;background:#f1f5f9;padding:28px 12px">'
    . '<tr><td align="center">'
    . '<table cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(15,36,65,.08)">'

    // cabecera
    . '<tr><td style="background:' . COLOR_PRIMARIO . ';padding:22px 28px">'
    . '<p style="margin:0;color:#7df89a;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600">Nueva solicitud</p>'
    . '<h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700">' . esc($nom) . '</h1>'
    . '<p style="margin:6px 0 0;color:rgba(255,255,255,.6);font-size:13px">'
    . 'Radicado <span style="color:' . COLOR_ACENTO . ';font-family:monospace">' . esc($rad) . '</span>'
    . ' &middot; ' . esc($fechaLegible) . '</p>'
    . '</td></tr>'

    // datos
    . '<tr><td style="padding:22px 28px 0">'
    . '<table cellpadding="0" cellspacing="0" style="width:100%">' . filas_html($datos) . '</table>'
    . '</td></tr>'

    . $bloqueMsj
    . $bloqueDet

    // botón
    . '<tr><td style="padding:24px 28px">'
    . '<a href="' . esc($wa) . '" style="display:inline-block;background:#25D366;color:#ffffff;'
    . 'text-decoration:none;padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600">'
    . 'Responder por WhatsApp</a>'
    . '</td></tr>'

    // constancia legal
    . '<tr><td style="padding:0 28px 24px">'
    . '<div style="background:#f8fafc;border-left:3px solid ' . COLOR_ACENTO . ';border-radius:6px;padding:14px 16px">'
    . '<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:' . COLOR_PRIMARIO . '">'
    . 'Constancia de autorización · Ley 1581 de 2012</p>'
    . '<p style="margin:0;font-size:12px;color:#64748b;line-height:1.6">'
    . 'Otorgada el ' . esc($fechaLegible) . '. Versión del texto: ' . esc($ver) . '.<br>'
    . '<span style="color:#94a3b8">' . esc($texto) . '</span></p>'
    . '</div></td></tr>'

    . '</table>'
    . '<p style="margin:16px 0 0;font-size:11px;color:#94a3b8">'
    . 'Enviado automáticamente desde www.asiseguros.com</p>'
    . '</td></tr></table></body></html>';

    /* ---------- ensamblado multipart ---------- */
    $sep = '=_asi_' . bin2hex(random_bytes(8));

    $cuerpo = "--{$sep}\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $plano . "\r\n"
            . "--{$sep}\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n\r\n"
            . $html . "\r\n"
            . "--{$sep}--\r\n";

    // El asunto lleva acentos: hay que codificarlo o llega ilegible.
    $asunto = '=?UTF-8?B?' . base64_encode("Cotización {$rad} — {$tipo}") . '?=';

    $cabeceras = "From: Sitio web AsiSeguros <no-responder@asiseguros.com>\r\n"
               . ($mail !== '' ? "Reply-To: " . $mail . "\r\n" : '')
               . "MIME-Version: 1.0\r\n"
               . "Content-Type: multipart/alternative; boundary=\"{$sep}\"\r\n";

    return @mail($para, $asunto, $cuerpo, $cabeceras);
}

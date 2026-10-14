<?php
/**
 * Reporte diario de solicitudes de cotización.
 *
 * Cada mañana llega a gerencia y al comercial un correo con las solicitudes
 * sin atender, las recibidas en las últimas 24 horas y el Excel completo
 * adjunto. Sirve de seguimiento y, de paso, de copia de seguridad fuera del
 * servidor: si el hosting fallara, la base completa está en los buzones.
 *
 * Lo dispara la tarea cron del hosting (ver reporte-diario.php) y también se
 * puede enviar a mano desde el panel.
 */

declare(strict_types=1);

require_once __DIR__ . '/solicitudes.php';
require_once dirname(__DIR__, 2) . '/api/correo.php';

const DESTINOS_REPORTE = ['hectorn.personal@gmail.com', 'comercial1@asiseguros.com'];
const HORA_REPORTE = 7;   // 7:00 a. m., hora de Bogotá

function marca_reporte(string $fecha): string
{
    return dir_datos() . '/.reporte-' . $fecha;
}

/** ¿Ya se envió el reporte automático de hoy? */
function reporte_enviado_hoy(): bool
{
    return is_file(marca_reporte(date('Y-m-d')));
}

function enviar_reporte(array $destinos): array
{
    $todas = solicitudes();
    $res = resumen_solicitudes($todas);
    $sinAtender = array_values(array_filter($todas, fn($s) => $s['sin_atender']));
    $recientes = array_values(array_filter($todas, fn($s) => ($s['horas_espera'] ?? 999) < 24));

    $hoy = date('d/m/Y');
    $asunto = 'Solicitudes AsiSeguros · ' . $hoy . ' · '
        . ($res['sin_atender'] ? $res['sin_atender'] . ' sin atender' : 'todas atendidas');

    $fila = function (array $s, bool $espera): string {
        $celdas = [
            $s['radicado'] ?? '',
            date('d/m H:i', strtotime((string)($s['fecha_hora'] ?? '')) ?: time()),
            $s['nombre'] ?? '', $s['telefono'] ?? '', $s['tipo_seguro'] ?? '',
            $espera ? hace((int)$s['horas_espera']) : (ESTADOS[$s['estado']] ?? ''),
        ];
        return '<tr>' . implode('', array_map(
            fn($c) => '<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:13px">' . esc((string)$c) . '</td>',
            $celdas)) . '</tr>';
    };
    $tabla = function (array $lista, bool $espera, string $vacio) use ($fila): string {
        if (!$lista) return '<p style="color:#64748b;font-size:14px">' . esc($vacio) . '</p>';
        $cab = ['Radicado', 'Llegó', 'Nombre', 'Teléfono', 'Producto', $espera ? 'Esperando' : 'Estado'];
        return '<table style="border-collapse:collapse;width:100%"><tr>'
            . implode('', array_map(fn($c) => '<th align="left" style="padding:6px 8px;font-size:12px;color:#64748b;border-bottom:2px solid #0f2441">' . $c . '</th>', $cab))
            . '</tr>' . implode('', array_map(fn($s) => $fila($s, $espera), $lista)) . '</table>';
    };

    $estados = implode(' · ', array_map(fn($k) => ESTADOS[$k] . ': ' . $res['estados'][$k], array_keys(ESTADOS)));

    $html = '<div style="font-family:Arial,sans-serif;color:#1e293b;max-width:720px">'
        . '<h2 style="color:' . COLOR_PRIMARIO . ';margin:0 0 4px">Solicitudes de cotización · ' . $hoy . '</h2>'
        . '<p style="margin:0 0 18px;color:#64748b">' . $res['total'] . ' en total · ' . esc($estados) . '</p>'
        . '<h3 style="color:#b45309;margin:18px 0 8px">Sin atender hace más de ' . HORAS_SIN_ATENDER . ' h (' . count($sinAtender) . ')</h3>'
        . $tabla($sinAtender, true, 'Ninguna: todas las solicitudes tienen seguimiento.')
        . '<h3 style="color:' . COLOR_PRIMARIO . ';margin:22px 0 8px">Recibidas en las últimas 24 h (' . count($recientes) . ')</h3>'
        . $tabla($recientes, false, 'No llegaron solicitudes nuevas.')
        . '<p style="margin:22px 0 0;font-size:13px;color:#64748b">El estado se actualiza en el panel: '
        . '<a href="https://www.asiseguros.com/admin/index.php?ver=solicitudes&amp;estado=sin_atender">ver solicitudes sin atender</a>. '
        . 'Adjunto va el Excel con todas las solicitudes, que también sirve de copia de seguridad.</p></div>';

    $texto = "Solicitudes de cotización · {$hoy}\n{$res['total']} en total · {$estados}\n\n"
        . 'Sin atender hace más de ' . HORAS_SIN_ATENDER . " h: " . count($sinAtender) . "\n"
        . implode("\n", array_map(fn($s) => "- {$s['radicado']} · {$s['nombre']} · {$s['telefono']} · {$s['tipo_seguro']} · " . hace((int)$s['horas_espera']), $sinAtender))
        . "\n\nRecibidas en las últimas 24 h: " . count($recientes) . "\n"
        . implode("\n", array_map(fn($s) => "- {$s['radicado']} · {$s['nombre']} · {$s['tipo_seguro']}", $recientes))
        . "\n\nPanel: https://www.asiseguros.com/admin/index.php?ver=solicitudes&estado=sin_atender\n";

    $mixto = 'mix_' . bin2hex(random_bytes(8));
    $alt   = 'alt_' . bin2hex(random_bytes(8));
    $adjunto = 'solicitudes-' . date('Y-m-d') . '.csv';
    $cuerpo = "--{$mixto}\r\n"
        . "Content-Type: multipart/alternative; boundary=\"{$alt}\"\r\n\r\n"
        . "--{$alt}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($texto))
        . "--{$alt}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--{$alt}--\r\n"
        . "--{$mixto}\r\n"
        . "Content-Type: text/csv; charset=UTF-8; name=\"{$adjunto}\"\r\n"
        . "Content-Disposition: attachment; filename=\"{$adjunto}\"\r\n"
        . "Content-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode(csv_solicitudes($todas)))
        . "--{$mixto}--\r\n";

    $cabeceras = "From: Sitio web AsiSeguros <" . REMITENTE_SOBRE . ">\r\n"
               . "MIME-Version: 1.0\r\n"
               . "Content-Type: multipart/mixed; boundary=\"{$mixto}\"\r\n";
    $asuntoMime = '=?UTF-8?B?' . base64_encode($asunto) . '?=';

    $enviados = [];
    foreach ($destinos as $d) {
        if (@mail($d, $asuntoMime, $cuerpo, $cabeceras, '-f ' . REMITENTE_SOBRE)) $enviados[] = $d;
    }
    return ['ok' => count($enviados) === count($destinos), 'enviados' => $enviados,
            'sin_atender' => count($sinAtender), 'total' => $res['total']];
}

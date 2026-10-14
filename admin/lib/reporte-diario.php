<?php
/**
 * Envío automático del reporte diario (ver reporte.php).
 *
 * Lo ejecuta scripts/desplegar.sh, que corre cada 10 minutos por cron. Este
 * script decide si toca: solo después de las 7:00 a. m. y una vez al día. Si
 * el cron se salta las 7:00, el reporte sale en la primera ejecución siguiente.
 *
 * Solo por línea de comandos: la carpeta lib no se sirve por HTTP y, aunque
 * se sirviera, aquí se rechaza.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

date_default_timezone_set('America/Bogota');
require __DIR__ . '/reporte.php';

if ((int)date('G') < HORA_REPORTE || reporte_enviado_hoy()) exit(0);

$r = enviar_reporte(DESTINOS_REPORTE);
if ($r['enviados']) {
    @file_put_contents(marca_reporte(date('Y-m-d')), date('c') . ' ' . implode(',', $r['enviados']) . "\n");
}
echo date('Y-m-d H:i:s') . ' reporte diario: ' . ($r['ok'] ? 'enviado' : 'FALLÓ') . ' a '
    . (implode(', ', $r['enviados']) ?: 'nadie') . " ({$r['total']} solicitudes, {$r['sin_atender']} sin atender)\n";

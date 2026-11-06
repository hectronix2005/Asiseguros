<?php
/**
 * Descarta, una sola vez, solicitudes que eran pruebas del sistema (6-nov-2026).
 * Las pasa al estado «Descartada»: salen del reporte diario y de los
 * pendientes. Es idempotente: si ya están descartadas no hace nada.
 *
 * Uso (lo llama desplegar.sh tras copiar el código):
 *   php descartar-pruebas.php <carpeta public_html>
 */

declare(strict_types=1);

$destino = $argv[1] ?? '';
if (!is_file($destino . '/admin/lib/solicitudes.php')) exit(1);
require $destino . '/admin/lib/solicitudes.php';

const RADICADOS = ['FDE43469', '132E6F7C', '6492C027'];

$historial = historial_seguimiento();
foreach (RADICADOS as $rad) {
    $h = $historial[$rad] ?? [];
    $ultimo = $h ? end($h) : null;
    if (($ultimo['estado'] ?? '') === 'descartada') continue;
    $r = registrar_estado($rad, 'descartada', 'Sistema (a pedido de Héctor)', 'Prueba del sistema, no es un lead real.');
    echo date('Y-m-d H:i:s') . " descartar $rad: " . ($r['ok'] ? 'ok' : $r['error']) . "\n";
}

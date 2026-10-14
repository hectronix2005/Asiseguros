<?php
/**
 * Seguimiento comercial de las solicitudes de cotización.
 *
 * Cada cambio de estado se agrega a seguimiento.csv (radicado, fecha, estado,
 * quién, nota). Nunca se edita ni se borra una línea: el estado vigente es el
 * último registrado y el resto es el historial. Así queda constancia de cuándo
 * se atendió cada solicitud y de quién dijo haberla atendido.
 *
 * Requiere solicitudes.php (dir_datos, leer_csv).
 */

declare(strict_types=1);

const ESTADOS = [
    'nueva'      => 'Nueva',
    'contactada' => 'Contactada',
    'cotizada'   => 'Cotizada',
    'cerrada'    => 'Cerrada',
];

/** Horas sin contacto a partir de las cuales una solicitud cuenta como «sin atender». */
const HORAS_SIN_ATENDER = 24;

function archivo_seguimiento(): string
{
    return dir_datos() . '/seguimiento.csv';
}

/** Historial por radicado, del cambio más antiguo al más reciente. */
function historial_seguimiento(): array
{
    $h = [];
    foreach (leer_csv(archivo_seguimiento()) as $f) {
        $r = $f['radicado'] ?? '';
        if ($r !== '' && isset(ESTADOS[$f['estado'] ?? ''])) $h[$r][] = $f;
    }
    return $h;
}

function registrar_estado(string $radicado, string $estado, string $quien, string $nota): array
{
    $quien = trim(str_replace(["\r", "\n", "\0"], ' ', $quien));
    $nota  = trim(str_replace(["\r", "\0"], '', $nota));
    if (!preg_match('/^[A-F0-9]{8}$/', $radicado)) return ['ok' => false, 'error' => 'Radicado no válido.'];
    if (!isset(ESTADOS[$estado]))                 return ['ok' => false, 'error' => 'Estado no válido.'];
    if (mb_strlen($quien) < 2)                    return ['ok' => false, 'error' => 'Escribe quién atendió la solicitud.'];

    $existe = false;
    foreach (leer_csv(dir_datos() . '/autorizaciones.csv') as $s) {
        if (($s['radicado'] ?? '') === $radicado) { $existe = true; break; }
    }
    if (!$existe) return ['ok' => false, 'error' => 'No existe una solicitud con ese radicado.'];

    $ruta = archivo_seguimiento();
    $nuevo = !is_file($ruta);
    $fh = @fopen($ruta, 'a');
    if ($fh === false) return ['ok' => false, 'error' => 'No se pudo guardar el seguimiento.'];
    if (flock($fh, LOCK_EX)) {
        if ($nuevo) {
            fwrite($fh, "\xEF\xBB\xBF");
            fputcsv($fh, ['radicado', 'fecha_hora', 'estado', 'quien', 'nota'], ',', '"', '\\');
        }
        fputcsv($fh, [$radicado, date('c'), $estado, mb_substr($quien, 0, 60), mb_substr($nota, 0, 300)], ',', '"', '\\');
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
    @chmod($ruta, 0640);
    return ['ok' => true];
}

/**
 * Añade a cada solicitud su estado vigente, el historial y si está sin
 * atender (nueva y con más de HORAS_SIN_ATENDER horas desde que llegó).
 */
function con_seguimiento(array $sol): array
{
    $h = historial_seguimiento();
    $ahora = time();
    foreach ($sol as &$s) {
        $hist = $h[$s['radicado'] ?? ''] ?? [];
        $ultimo = $hist ? end($hist) : null;
        $s['historial'] = $hist;
        $s['estado'] = $ultimo['estado'] ?? 'nueva';
        $s['estado_fecha'] = $ultimo['fecha_hora'] ?? '';
        $s['estado_quien'] = $ultimo['quien'] ?? '';
        $llegada = strtotime((string)($s['fecha_hora'] ?? '')) ?: $ahora;
        $s['horas_espera'] = (int)floor(($ahora - $llegada) / 3600);
        $s['sin_atender'] = $s['estado'] === 'nueva' && $s['horas_espera'] >= HORAS_SIN_ATENDER;
    }
    unset($s);
    return $sol;
}

/** «hace 3 h», «hace 2 días»: para leer de un vistazo cuánto lleva esperando. */
function hace(int $horas): string
{
    if ($horas < 1)  return 'hace menos de 1 h';
    if ($horas < 48) return 'hace ' . $horas . ' h';
    return 'hace ' . intdiv($horas, 24) . ' días';
}

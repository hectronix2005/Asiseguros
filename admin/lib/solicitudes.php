<?php
/**
 * Lectura de las solicitudes de cotización registradas.
 *
 * Los datos viven en dos CSV fuera de public_html: autorizaciones.csv, que es la
 * prueba de la autorización de tratamiento, y detalles.csv, con las respuestas
 * del segundo formulario. Se enlazan por radicado.
 *
 * Aquí solo se leen. Nada de este archivo modifica ni borra registros: son la
 * constancia que exige la Ley 1581 de 2012.
 */

declare(strict_types=1);

function dir_datos(): string
{
    $fuera = dirname(__DIR__, 3) . '/asiseguros-datos';
    if (is_dir($fuera)) return $fuera;
    return dirname(__DIR__, 2) . '/datos';
}

/** Lee un CSV con cabecera y devuelve filas asociativas. */
function leer_csv(string $ruta): array
{
    if (!is_file($ruta)) return [];
    $fh = @fopen($ruta, 'r');
    if ($fh === false) return [];

    $primera = fgets($fh);
    if ($primera === false) { fclose($fh); return []; }
    // Quitar el BOM que se escribe para que Excel lea bien los acentos
    $primera = preg_replace('/^\xEF\xBB\xBF/', '', $primera);
    $cab = str_getcsv($primera, ',', '"', '\\');

    $filas = [];
    while (($f = fgetcsv($fh, 0, ',', '"', '\\')) !== false) {
        if (count($f) === 1 && trim((string)$f[0]) === '') continue;
        $filas[] = array_combine($cab, array_pad(array_slice($f, 0, count($cab)), count($cab), ''));
    }
    fclose($fh);
    return $filas;
}

/**
 * Devuelve las solicitudes, de la más reciente a la más antigua, con el detalle
 * del segundo formulario ya incorporado.
 */
function solicitudes(string $busca = ''): array
{
    $dir = dir_datos();
    $sol = leer_csv($dir . '/autorizaciones.csv');

    $det = [];
    foreach (leer_csv($dir . '/detalles.csv') as $d) {
        $r = $d['radicado'] ?? '';
        if ($r === '') continue;
        $det[$r] = json_decode($d['respuestas'] ?? '[]', true) ?: [];
    }

    $proc = [];
    foreach (leer_csv($dir . '/procedencia.csv') as $p) {
        $r = $p['radicado'] ?? '';
        if ($r !== '') $proc[$r] = $p;
    }

    foreach ($sol as &$s) {
        $s['detalle'] = $det[$s['radicado'] ?? ''] ?? [];
        $s['procedencia'] = $proc[$s['radicado'] ?? ''] ?? [];
        $s['canal'] = canal($s['procedencia']);
    }
    unset($s);

    $sol = array_reverse($sol);

    if ($busca !== '') {
        $q = mb_strtolower($busca);
        $sol = array_values(array_filter($sol, function ($s) use ($q) {
            foreach (['radicado','nombre','telefono','email','tipo_seguro','mensaje'] as $c) {
                if (str_contains(mb_strtolower((string)($s[$c] ?? '')), $q)) return true;
            }
            return false;
        }));
    }

    return $sol;
}

/**
 * Traduce la procedencia registrada a un canal legible. Las solicitudes
 * anteriores a este registro no tienen procedencia y quedan «Sin dato».
 */
function canal(array $p): string
{
    if (!$p) return 'Sin dato';
    $medio = mb_strtolower((string)($p['medio'] ?? ''));
    $ref   = (string)($p['sitio_referente'] ?? '');

    if (($p['anuncio'] ?? '') === '1' || preg_match('/^(cpc|ppc|paid|pago|ads?|display)/', $medio)) return 'Anuncio pagado';
    if (($p['fuente'] ?? '') !== '') {
        if (str_contains($medio, 'mail') || str_contains($medio, 'correo')) return 'Correo';
        if (preg_match('/social|redes/', $medio)) return 'Redes sociales';
        return 'Campaña';
    }
    if ($ref === '') return 'Directo';
    if (preg_match('/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|search\.brave)\./', $ref)) return 'Buscador';
    if (preg_match('/(^|\.)(facebook|instagram|linkedin|lnkd|tiktok|t|x|twitter|youtube|whatsapp)\.(com|co|in)$/', $ref)) return 'Redes sociales';
    return 'Otro sitio: ' . $ref;
}

/** Resumen para las cifras de arriba. */
function resumen_solicitudes(array $sol): array
{
    $hoy = date('Y-m-d');
    $mes = date('Y-m');
    $r = ['total' => count($sol), 'hoy' => 0, 'mes' => 0, 'productos' => [], 'canales' => []];
    foreach ($sol as $s) {
        $f = substr((string)($s['fecha_hora'] ?? ''), 0, 10);
        if ($f === $hoy) $r['hoy']++;
        if (str_starts_with($f, $mes)) $r['mes']++;
        $p = (string)($s['tipo_seguro'] ?? '');
        if ($p !== '') $r['productos'][$p] = ($r['productos'][$p] ?? 0) + 1;
        $c = (string)($s['canal'] ?? 'Sin dato');
        $r['canales'][$c] = ($r['canales'][$c] ?? 0) + 1;
    }
    arsort($r['productos']);
    arsort($r['canales']);
    return $r;
}

/** Exporta a CSV lo que se esté viendo, con el detalle en columnas. */
function exportar_csv(array $sol): void
{
    $claves = [];
    foreach ($sol as $s) {
        foreach (array_keys($s['detalle'] ?? []) as $k) $claves[$k] = true;
    }
    $claves = array_keys($claves);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="solicitudes-' . date('Y-m-d') . '.csv"');

    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, array_merge(
        ['Radicado','Fecha','Nombre','Teléfono','Correo','Producto','Mensaje',
         'Autoriza','Versión autorización','Texto de la autorización',
         'Canal','Fuente (utm)','Medio (utm)','Campaña (utm)','Página de llegada','Sitio de origen'],
        array_map(fn($k) => ucfirst(str_replace('_',' ',$k)), $claves)
    ), ',', '"', '\\');

    foreach ($sol as $s) {
        $fila = [
            $s['radicado'] ?? '', $s['fecha_hora'] ?? '', $s['nombre'] ?? '',
            $s['telefono'] ?? '', $s['email'] ?? '', $s['tipo_seguro'] ?? '',
            $s['mensaje'] ?? '', $s['autoriza'] ?? '',
            $s['version_autorizacion'] ?? '', $s['texto_autorizacion'] ?? '',
            $s['canal'] ?? '', $s['procedencia']['fuente'] ?? '', $s['procedencia']['medio'] ?? '',
            $s['procedencia']['campana'] ?? '', $s['procedencia']['pagina_llegada'] ?? '',
            $s['procedencia']['sitio_referente'] ?? '',
        ];
        foreach ($claves as $k) $fila[] = $s['detalle'][$k] ?? '';
        fputcsv($out, $fila, ',', '"', '\\');
    }
    fclose($out);
    exit;
}

<?php
/**
 * Recepción de solicitudes de cotización y registro de la autorización de
 * tratamiento de datos personales.
 *
 * Por qué existe: la Ley 1581 de 2012 (art. 17 lit. b) y el Decreto 1377 de 2013
 * (art. 8) imponen al responsable el deber autónomo de conservar prueba de la
 * autorización. Un envío por WhatsApp no sirve: el texto es editable por el
 * usuario antes de enviarlo y, si no lo envía, no queda constancia alguna.
 *
 * Este endpoint deja la prueba del lado del servidor: fecha y hora, versión y
 * texto íntegro de la autorización mostrada, respuestas del titular y datos
 * técnicos de la conexión.
 */

declare(strict_types=1);

// Los avisos de PHP se registran pero no se imprimen: si salieran en el cuerpo
// corromperían el JSON de respuesta y el formulario mostraría un error falso.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

date_default_timezone_set('America/Bogota');

const CORREO_DESTINO    = 'contacto@asiseguros.com';
const LIMITE_POR_HORA   = 20;   // por IP
const VERSION_ESPERADA  = '2026-08-19';

/**
 * Dónde se guardan los registros.
 *
 * Primera opción: una carpeta hermana de public_html, fuera del árbol web. Así
 * el archivo con datos personales es inalcanzable por HTTP aunque el .htaccess
 * falle o el servidor cambie de configuración.
 *
 * Si el hosting lo impide (open_basedir, permisos), se usa public_html/datos,
 * que queda protegido por su propio .htaccess. Es el plan B, no el preferido.
 */
function directorioDatos(): string {
    $fuera = dirname(__DIR__, 2) . '/asiseguros-datos';
    if (is_dir($fuera) || @mkdir($fuera, 0750, true)) {
        if (is_writable($fuera)) return $fuera;
    }
    $dentro = __DIR__ . '/../datos';
    if (!is_dir($dentro)) { @mkdir($dentro, 0750, true); }
    return $dentro;
}

define('DIR_DATOS', directorioDatos());
define('ARCHIVO_REGISTRO', DIR_DATOS . '/autorizaciones.csv');

header('Content-Type: application/json; charset=utf-8');

function responder(int $codigo, array $cuerpo): void {
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'Método no permitido.']);
}

// Acepta JSON o formulario clásico, para que funcione con y sin JavaScript.
$crudo = file_get_contents('php://input');
$datos = [];
if ($crudo !== '' && str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'json')) {
    $datos = json_decode($crudo, true) ?: [];
} else {
    $datos = $_POST;
}

function campo(array $d, string $k, int $max = 300): string {
    $v = trim((string)($d[$k] ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}

// Trampa para robots: un campo oculto que una persona nunca rellena.
if (campo($datos, 'empresa_web') !== '') {
    responder(200, ['ok' => true, 'radicado' => 'n/a']);
}

$nombre      = campo($datos, 'nombre', 120);
$telefono    = campo($datos, 'telefono', 40);
$email       = campo($datos, 'email', 160);
$tipoSeguro  = campo($datos, 'tipo_seguro', 120);
$mensaje     = campo($datos, 'mensaje', 2000);
$autoriza    = in_array((string)($datos['autorizacion_datos'] ?? ''), ['1','on','true','si','sí'], true);
$textoAut    = campo($datos, 'autorizacion_texto', 1200);
$versionAut  = campo($datos, 'autorizacion_version', 40);

$errores = [];
if ($nombre === '')                                    $errores[] = 'nombre';
if ($telefono === '')                                  $errores[] = 'telefono';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))        $errores[] = 'email';
if ($tipoSeguro === '')                                $errores[] = 'tipo_seguro';
if ($errores) {
    responder(422, ['ok' => false, 'error' => 'Faltan datos obligatorios.', 'campos' => $errores]);
}

// Sin autorización no se recolecta. Es el punto central de todo esto.
if (!$autoriza) {
    responder(422, [
        'ok' => false,
        'error' => 'Debes autorizar el tratamiento de tus datos personales para continuar.',
        'campos' => ['autorizacion_datos'],
    ]);
}
if ($textoAut === '') {
    responder(422, ['ok' => false, 'error' => 'No se recibió el texto de la autorización.']);
}

$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
$ip = trim(explode(',', (string)$ip)[0]);

// Límite de envíos por IP y hora.
$marcas = DIR_DATOS . '/.tasa-' . md5($ip) . '.txt';
$ahora  = time();
$previas = is_file($marcas) ? array_filter(array_map('intval', file($marcas))) : [];
$previas = array_values(array_filter($previas, fn($t) => $t > $ahora - 3600));
if (count($previas) >= LIMITE_POR_HORA) {
    responder(429, ['ok' => false, 'error' => 'Demasiados envíos. Intenta de nuevo más tarde.']);
}
$previas[] = $ahora;
@file_put_contents($marcas, implode("\n", $previas));

// ---- Registro de la autorización -------------------------------------------
$radicado = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
$fechaISO = date('c');

$fila = [
    $radicado,
    $fechaISO,
    $nombre,
    $telefono,
    $email,
    $tipoSeguro,
    $mensaje,
    'SI',                       // autorización otorgada
    $versionAut !== '' ? $versionAut : VERSION_ESPERADA,
    $textoAut,                  // texto íntegro que se le mostró al titular
    $ip,
    mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
    mb_substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 300),
];

$nuevo = !is_file(ARCHIVO_REGISTRO);
$fh = @fopen(ARCHIVO_REGISTRO, 'a');
if ($fh === false) {
    error_log('AsiSeguros: no se pudo abrir ' . ARCHIVO_REGISTRO);
    responder(500, ['ok' => false, 'error' => 'No se pudo registrar la solicitud. Escríbenos por correo.']);
}
if (flock($fh, LOCK_EX)) {
    if ($nuevo) {
        fwrite($fh, "\xEF\xBB\xBF"); // BOM, para que Excel abra bien los acentos
        fputcsv($fh, ['radicado','fecha_hora','nombre','telefono','email','tipo_seguro',
                      'mensaje','autoriza','version_autorizacion','texto_autorizacion',
                      'ip','navegador','origen'], ',', '"', '\\');
    }
    fputcsv($fh, $fila, ',', '"', '\\');
    fflush($fh);
    flock($fh, LOCK_UN);
}
fclose($fh);
@chmod(ARCHIVO_REGISTRO, 0640);

// ---- Aviso por correo -------------------------------------------------------
$asunto = "Nueva cotización {$radicado} — {$tipoSeguro}";
$cuerpo = "Nueva solicitud de cotización desde www.asiseguros.com\n\n"
        . "Radicado: {$radicado}\n"
        . "Fecha:    {$fechaISO}\n\n"
        . "Nombre:   {$nombre}\n"
        . "Teléfono: {$telefono}\n"
        . "Correo:   {$email}\n"
        . "Interés:  {$tipoSeguro}\n"
        . "Mensaje:  " . ($mensaje !== '' ? $mensaje : '(sin mensaje)') . "\n\n"
        . "--- Constancia de autorización (Ley 1581 de 2012) ---\n"
        . "Autorización: OTORGADA\n"
        . "Versión del texto: " . ($versionAut !== '' ? $versionAut : VERSION_ESPERADA) . "\n"
        . "Texto mostrado al titular:\n{$textoAut}\n\n"
        . "IP: {$ip}\n"
        . "Navegador: " . ($_SERVER['HTTP_USER_AGENT'] ?? '') . "\n";

$cabeceras = "From: Sitio web AsiSeguros <no-responder@asiseguros.com>\r\n"
           . "Reply-To: {$nombre} <{$email}>\r\n"
           . "Content-Type: text/plain; charset=UTF-8\r\n";
@mail(CORREO_DESTINO, $asunto, $cuerpo, $cabeceras);

responder(200, [
    'ok' => true,
    'radicado' => $radicado,
    'mensaje' => 'Recibimos tu solicitud. Un asesor se comunicará contigo.',
]);

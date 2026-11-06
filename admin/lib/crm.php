<?php
/**
 * CRM comercial: usuarios del equipo, notas y motivos de cierre.
 *
 * Los datos viven fuera de public_html, junto a los de las solicitudes:
 *   comercial-usuarios.json  usuarios y hashes (nunca la contraseña)
 *   comercial-motivos.json   lista editable de motivos de pérdida
 *   crm-notas.csv            notas y cambios de estado; solo se agrega, no se edita
 *
 * Cada cambio de estado también se registra en seguimiento.csv (registrar_estado),
 * para que el panel de administración y el reporte diario vean lo mismo.
 *
 * Requiere solicitudes.php (dir_datos, leer_csv, solicitudes).
 */

declare(strict_types=1);

require_once __DIR__ . '/solicitudes.php';

const CRM_MAX_FALLOS = 5;
const CRM_BLOQUEO_SEG = 900;      // 15 minutos
const CRM_MAX_FALLOS_IP = 30;     // por IP y ventana; el bloqueo fino es por usuario
const CRM_CLAVE_MIN = 10;

const MOTIVOS_PREDETERMINADOS = [
    'Precio', 'Compró con otra aseguradora o agencia', 'No contesta', 'Ya tenía seguro',
    'No calificaba para el producto', 'Desistió', 'Otro',
];

/* ---------------- Almacenamiento ---------------- */

function crm_escribir_json(string $ruta, array $datos): bool
{
    $tmp = $ruta . '.tmp';
    $json = json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false || @file_put_contents($tmp, $json, LOCK_EX) === false) return false;
    @chmod($tmp, 0640);
    return @rename($tmp, $ruta);
}

function crm_leer_json(string $ruta): array
{
    if (!is_file($ruta)) return [];
    $d = json_decode((string)@file_get_contents($ruta), true);
    return is_array($d) ? $d : [];
}

/* ---------------- Usuarios ---------------- */

function crm_archivo_usuarios(): string { return dir_datos() . '/comercial-usuarios.json'; }

/** @return array<string, array> usuario => datos */
function crm_usuarios(): array { return crm_leer_json(crm_archivo_usuarios()); }

function crm_guardar_usuarios(array $u): bool { return crm_escribir_json(crm_archivo_usuarios(), $u); }

function crm_usuario_valido(string $u): bool { return (bool)preg_match('/^[a-z0-9._-]{3,30}$/', $u); }

function crm_limpiar_texto(string $t, int $max): string
{
    return mb_substr(trim(str_replace(["\r", "\n", "\0"], ' ', $t)), 0, $max);
}

function crm_crear_usuario(string $usuario, string $nombre, string $clave): array
{
    $usuario = strtolower(trim($usuario));
    $nombre = crm_limpiar_texto($nombre, 60);
    if (!crm_usuario_valido($usuario)) return ['ok' => false, 'error' => 'El usuario va en minúsculas, de 3 a 30 caracteres: letras, números, punto, guion o guion bajo.'];
    if (mb_strlen($nombre) < 2)        return ['ok' => false, 'error' => 'Escribe el nombre de la persona.'];
    if (mb_strlen($clave) < CRM_CLAVE_MIN) return ['ok' => false, 'error' => 'La contraseña temporal debe tener al menos ' . CRM_CLAVE_MIN . ' caracteres.'];
    $todos = crm_usuarios();
    if (isset($todos[$usuario])) return ['ok' => false, 'error' => 'Ya existe ese usuario.'];
    $todos[$usuario] = [
        'nombre' => $nombre, 'hash' => password_hash($clave, PASSWORD_DEFAULT),
        'activo' => true, 'debe_cambiar' => true, 'fallos' => 0, 'bloqueo_hasta' => 0,
        'creado' => date('c'),
    ];
    return crm_guardar_usuarios($todos) ? ['ok' => true] : ['ok' => false, 'error' => 'No se pudo guardar (la carpeta de datos no permite escribir).'];
}

function crm_actualizar_usuario(string $usuario, array $cambios): bool
{
    $todos = crm_usuarios();
    if (!isset($todos[$usuario])) return false;
    $todos[$usuario] = array_merge($todos[$usuario], $cambios);
    return crm_guardar_usuarios($todos);
}

/** El administrador fija una contraseña temporal; la persona la cambia al entrar. */
function crm_restablecer_clave(string $usuario, string $clave): array
{
    if (mb_strlen($clave) < CRM_CLAVE_MIN) return ['ok' => false, 'error' => 'La contraseña temporal debe tener al menos ' . CRM_CLAVE_MIN . ' caracteres.'];
    $ok = crm_actualizar_usuario($usuario, ['hash' => password_hash($clave, PASSWORD_DEFAULT),
        'debe_cambiar' => true, 'fallos' => 0, 'bloqueo_hasta' => 0]);
    return $ok ? ['ok' => true] : ['ok' => false, 'error' => 'No se pudo guardar.'];
}

function crm_cambiar_clave(string $usuario, string $actual, string $nueva): array
{
    $u = crm_usuarios()[$usuario] ?? null;
    if (!$u || !password_verify($actual, (string)$u['hash'])) return ['ok' => false, 'error' => 'La contraseña actual no es correcta.'];
    if (mb_strlen($nueva) < CRM_CLAVE_MIN) return ['ok' => false, 'error' => 'La nueva contraseña debe tener al menos ' . CRM_CLAVE_MIN . ' caracteres.'];
    if ($nueva === $actual) return ['ok' => false, 'error' => 'La nueva contraseña debe ser distinta de la actual.'];
    return crm_actualizar_usuario($usuario, ['hash' => password_hash($nueva, PASSWORD_DEFAULT), 'debe_cambiar' => false])
        ? ['ok' => true] : ['ok' => false, 'error' => 'No se pudo guardar.'];
}

/* ---------------- Autenticación ---------------- */

function crm_ip(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? ''); }

function crm_ip_bloqueada(): bool
{
    $d = crm_leer_json(dir_datos() . '/comercial-intentos.json');
    $r = $d[md5(crm_ip())] ?? null;
    return $r && time() - $r['t'] <= CRM_BLOQUEO_SEG && $r['n'] >= CRM_MAX_FALLOS_IP;
}

function crm_ip_registrar(bool $exito): void
{
    $ruta = dir_datos() . '/comercial-intentos.json';
    $d = crm_leer_json($ruta);
    $k = md5(crm_ip());
    $ahora = time();
    // Se limpian las IP viejas para que el archivo no crezca sin límite
    foreach ($d as $clave => $r) if ($ahora - ($r['t'] ?? 0) > CRM_BLOQUEO_SEG) unset($d[$clave]);
    if ($exito) {
        unset($d[$k]);
    } else {
        $d[$k] = ['n' => ($d[$k]['n'] ?? 0) + 1, 't' => $ahora];
    }
    crm_escribir_json($ruta, $d);
}

/**
 * Comprueba usuario y contraseña. El mensaje de error es el mismo si el usuario
 * no existe, está inactivo o la clave falla, para no revelar qué usuarios hay.
 * @return array{ok:bool, error?:string, usuario?:string}
 */
function crm_autenticar(string $usuario, string $clave): array
{
    $generico = ['ok' => false, 'error' => 'Usuario o contraseña incorrectos.'];
    if (crm_ip_bloqueada()) return ['ok' => false, 'error' => 'Demasiados intentos. Espera unos minutos.'];

    $usuario = strtolower(trim($usuario));
    $todos = crm_usuarios();
    $u = crm_usuario_valido($usuario) ? ($todos[$usuario] ?? null) : null;

    if ($u && (int)($u['bloqueo_hasta'] ?? 0) > time()) {
        return ['ok' => false, 'error' => 'Cuenta bloqueada por intentos fallidos. Espera ' . (int)ceil(($u['bloqueo_hasta'] - time()) / 60) . ' minutos o pide al administrador que la restablezca.'];
    }

    // Con usuario inexistente también se calcula un hash, para que el tiempo no delate si existe
    $hash = $u['hash'] ?? password_hash('sin-usuario', PASSWORD_DEFAULT);
    $bien = password_verify($clave, (string)$hash);

    if (!$u || empty($u['activo']) || !$bien) {
        crm_ip_registrar(false);
        if ($u) {
            $fallos = (int)($u['fallos'] ?? 0) + 1;
            crm_actualizar_usuario($usuario, ['fallos' => $fallos,
                'bloqueo_hasta' => $fallos >= CRM_MAX_FALLOS ? time() + CRM_BLOQUEO_SEG : 0]);
        }
        return $generico;
    }
    crm_ip_registrar(true);
    crm_actualizar_usuario($usuario, ['fallos' => 0, 'bloqueo_hasta' => 0, 'ultimo_acceso' => date('c')]);
    return ['ok' => true, 'usuario' => $usuario];
}

/* ---------------- Motivos de pérdida ---------------- */

function crm_motivos(): array
{
    $m = crm_leer_json(dir_datos() . '/comercial-motivos.json');
    $m = array_values(array_filter(array_map(fn($x) => crm_limpiar_texto((string)$x, 60), $m), fn($x) => $x !== ''));
    return $m ?: MOTIVOS_PREDETERMINADOS;
}

function crm_guardar_motivos(array $lista): array
{
    $lista = array_values(array_unique(array_filter(array_map(fn($x) => crm_limpiar_texto((string)$x, 60), $lista), fn($x) => $x !== '')));
    if (count($lista) < 2)  return ['ok' => false, 'error' => 'Deja al menos dos motivos.'];
    if (count($lista) > 20) return ['ok' => false, 'error' => 'Máximo 20 motivos.'];
    return crm_escribir_json(dir_datos() . '/comercial-motivos.json', $lista)
        ? ['ok' => true] : ['ok' => false, 'error' => 'No se pudo guardar.'];
}

/* ---------------- Notas y cambios de estado ---------------- */

const CRM_COLUMNAS = ['radicado', 'fecha_hora', 'usuario', 'nombre', 'tipo', 'estado', 'motivo', 'valor', 'comentario'];

function crm_archivo_notas(): string { return dir_datos() . '/crm-notas.csv'; }

/** Notas por radicado, de la más antigua a la más reciente. */
function crm_notas(): array
{
    $n = [];
    foreach (leer_csv(crm_archivo_notas()) as $f) {
        if (($f['radicado'] ?? '') !== '') $n[$f['radicado']][] = $f;
    }
    return $n;
}

/**
 * Agrega una nota o un cambio de estado.
 *  - Perdida: exige motivo de la lista y un comentario de al menos 10 caracteres.
 *  - Ganada: exige comentario (póliza, aseguradora…); el valor es opcional.
 */
function crm_registrar(string $radicado, string $usuario, string $nombre, string $tipo,
                       string $estado, string $motivo, string $valor, string $comentario): array
{
    $comentario = trim(str_replace(["\r", "\0"], '', $comentario));
    $motivo = crm_limpiar_texto($motivo, 60);
    $valorNum = preg_replace('/[^\d]/', '', $valor);

    if (!preg_match('/^[A-F0-9]{8}$/', $radicado)) return ['ok' => false, 'error' => 'Radicado no válido.'];
    if (!in_array($tipo, ['nota', 'estado'], true)) return ['ok' => false, 'error' => 'Acción no válida.'];
    if (mb_strlen($comentario) > 1000) return ['ok' => false, 'error' => 'El comentario es demasiado largo (máximo 1000 caracteres).'];

    if ($tipo === 'nota') {
        if (mb_strlen($comentario) < 3) return ['ok' => false, 'error' => 'Escribe la nota.'];
        $estado = $motivo = $valorNum = '';
    } else {
        if (!isset(ESTADOS[$estado])) return ['ok' => false, 'error' => 'Estado no válido.'];
        if ($estado === 'perdida') {
            if (!in_array($motivo, crm_motivos(), true)) return ['ok' => false, 'error' => 'Elige el motivo por el que no se logró el negocio.'];
            if (mb_strlen($comentario) < 10) return ['ok' => false, 'error' => 'Explica con un comentario (mínimo 10 caracteres) por qué no se logró.'];
        } else {
            $motivo = '';
        }
        if ($estado === 'descartada' && mb_strlen($comentario) < 3) {
            return ['ok' => false, 'error' => 'Anota por qué se descarta (prueba, duplicada, no es un cliente…).'];
        }
        if ($estado === 'ganada') {
            if (mb_strlen($comentario) < 3) return ['ok' => false, 'error' => 'Anota la póliza, la aseguradora o cómo se cerró el negocio.'];
            if (strlen($valorNum) > 12) return ['ok' => false, 'error' => 'El valor es demasiado grande.'];
        } else {
            $valorNum = '';
        }
        $r = registrar_estado($radicado, $estado, $nombre, mb_substr($comentario, 0, 300));
        if (!$r['ok']) return $r;
    }

    return crm_agregar_fila([$radicado, date('c'), $usuario, mb_substr($nombre, 0, 60), $tipo, $estado, $motivo, $valorNum, $comentario]);
}

function crm_agregar_fila(array $fila): array
{
    $ruta = crm_archivo_notas();
    $nuevo = !is_file($ruta);
    $fh = @fopen($ruta, 'a');
    if ($fh === false) return ['ok' => false, 'error' => 'No se pudo guardar la nota.'];
    if (flock($fh, LOCK_EX)) {
        if ($nuevo) {
            fwrite($fh, "\xEF\xBB\xBF");
            fputcsv($fh, CRM_COLUMNAS, ',', '"', '\\');
        }
        fputcsv($fh, $fila, ',', '"', '\\');
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
    @chmod($ruta, 0640);
    return ['ok' => true];
}

/* ---------------- Asignación de responsable ---------------- */

function crm_archivo_asignaciones(): string { return dir_datos() . '/crm-asignaciones.csv'; }

/** Responsable vigente por radicado: la última asignación gana ('' = sin responsable). */
function crm_asignaciones(): array
{
    $a = [];
    foreach (leer_csv(crm_archivo_asignaciones()) as $f) {
        if (($f['radicado'] ?? '') !== '') $a[$f['radicado']] = $f['responsable'] ?? '';
    }
    return array_filter($a, fn($r) => $r !== '');
}

/** Asigna la solicitud a un usuario activo del equipo, o la deja sin responsable (''). */
function crm_asignar(string $radicado, string $responsable, string $porUsuario, string $porNombre): array
{
    if (!preg_match('/^[A-F0-9]{8}$/', $radicado)) return ['ok' => false, 'error' => 'Radicado no válido.'];
    $equipo = crm_usuarios();
    if ($responsable !== '' && empty($equipo[$responsable]['activo'])) return ['ok' => false, 'error' => 'Esa persona no está activa en el equipo.'];
    $existe = false;
    foreach (leer_csv(dir_datos() . '/autorizaciones.csv') as $x) {
        if (($x['radicado'] ?? '') === $radicado) { $existe = true; break; }
    }
    if (!$existe) return ['ok' => false, 'error' => 'No existe una solicitud con ese radicado.'];
    if ((crm_asignaciones()[$radicado] ?? '') === $responsable) return ['ok' => true];

    $ruta = crm_archivo_asignaciones();
    $nuevo = !is_file($ruta);
    $fh = @fopen($ruta, 'a');
    if ($fh === false) return ['ok' => false, 'error' => 'No se pudo guardar la asignación.'];
    if (flock($fh, LOCK_EX)) {
        if ($nuevo) {
            fwrite($fh, "\xEF\xBB\xBF");
            fputcsv($fh, ['radicado', 'fecha_hora', 'por', 'responsable'], ',', '"', '\\');
        }
        fputcsv($fh, [$radicado, date('c'), $porUsuario, $responsable], ',', '"', '\\');
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
    @chmod($ruta, 0640);

    $texto = $responsable === '' ? 'Dejó la solicitud sin responsable.'
        : ($responsable === $porUsuario ? 'Tomó la solicitud.' : 'Asignó la solicitud a ' . $equipo[$responsable]['nombre'] . '.');
    return crm_agregar_fila([$radicado, date('c'), $porUsuario, mb_substr($porNombre, 0, 60), 'nota', '', '', '', $texto]);
}

/** Cifras del embudo: estados, cierre, motivos de pérdida y valor ganado. */
function crm_resumen(array $sol): array
{
    $r = ['estados' => array_fill_keys(array_keys(ESTADOS), 0), 'motivos' => [], 'valor_ganado' => 0, 'total' => count($sol)];
    $notas = crm_notas();
    foreach ($sol as $s) {
        $e = $s['estado'] ?? 'nueva';
        $r['estados'][$e]++;
        // Motivo y valor salen del último cambio a perdida / ganada de cada solicitud
        foreach (array_reverse($notas[$s['radicado'] ?? ''] ?? []) as $n) {
            if ($n['tipo'] === 'estado' && $n['estado'] === $e) {
                if ($e === 'perdida' && $n['motivo'] !== '') $r['motivos'][$n['motivo']] = ($r['motivos'][$n['motivo']] ?? 0) + 1;
                if ($e === 'ganada') $r['valor_ganado'] += (int)$n['valor'];
                break;
            }
        }
    }
    arsort($r['motivos']);
    $asig = crm_asignaciones();
    $r['equipo'] = [];
    foreach ($sol as $x) {
        $u = $asig[$x['radicado'] ?? ''] ?? '';
        $k = $u === '' ? '' : $u;
        $r['equipo'][$k] ??= ['asignadas' => 0, 'ganadas' => 0, 'perdidas' => 0];
        $r['equipo'][$k]['asignadas']++;
        if (($x['estado'] ?? '') === 'ganada')  $r['equipo'][$k]['ganadas']++;
        if (($x['estado'] ?? '') === 'perdida') $r['equipo'][$k]['perdidas']++;
    }
    $cerradas = $r['estados']['ganada'] + $r['estados']['perdida'];
    $r['cierre'] = $cerradas ? round($r['estados']['ganada'] * 100 / $cerradas) : null;
    return $r;
}

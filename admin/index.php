<?php
/**
 * Panel de documentos legales de AsiSeguros.
 *
 * Permite cargar los .docx de la política, los términos y los anexos, y
 * publicarlos como páginas del sitio sin tocar código.
 *
 * Seguridad: escribe archivos en la raíz del sitio, así que el acceso va con
 * contraseña. La contraseña se define en el primer acceso y se guarda como hash.
 */

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('America/Bogota');

require __DIR__ . '/lib/docx.php';
require __DIR__ . '/lib/paginas.php';
require __DIR__ . '/lib/solicitudes.php';

const ARCHIVO_CLAVE = __DIR__ . '/.clave.php';
const ARCHIVO_INTENTOS = __DIR__ . '/.intentos.json';
const MAX_INTENTOS = 5;
const BLOQUEO_SEG = 900;   // 15 minutos

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict',
    'secure' => (($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')]);
session_name('asiadmin');
session_start();

$aviso = null;
$tipoAviso = 'error';
$hayClave = is_file(ARCHIVO_CLAVE);

function hashGuardado(): ?string {
    if (!is_file(ARCHIVO_CLAVE)) return null;
    $v = include ARCHIVO_CLAVE;
    return is_string($v) ? $v : null;
}

function ip(): string {
    $x = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
    return trim(explode(',', (string)$x)[0]);
}

function intentos(): array {
    if (!is_file(ARCHIVO_INTENTOS)) return [];
    return json_decode((string)file_get_contents(ARCHIVO_INTENTOS), true) ?: [];
}

function registrarIntento(bool $exito): void {
    $d = intentos();
    $k = md5(ip());
    $ahora = time();
    if ($exito) { unset($d[$k]); }
    else {
        $d[$k] = $d[$k] ?? ['n' => 0, 't' => $ahora];
        if ($ahora - $d[$k]['t'] > BLOQUEO_SEG) $d[$k] = ['n' => 0, 't' => $ahora];
        $d[$k]['n']++; $d[$k]['t'] = $ahora;
    }
    @file_put_contents(ARCHIVO_INTENTOS, json_encode($d));
}

function bloqueado(): int {
    $d = intentos();
    $k = md5(ip());
    if (!isset($d[$k])) return 0;
    if ($d[$k]['n'] < MAX_INTENTOS) return 0;
    $restante = BLOQUEO_SEG - (time() - $d[$k]['t']);
    return max(0, $restante);
}

/* ---------------- Acciones ---------------- */
$accion = $_POST['accion'] ?? '';

if ($accion === 'definir_clave' && !$hayClave) {
    $c1 = (string)($_POST['clave'] ?? '');
    $c2 = (string)($_POST['clave2'] ?? '');
    if (mb_strlen($c1) < 10) {
        $aviso = 'La contraseña debe tener al menos 10 caracteres.';
    } elseif ($c1 !== $c2) {
        $aviso = 'Las dos contraseñas no coinciden.';
    } else {
        $hash = password_hash($c1, PASSWORD_DEFAULT);
        $contenido = "<?php\n// Generado por el panel. No editar a mano.\nreturn " . var_export($hash, true) . ";\n";
        if (@file_put_contents(ARCHIVO_CLAVE, $contenido) === false) {
            $aviso = 'No se pudo guardar la contraseña. Revisa los permisos de la carpeta admin.';
        } else {
            @chmod(ARCHIVO_CLAVE, 0640);
            $_SESSION['ok'] = true;
            $hayClave = true;
            $aviso = 'Contraseña creada. Ya puedes cargar los documentos.';
            $tipoAviso = 'ok';
        }
    }
}

if ($accion === 'entrar') {
    $espera = bloqueado();
    if ($espera > 0) {
        $aviso = 'Demasiados intentos fallidos. Espera ' . ceil($espera / 60) . ' minutos.';
    } elseif (password_verify((string)($_POST['clave'] ?? ''), (string)hashGuardado())) {
        session_regenerate_id(true);
        $_SESSION['ok'] = true;
        registrarIntento(true);
    } else {
        registrarIntento(false);
        $aviso = 'Contraseña incorrecta.';
    }
}

if ($accion === 'salir') {
    $_SESSION = [];
    session_destroy();
    header('Location: index.php');
    exit;
}

$dentro = !empty($_SESSION['ok']);

// Pestaña activa: documentos (por defecto) o solicitudes
$vista = ($_GET['ver'] ?? '') === 'solicitudes' ? 'solicitudes' : 'documentos';
$busca = trim((string)($_GET['q'] ?? ''));

if ($dentro && ($_GET['exportar'] ?? '') === '1') {
    exportar_csv(solicitudes($busca));
}

if ($accion === 'publicar' && $dentro) {
    $clave = (string)($_POST['documento'] ?? '');
    $docs = documentos_disponibles();

    if (!isset($docs[$clave])) {
        $aviso = 'Documento no válido.';
    } elseif (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        $codigos = [
            UPLOAD_ERR_INI_SIZE => 'El archivo supera el tamaño permitido por el servidor.',
            UPLOAD_ERR_FORM_SIZE => 'El archivo es demasiado grande.',
            UPLOAD_ERR_PARTIAL => 'La carga se interrumpió. Inténtalo otra vez.',
            UPLOAD_ERR_NO_FILE => 'No seleccionaste ningún archivo.',
        ];
        $aviso = $codigos[$_FILES['archivo']['error'] ?? -1] ?? 'No se pudo recibir el archivo.';
    } else {
        $tmp = $_FILES['archivo']['tmp_name'];
        $nombre = (string)$_FILES['archivo']['name'];

        if (strtolower(pathinfo($nombre, PATHINFO_EXTENSION)) !== 'docx') {
            $aviso = 'El archivo debe ser .docx. Si lo tienes en PDF, ábrelo en Word y guárdalo como .docx.';
        } elseif ($_FILES['archivo']['size'] > 8 * 1024 * 1024) {
            $aviso = 'El archivo supera los 8 MB.';
        } else {
            // Envuelto a propósito: un fallo al convertir debe mostrarse como
            // aviso, nunca como un error 500 que deje el panel inservible.
            try {
                $r = docx_a_html($tmp);
            } catch (Throwable $e) {
                error_log('AsiSeguros panel: ' . $e->getMessage());
                $r = ['ok' => false, 'error' => 'No se pudo leer el documento: ' . $e->getMessage()];
            }
            if (!$r['ok']) {
                $aviso = $r['error'];
            } else {
                $fecha = trim((string)($_POST['fecha'] ?? '')) ?: strftime_es();
                $pub = publicar_documento($clave, $r['html'], $fecha);
                if (!$pub['ok']) {
                    $aviso = $pub['error'];
                } else {
                    // Se guarda el .docx original como respaldo de lo que aprobó legal.
                    $dirOrig = __DIR__ . '/originales';
                    if (!is_dir($dirOrig)) @mkdir($dirOrig, 0750, true);
                    @move_uploaded_file($tmp, $dirOrig . '/' . date('Ymd-His') . '-' . preg_replace('/[^A-Za-z0-9._-]/', '_', $nombre));

                    $aviso = 'Publicado en <strong>' . htmlspecialchars($pub['archivo']) . '</strong>. '
                           . '<a href="../' . htmlspecialchars($pub['archivo']) . '" target="_blank">Ver la página</a>.';
                    $tipoAviso = 'ok';
                }
            }
        }
    }
}

function strftime_es(): string {
    $meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
              'septiembre','octubre','noviembre','diciembre'];
    return $meses[(int)date('n') - 1] . ' de ' . date('Y');
}

function estadoDocumento(array $doc): array {
    $ruta = RAIZ_SITIO . '/' . $doc['archivo'];
    if (!is_file($ruta)) return ['existe' => false, 'fecha' => null];
    return ['existe' => true, 'fecha' => date('d/m/Y H:i', (int)filemtime($ruta))];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Documentos legales · AsiSeguros</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --primary:#0f2441; --secondary:#7df89a; --accent:#4db7b3; --gray-50:#f8fafc;
          --gray-200:#e2e8f0; --gray-400:#94a3b8; --gray-500:#64748b; --gray-600:#475569; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Montserrat,system-ui,sans-serif; background:var(--gray-50); color:var(--gray-600); line-height:1.6; }
  .barra { background:var(--primary); color:#fff; padding:16px 0; }
  .cont { max-width:820px; margin:0 auto; padding:0 20px; }
  .barra .cont { display:flex; justify-content:space-between; align-items:center; }
  .barra h1 { font-size:1.05rem; font-weight:700; }
  .barra a, .barra button { color:rgba(255,255,255,.75); font-size:.82rem; background:none; border:0; cursor:pointer; text-decoration:none; font-family:inherit; }
  main { padding:36px 0 60px; }
  .aviso { padding:14px 16px; border-radius:10px; margin-bottom:24px; font-size:.9rem; }
  .aviso.ok { background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; }
  .aviso.error { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; }
  .aviso a { color:inherit; }
  .tarjeta { background:#fff; border:1px solid var(--gray-200); border-radius:14px; padding:24px; margin-bottom:18px; }
  .tarjeta h2 { font-size:1.05rem; color:var(--primary); margin-bottom:6px; }
  .tarjeta .ayuda { font-size:.82rem; color:var(--gray-400); margin-bottom:16px; }
  .estado { font-size:.78rem; color:var(--gray-400); margin-bottom:14px; }
  .estado b { color:var(--accent); }
  label { display:block; font-size:.82rem; font-weight:600; color:var(--primary); margin-bottom:6px; }
  input[type=file], input[type=text], input[type=password] {
    width:100%; padding:10px 12px; border:1px solid var(--gray-200); border-radius:8px;
    font-family:inherit; font-size:.9rem; margin-bottom:14px; background:#fff; }
  .fila { display:flex; gap:14px; flex-wrap:wrap; }
  .fila > div { flex:1; min-width:200px; }
  .btn { background:var(--primary); color:#fff; border:0; padding:11px 20px; border-radius:8px;
         font-family:inherit; font-weight:600; font-size:.88rem; cursor:pointer; }
  .btn:hover { background:#1a3a5c; }
  .intro { font-size:.9rem; margin-bottom:26px; }
  .nota { font-size:.8rem; color:var(--gray-400); margin-top:22px; line-height:1.7; }
  .pestanas { display:flex; gap:4px; margin-bottom:24px; border-bottom:1px solid var(--gray-200); }
  .pestanas a { padding:10px 18px; font-size:.88rem; font-weight:600; color:var(--gray-500);
                text-decoration:none; border-bottom:2px solid transparent; margin-bottom:-1px; }
  .pestanas a.activa { color:var(--primary); border-bottom-color:var(--accent); }
  .cifras { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:22px; }
  .cifra { background:#fff; border:1px solid var(--gray-200); border-radius:12px; padding:16px; text-align:center; }
  .cifra b { display:block; font-size:1.6rem; color:var(--primary); line-height:1.2; }
  .cifra span { font-size:.75rem; color:var(--gray-400); text-transform:uppercase; letter-spacing:.5px; }
  .barra-busca { display:flex; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
  .barra-busca input { flex:1; min-width:200px; margin:0; }
  .btn-sec { background:#fff; color:var(--primary); border:1px solid var(--gray-200);
             padding:11px 18px; border-radius:8px; font-family:inherit; font-weight:600;
             font-size:.85rem; cursor:pointer; text-decoration:none; display:inline-block; }
  .sol { background:#fff; border:1px solid var(--gray-200); border-radius:12px; padding:18px 20px; margin-bottom:12px; }
  .sol-cab { display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:10px; }
  .sol-cab b { font-size:1rem; color:var(--primary); }
  .sol-rad { font-family:ui-monospace,monospace; font-size:.76rem; color:var(--accent); }
  .sol-fecha { font-size:.76rem; color:var(--gray-400); }
  .sol-prod { display:inline-block; background:var(--gray-50); border:1px solid var(--gray-200);
              border-radius:20px; padding:3px 12px; font-size:.76rem; color:var(--gray-600); margin-bottom:10px; }
  .sol-datos { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:6px 18px; font-size:.84rem; }
  .sol-datos div { color:var(--gray-600); }
  .sol-datos span { color:var(--gray-400); }
  .sol-msg { margin-top:10px; padding:10px 12px; background:var(--gray-50); border-radius:8px; font-size:.84rem; }
  .sol-det { margin-top:12px; padding-top:12px; border-top:1px dashed var(--gray-200); }
  .sol-det h4 { font-size:.76rem; text-transform:uppercase; letter-spacing:.5px; color:var(--gray-400); margin-bottom:8px; }
  .sol-aut { margin-top:10px; font-size:.72rem; color:var(--gray-400); line-height:1.6; }
  .vacio { background:#fff; border:1px dashed var(--gray-200); border-radius:12px; padding:40px 20px; text-align:center; color:var(--gray-400); font-size:.9rem; }
</style>
</head>
<body>

<div class="barra">
  <div class="cont">
    <h1>Documentos legales · AsiSeguros</h1>
    <?php if ($dentro): ?>
      <form method="post"><input type="hidden" name="accion" value="salir"><button>Cerrar sesión</button></form>
    <?php endif; ?>
  </div>
</div>

<main class="cont">

<?php if ($aviso): ?>
  <div class="aviso <?= $tipoAviso ?>"><?= $aviso ?></div>
<?php endif; ?>

<?php if (!$hayClave): ?>
  <div class="tarjeta">
    <h2>Primer acceso</h2>
    <p class="ayuda">Define la contraseña que protegerá este panel. Solo se pide una vez.</p>
    <form method="post">
      <input type="hidden" name="accion" value="definir_clave">
      <label for="c1">Contraseña (mínimo 10 caracteres)</label>
      <input type="password" id="c1" name="clave" required autocomplete="new-password">
      <label for="c2">Repetir contraseña</label>
      <input type="password" id="c2" name="clave2" required autocomplete="new-password">
      <button class="btn">Crear contraseña</button>
    </form>
  </div>

<?php elseif (!$dentro): ?>
  <div class="tarjeta">
    <h2>Acceso</h2>
    <form method="post">
      <input type="hidden" name="accion" value="entrar">
      <label for="cl">Contraseña</label>
      <input type="password" id="cl" name="clave" required autocomplete="current-password">
      <button class="btn">Entrar</button>
    </form>
  </div>

<?php else: ?>

  <div class="pestanas">
    <a href="?ver=documentos" class="<?= $vista==='documentos'?'activa':'' ?>">Documentos legales</a>
    <a href="?ver=solicitudes" class="<?= $vista==='solicitudes'?'activa':'' ?>">Solicitudes de cotización</a>
  </div>

<?php if ($vista === 'solicitudes'):
      $lista = solicitudes($busca);
      $res   = resumen_solicitudes(solicitudes()); ?>

  <div class="cifras">
    <div class="cifra"><b><?= $res['total'] ?></b><span>en total</span></div>
    <div class="cifra"><b><?= $res['mes'] ?></b><span>este mes</span></div>
    <div class="cifra"><b><?= $res['hoy'] ?></b><span>hoy</span></div>
  </div>

  <form method="get" class="barra-busca">
    <input type="hidden" name="ver" value="solicitudes">
    <input type="text" name="q" value="<?= htmlspecialchars($busca) ?>"
           placeholder="Buscar por nombre, radicado, correo o producto…">
    <button class="btn">Buscar</button>
    <?php if ($busca !== ''): ?><a href="?ver=solicitudes" class="btn-sec">Limpiar</a><?php endif; ?>
    <?php if ($lista): ?>
      <a href="?ver=solicitudes&amp;q=<?= urlencode($busca) ?>&amp;exportar=1" class="btn-sec">Descargar Excel</a>
    <?php endif; ?>
  </form>

  <?php if (!$lista): ?>
    <div class="vacio">
      <?= $busca !== '' ? 'No hay solicitudes que coincidan con esa búsqueda.'
                        : 'Todavía no hay solicitudes. Aparecerán aquí en cuanto alguien use el formulario del sitio.' ?>
    </div>
  <?php else: foreach ($lista as $s):
        $f = strtotime((string)($s['fecha_hora'] ?? '')); ?>
    <div class="sol">
      <div class="sol-cab">
        <b><?= htmlspecialchars($s['nombre'] ?? '') ?></b>
        <span>
          <span class="sol-rad"><?= htmlspecialchars($s['radicado'] ?? '') ?></span>
          <span class="sol-fecha"> · <?= $f ? date('d/m/Y H:i', $f) : '' ?></span>
        </span>
      </div>
      <div class="sol-prod"><?= htmlspecialchars($s['tipo_seguro'] ?? '') ?></div>
      <div class="sol-datos">
        <div><span>Teléfono:</span>
          <a href="https://wa.me/57<?= preg_replace('/\D/','',(string)($s['telefono'] ?? '')) ?>"
             target="_blank" rel="noopener"><?= htmlspecialchars($s['telefono'] ?? '') ?></a></div>
        <div><span>Correo:</span>
          <a href="mailto:<?= htmlspecialchars($s['email'] ?? '') ?>"><?= htmlspecialchars($s['email'] ?? '') ?></a></div>
      </div>
      <?php if (trim((string)($s['mensaje'] ?? '')) !== ''): ?>
        <div class="sol-msg"><?= nl2br(htmlspecialchars($s['mensaje'])) ?></div>
      <?php endif; ?>
      <?php if (!empty($s['detalle'])): ?>
        <div class="sol-det">
          <h4>Datos del riesgo</h4>
          <div class="sol-datos">
            <?php foreach ($s['detalle'] as $k => $v): ?>
              <div><span><?= htmlspecialchars(ucfirst(str_replace('_',' ',(string)$k))) ?>:</span>
                   <?= htmlspecialchars((string)$v) ?></div>
            <?php endforeach; ?>
          </div>
        </div>
      <?php endif; ?>
      <p class="sol-aut">
        Autorización de tratamiento de datos: <strong><?= htmlspecialchars($s['autoriza'] ?? '') ?></strong>
        · versión <?= htmlspecialchars($s['version_autorizacion'] ?? '') ?>
        <?= $f ? ' · registrada el ' . date('d/m/Y \a \l\a\s H:i', $f) : '' ?>
      </p>
    </div>
  <?php endforeach; endif; ?>

  <p class="nota">
    Estos registros son la prueba de la autorización que exige la Ley 1581 de 2012.
    Se guardan fuera de la carpeta web y no se pueden editar ni borrar desde aquí.
  </p>

<?php else: ?>
  <p class="intro">
    Carga el documento en <strong>.docx</strong> y se publica como página del sitio,
    con el mismo diseño. La versión anterior se guarda por si hay que volver atrás.
  </p>

  <?php foreach (documentos_disponibles() as $clave => $doc):
        $est = estadoDocumento($doc); ?>
    <div class="tarjeta">
      <h2><?= htmlspecialchars($doc['titulo']) ?></h2>
      <p class="ayuda"><?= htmlspecialchars($doc['ayuda']) ?></p>
      <p class="estado">
        <?php if ($est['existe']): ?>
          Publicado · <code><?= htmlspecialchars($doc['archivo']) ?></code> · actualizado el <b><?= $est['fecha'] ?></b>
        <?php else: ?>
          Todavía no publicado
        <?php endif; ?>
      </p>
      <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="accion" value="publicar">
        <input type="hidden" name="documento" value="<?= $clave ?>">
        <div class="fila">
          <div>
            <label>Archivo .docx</label>
            <input type="file" name="archivo" accept=".docx" required>
          </div>
          <div>
            <label>Fecha de actualización</label>
            <input type="text" name="fecha" value="<?= htmlspecialchars(strftime_es()) ?>">
          </div>
        </div>
        <button class="btn">Publicar</button>
      </form>
    </div>
  <?php endforeach; ?>

  <p class="nota">
    El panel convierte encabezados, párrafos, listas, negritas y tablas. Ignora
    los colores y tipografías de Word para que el documento herede el diseño del
    sitio. Después de publicar, conviene abrir la página y revisar que la
    estructura quedó bien.
  </p>
<?php endif; // vista ?>
<?php endif; // sesión ?>

</main>
</body>
</html>

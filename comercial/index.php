<?php
/**
 * Modo comercial de AsiSeguros: CRM para el equipo de ventas.
 *
 * Cada persona entra con su usuario (los crea el administrador desde /admin),
 * ve las solicitudes de cotización, deja notas y cambia el estado con su
 * comentario: por qué se perdió un negocio, cómo se ganó, etc.
 *
 * Seguridad: sin registro público, contraseñas solo como hash, bloqueo por usuario
 * y por IP, CSRF en cada envío, cookie de sesión HttpOnly y SameSite=Strict, y el
 * usuario se vuelve a leer en cada petición (desactivarlo corta su sesión al instante).
 */

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('America/Bogota');

require __DIR__ . '/../admin/lib/crm.php';

header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'path' => '/comercial',
    'secure' => (($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')]);
session_name('asicom');
session_start();

if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
function token_valido(): bool {
    return hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_POST['csrf'] ?? ''));
}
function e($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function fecha(string $iso): string { $t = strtotime($iso); return $t ? date('d/m/Y H:i', $t) : ''; }
function pesos(int $v): string { return '$ ' . number_format($v, 0, ',', '.'); }

$aviso = $_SESSION['aviso'] ?? null;
$tipoAviso = $_SESSION['tipo_aviso'] ?? 'ok';
unset($_SESSION['aviso'], $_SESSION['tipo_aviso']);

function volver(string $url, ?string $msg = null, string $tipo = 'ok') {
    if ($msg !== null) { $_SESSION['aviso'] = $msg; $_SESSION['tipo_aviso'] = $tipo; }
    header('Location: ' . $url);
    exit;
}

/* ---------------- Acciones ---------------- */
$accion = (string)($_POST['accion'] ?? '');

if ($accion === 'entrar') {
    if (!token_valido()) {
        $aviso = 'La página caducó. Vuelve a intentarlo.'; $tipoAviso = 'error';
    } else {
        $r = crm_autenticar((string)($_POST['usuario'] ?? ''), (string)($_POST['clave'] ?? ''));
        if ($r['ok']) {
            session_regenerate_id(true);
            $_SESSION['usuario'] = $r['usuario'];
            volver('/comercial/');
        }
        $aviso = $r['error']; $tipoAviso = 'error';
    }
}

if ($accion === 'salir') {
    $_SESSION = [];
    session_destroy();
    header('Location: /comercial/');
    exit;
}

// El usuario se lee del archivo en cada petición: si lo desactivan, la sesión deja de valer
$yo = null; $miUsuario = (string)($_SESSION['usuario'] ?? '');
if ($miUsuario !== '') {
    $yo = crm_usuarios()[$miUsuario] ?? null;
    if (!$yo || empty($yo['activo'])) { $_SESSION = []; $yo = null; $miUsuario = ''; }
}

if ($yo && $accion === 'cambiar_clave') {
    if (!token_valido()) {
        $aviso = 'La página caducó. Vuelve a intentarlo.'; $tipoAviso = 'error';
    } elseif ((string)($_POST['nueva'] ?? '') !== (string)($_POST['nueva2'] ?? '')) {
        $aviso = 'Las dos contraseñas nuevas no coinciden.'; $tipoAviso = 'error';
    } else {
        $r = crm_cambiar_clave($miUsuario, (string)($_POST['actual'] ?? ''), (string)($_POST['nueva'] ?? ''));
        if ($r['ok']) { session_regenerate_id(true); volver('/comercial/', 'Contraseña actualizada.'); }
        $aviso = $r['error']; $tipoAviso = 'error';
    }
}

$obligadoCambiar = $yo && !empty($yo['debe_cambiar']);

if ($yo && !$obligadoCambiar && $accion === 'registrar') {
    $rad = (string)($_POST['radicado'] ?? '');
    if (!token_valido()) {
        volver('/comercial/?r=' . urlencode($rad), 'La página caducó. Vuelve a intentarlo.', 'error');
    }
    $r = crm_registrar($rad, $miUsuario, (string)$yo['nombre'], (string)($_POST['tipo'] ?? ''),
        (string)($_POST['estado'] ?? ''), (string)($_POST['motivo'] ?? ''), (string)($_POST['valor'] ?? ''),
        (string)($_POST['comentario'] ?? ''));
    if ($r['ok']) volver('/comercial/?r=' . urlencode($rad), 'Guardado.');
    // Con error se queda en la ficha y se muestra el mensaje
    $_GET['r'] = $rad;
    $aviso = $r['error']; $tipoAviso = 'error';
}

if ($yo && !$obligadoCambiar && $accion === 'asignar') {
    $rad = (string)($_POST['radicado'] ?? '');
    if (!token_valido()) {
        volver('/comercial/?r=' . urlencode($rad), 'La página caducó. Vuelve a intentarlo.', 'error');
    }
    $r = crm_asignar($rad, (string)($_POST['responsable'] ?? ''), $miUsuario, (string)$yo['nombre']);
    volver('/comercial/?r=' . urlencode($rad), $r['ok'] ? 'Responsable actualizado.' : $r['error'], $r['ok'] ? 'ok' : 'error');
}

/* ---------------- Datos de la vista ---------------- */
$vista = 'lista'; $s = null;
if ($yo && !$obligadoCambiar) {
    $todas = solicitudes();
    if (isset($_GET['r'])) {
        foreach ($todas as $x) if (($x['radicado'] ?? '') === (string)$_GET['r']) { $s = $x; break; }
        $vista = $s ? 'ficha' : 'lista';
    } elseif (($_GET['ver'] ?? '') === 'resumen') {
        $vista = 'resumen';
    }
}
$equipo = $yo ? crm_usuarios() : [];
$asignadas = $yo ? crm_asignaciones() : [];
$resp = (string)($_GET['resp'] ?? '');
if ($resp !== 'mias' && $resp !== 'sin') $resp = '';
$busca = trim((string)($_GET['q'] ?? ''));
$filtro = (string)($_GET['estado'] ?? '');
if ($filtro !== 'sin_atender' && !isset(ESTADOS[$filtro])) $filtro = '';
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Modo comercial · AsiSeguros</title>
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --primary:#0f2441; --accent:#4db7b3; --gray-50:#f8fafc; --gray-200:#e2e8f0;
          --gray-400:#94a3b8; --gray-500:#64748b; --gray-600:#475569; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Montserrat,system-ui,sans-serif; background:var(--gray-50); color:var(--gray-600); line-height:1.55; }
  a { color:var(--primary); }
  .barra { background:var(--primary); color:#fff; padding:14px 0; }
  .cont { max-width:900px; margin:0 auto; padding:0 20px; }
  .barra .cont { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; }
  .barra h1 { font-size:1.05rem; font-weight:700; }
  .barra nav { display:flex; gap:16px; align-items:center; font-size:.82rem; }
  .barra a, .barra button { color:rgba(255,255,255,.8); background:none; border:0; cursor:pointer; text-decoration:none; font:inherit; font-size:.82rem; }
  .barra a.act { color:#fff; font-weight:700; }
  main { padding:28px 0 60px; }
  .aviso { padding:12px 16px; border-radius:10px; margin-bottom:20px; font-size:.9rem; }
  .aviso.ok { background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; }
  .aviso.error { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; }
  .tarjeta { background:#fff; border:1px solid var(--gray-200); border-radius:14px; padding:22px; margin-bottom:16px; }
  .tarjeta h2 { font-size:1.05rem; color:var(--primary); margin-bottom:10px; }
  .login { max-width:380px; margin:40px auto; }
  label { display:block; font-size:.82rem; font-weight:600; color:var(--primary); margin-bottom:5px; }
  input, select, textarea { width:100%; padding:10px 12px; border:1px solid var(--gray-200); border-radius:8px; font:inherit; font-size:.9rem; margin-bottom:12px; background:#fff; color:var(--gray-600); }
  textarea { min-height:90px; resize:vertical; }
  .btn { background:var(--primary); color:#fff; border:0; border-radius:8px; padding:10px 18px; font:inherit; font-weight:700; font-size:.88rem; cursor:pointer; }
  .btn-sec { background:#fff; color:var(--primary); border:1px solid var(--gray-200); }
  .filtros { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 14px; }
  .filtros a { font-size:.8rem; font-weight:600; color:var(--gray-600); text-decoration:none; border:1px solid var(--gray-200); background:#fff; border-radius:999px; padding:5px 12px; }
  .filtros a.activo { background:var(--primary); border-color:var(--primary); color:#fff; }
  .buscar { display:flex; gap:8px; margin-bottom:14px; }
  .buscar input { margin:0; }
  .fila-sol { display:block; text-decoration:none; color:inherit; background:#fff; border:1px solid var(--gray-200); border-radius:12px; padding:14px 16px; margin-bottom:10px; }
  .fila-sol:hover { border-color:var(--accent); }
  .fila-sol.alerta { box-shadow:inset 4px 0 0 #f5b44b; }
  .fila-top { display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center; }
  .fila-top b { color:var(--primary); }
  .meta { font-size:.8rem; color:var(--gray-500); }
  .ultima { font-size:.82rem; color:var(--gray-600); margin-top:6px; border-top:1px dashed var(--gray-200); padding-top:6px; }
  .chip { border-radius:999px; padding:2px 10px; font-size:.75rem; font-weight:700; white-space:nowrap; }
  .estado-nueva { background:#eef2f7; color:var(--gray-600); }
  .estado-contactada { background:#e6f4ff; color:#1d4ed8; }
  .estado-cotizada { background:#efe9ff; color:#6d28d9; }
  .estado-negociacion { background:#fff4e0; color:#b45309; }
  .estado-ganada { background:#e6f7ec; color:#1f7a3f; }
  .estado-perdida { background:#fdeaea; color:#b42318; }
  .estado-descartada { background:#eef0f3; color:#64748b; }
  .datos { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:6px 18px; font-size:.88rem; }
  .datos span { color:var(--gray-400); }
  .msg { background:var(--gray-50); border-radius:8px; padding:10px 12px; font-size:.88rem; margin-top:12px; }
  .linea { list-style:none; display:flex; flex-direction:column; gap:10px; }
  .linea li { border-left:3px solid var(--gray-200); padding:2px 0 2px 12px; font-size:.88rem; }
  .linea li.cambio { border-color:var(--accent); }
  .linea .quien { font-size:.78rem; color:var(--gray-500); }
  .pareja { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media (max-width:720px) { .pareja { grid-template-columns:1fr; } }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; margin-bottom:16px; }
  .tile { background:#fff; border:1px solid var(--gray-200); border-radius:12px; padding:12px; text-align:center; }
  .tile b { display:block; font-size:1.5rem; color:var(--primary); }
  .tile span { font-size:.75rem; color:var(--gray-500); }
  .barra-h { height:8px; background:var(--accent); border-radius:4px; }
  table { width:100%; border-collapse:collapse; font-size:.88rem; }
  td { padding:7px 4px; border-bottom:1px solid var(--gray-200); }
  td.n { text-align:right; font-weight:700; color:var(--primary); }
  .oculto { display:none; }
  .vacio { text-align:center; padding:30px; color:var(--gray-500); background:#fff; border:1px dashed var(--gray-200); border-radius:12px; }
</style>
</head>
<body>
<div class="barra"><div class="cont">
  <h1>Modo comercial · AsiSeguros</h1>
  <?php if ($yo): ?>
  <nav>
    <?php if (!$obligadoCambiar): ?>
      <a href="/comercial/" class="<?= $vista !== 'resumen' ? 'act' : '' ?>">Solicitudes</a>
      <a href="/comercial/?ver=resumen" class="<?= $vista === 'resumen' ? 'act' : '' ?>">Resumen</a>
    <?php endif; ?>
    <span><?= e($yo['nombre']) ?></span>
    <form method="post"><input type="hidden" name="accion" value="salir"><button>Salir</button></form>
  </nav>
  <?php endif; ?>
</div></div>

<main><div class="cont">
<?php if ($aviso): ?><div class="aviso <?= $tipoAviso === 'ok' ? 'ok' : 'error' ?>"><?= e($aviso) ?></div><?php endif; ?>

<?php if (!$yo): ?>
  <form method="post" class="tarjeta login" autocomplete="on">
    <h2>Entrar</h2>
    <input type="hidden" name="accion" value="entrar">
    <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
    <label for="u">Usuario</label>
    <input id="u" name="usuario" required maxlength="30" autocomplete="username" autocapitalize="none">
    <label for="c">Contraseña</label>
    <input id="c" type="password" name="clave" required maxlength="200" autocomplete="current-password">
    <button class="btn" style="width:100%">Entrar</button>
    <p class="meta" style="margin-top:12px">Si no tienes usuario, pídeselo al administrador.</p>
  </form>

<?php elseif ($obligadoCambiar): ?>
  <form method="post" class="tarjeta login">
    <h2>Cambia tu contraseña</h2>
    <p class="meta" style="margin-bottom:14px">La que te dieron es temporal. Elige una propia de al menos <?= CRM_CLAVE_MIN ?> caracteres.</p>
    <input type="hidden" name="accion" value="cambiar_clave">
    <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
    <label for="a">Contraseña actual</label>
    <input id="a" type="password" name="actual" required autocomplete="current-password">
    <label for="n1">Contraseña nueva</label>
    <input id="n1" type="password" name="nueva" required minlength="<?= CRM_CLAVE_MIN ?>" autocomplete="new-password">
    <label for="n2">Repite la nueva</label>
    <input id="n2" type="password" name="nueva2" required minlength="<?= CRM_CLAVE_MIN ?>" autocomplete="new-password">
    <button class="btn" style="width:100%">Guardar contraseña</button>
  </form>

<?php elseif ($vista === 'resumen'):
    $rs = crm_resumen($todas); ?>
  <div class="tiles">
    <div class="tile"><b><?= $rs['total'] ?></b><span>Solicitudes</span></div>
    <div class="tile"><b><?= $rs['estados']['ganada'] ?></b><span>Ganadas</span></div>
    <div class="tile"><b><?= $rs['estados']['perdida'] ?></b><span>Perdidas</span></div>
    <div class="tile"><b><?= $rs['cierre'] === null ? '—' : $rs['cierre'] . '%' ?></b><span>Cierre (ganadas / cerradas)</span></div>
    <div class="tile"><b><?= $rs['valor_ganado'] ? pesos($rs['valor_ganado']) : '—' ?></b><span>Valor ganado declarado</span></div>
  </div>
  <div class="tarjeta" style="margin-bottom:16px"><h2>Por responsable</h2>
    <table><tr><td><b>Persona</b></td><td class="n"><b>Asignadas</b></td><td class="n"><b>Ganadas</b></td><td class="n"><b>Perdidas</b></td></tr>
      <?php foreach ($rs['equipo'] as $u => $c): ?>
        <tr><td><?= $u === '' ? '<i>Sin responsable</i>' : e($equipo[$u]['nombre'] ?? $u) ?></td><td class="n"><?= $c['asignadas'] ?></td><td class="n"><?= $c['ganadas'] ?></td><td class="n"><?= $c['perdidas'] ?></td></tr>
      <?php endforeach; ?></table>
  </div>
  <div class="pareja">
    <div class="tarjeta"><h2>Embudo</h2>
      <table><?php foreach (ESTADOS as $k => $v): ?>
        <tr><td><span class="chip estado-<?= $k ?>"><?= e($v) ?></span></td><td class="n"><?= $rs['estados'][$k] ?></td></tr>
      <?php endforeach; ?></table>
    </div>
    <div class="tarjeta"><h2>Por qué se perdieron</h2>
      <?php if (!$rs['motivos']): ?><p class="meta">Todavía no hay negocios perdidos.</p>
      <?php else: $max = max($rs['motivos']); ?>
        <table><?php foreach ($rs['motivos'] as $m => $n): ?>
          <tr><td><?= e($m) ?><div class="barra-h" style="width:<?= (int)round($n * 100 / $max) ?>%"></div></td><td class="n"><?= $n ?></td></tr>
        <?php endforeach; ?></table>
      <?php endif; ?>
    </div>
  </div>

<?php elseif ($vista === 'ficha'):
    $notas = crm_notas()[$s['radicado']] ?? [];
    // Cambios hechos desde /admin (no pasan por el CRM) también salen en la línea de tiempo
    $linea = $notas;
    foreach ($s['historial'] as $h) {
        $dup = false;
        foreach ($notas as $n) {
            if ($n['tipo'] === 'estado' && $n['estado'] === $h['estado']
                && abs((strtotime($n['fecha_hora']) ?: 0) - (strtotime($h['fecha_hora']) ?: 1)) <= 5) { $dup = true; break; }
        }
        if (!$dup) $linea[] = ['fecha_hora' => $h['fecha_hora'], 'nombre' => $h['quien'], 'tipo' => 'estado',
                               'estado' => $h['estado'], 'motivo' => '', 'valor' => '', 'comentario' => $h['nota']];
    }
    usort($linea, fn($a, $b) => strcmp((string)$b['fecha_hora'], (string)$a['fecha_hora']));
    $tel = preg_replace('/\D/', '', (string)($s['telefono'] ?? '')); ?>
  <p style="margin-bottom:14px"><a href="/comercial/">← Volver a las solicitudes</a></p>
  <div class="tarjeta">
    <div class="fila-top">
      <h2 style="margin:0"><?= e($s['nombre'] ?? '') ?></h2>
      <span class="chip estado-<?= e($s['estado']) ?>"><?= e(ESTADOS[$s['estado']]) ?></span>
    </div>
    <p class="meta" style="margin:4px 0 12px"><?= e($s['radicado']) ?> · llegó <?= e(fecha((string)($s['fecha_hora'] ?? ''))) ?> · <?= e($s['canal'] ?? '') ?></p>
    <div class="datos">
      <div><span>Producto:</span> <?= e($s['tipo_seguro'] ?? '') ?></div>
      <div><span>Teléfono:</span> <a href="tel:+57<?= e($tel) ?>"><?= e($s['telefono'] ?? '') ?></a>
        · <a href="https://wa.me/57<?= e($tel) ?>" target="_blank" rel="noopener">WhatsApp</a></div>
      <div><span>Correo:</span> <a href="mailto:<?= e($s['email'] ?? '') ?>"><?= e($s['email'] ?? '') ?></a></div>
      <?php foreach (($s['detalle'] ?? []) as $k => $v): ?>
        <div><span><?= e(ucfirst(str_replace('_', ' ', (string)$k))) ?>:</span> <?= e($v) ?></div>
      <?php endforeach; ?>
    </div>
    <?php if (trim((string)($s['mensaje'] ?? '')) !== ''): ?><div class="msg"><?= nl2br(e($s['mensaje'])) ?></div><?php endif; ?>
    <?php if (empty($s['detalle'])): ?><p class="meta" style="margin-top:10px">No completó el segundo paso: faltan los datos del riesgo.</p><?php endif; ?>
  </div>

  <form method="post" class="tarjeta" style="margin-bottom:16px">
    <h2>Responsable</h2>
    <input type="hidden" name="accion" value="asignar">
    <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
    <input type="hidden" name="radicado" value="<?= e($s['radicado']) ?>">
    <?php $resActual = $asignadas[$s['radicado']] ?? ''; ?>
    <label for="resp">Quién lleva esta solicitud</label>
    <select id="resp" name="responsable">
      <option value="">Sin responsable</option>
      <?php foreach ($equipo as $u => $d): if (empty($d['activo']) && $u !== $resActual) continue; ?>
        <option value="<?= e($u) ?>" <?= $u === $resActual ? 'selected' : '' ?>><?= e($d['nombre']) ?><?= $u === $miUsuario ? ' (yo)' : '' ?></option>
      <?php endforeach; ?>
    </select>
    <button class="btn btn-sec">Guardar responsable</button>
  </form>

  <div class="pareja">
    <form method="post" class="tarjeta" id="f-estado">
      <h2>Cambiar estado</h2>
      <input type="hidden" name="accion" value="registrar">
      <input type="hidden" name="tipo" value="estado">
      <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
      <input type="hidden" name="radicado" value="<?= e($s['radicado']) ?>">
      <label for="est">Nuevo estado</label>
      <select id="est" name="estado">
        <?php foreach (ESTADOS as $k => $v): ?>
          <option value="<?= $k ?>" <?= $k === $s['estado'] ? 'selected' : '' ?>><?= e($v) ?></option>
        <?php endforeach; ?>
      </select>
      <div id="c-motivo" class="oculto">
        <label for="mot">¿Por qué no se logró? *</label>
        <select id="mot" name="motivo">
          <option value="">Elige un motivo…</option>
          <?php foreach (crm_motivos() as $m): ?><option><?= e($m) ?></option><?php endforeach; ?>
        </select>
      </div>
      <div id="c-valor" class="oculto">
        <label for="val">Valor aproximado de la prima (opcional)</label>
        <input id="val" name="valor" inputmode="numeric" maxlength="15" placeholder="Ej. 1500000">
      </div>
      <label for="com" id="l-com">Comentario</label>
      <textarea id="com" name="comentario" maxlength="1000" placeholder="Qué se habló, próximo paso…"></textarea>
      <button class="btn">Guardar cambio</button>
    </form>

    <form method="post" class="tarjeta">
      <h2>Agregar nota</h2>
      <input type="hidden" name="accion" value="registrar">
      <input type="hidden" name="tipo" value="nota">
      <input type="hidden" name="csrf" value="<?= e($_SESSION['csrf']) ?>">
      <input type="hidden" name="radicado" value="<?= e($s['radicado']) ?>">
      <label for="nota">Nota</label>
      <textarea id="nota" name="comentario" required maxlength="1000" placeholder="Llamé y quedó de responder el viernes…"></textarea>
      <button class="btn btn-sec">Guardar nota</button>
    </form>
  </div>

  <div class="tarjeta">
    <h2>Historial</h2>
    <?php if (!$linea): ?><p class="meta">Todavía no hay notas ni cambios.</p><?php else: ?>
    <ul class="linea">
      <?php foreach ($linea as $n): ?>
        <li class="<?= $n['tipo'] === 'estado' ? 'cambio' : '' ?>">
          <div class="quien"><?= e(fecha((string)$n['fecha_hora'])) ?> · <?= e($n['nombre']) ?></div>
          <?php if ($n['tipo'] === 'estado'): ?>
            <span class="chip estado-<?= e($n['estado']) ?>"><?= e(ESTADOS[$n['estado']] ?? $n['estado']) ?></span>
            <?php if ($n['motivo'] !== ''): ?> · <b>Motivo:</b> <?= e($n['motivo']) ?><?php endif; ?>
            <?php if ((string)$n['valor'] !== ''): ?> · <b>Valor:</b> <?= e(pesos((int)$n['valor'])) ?><?php endif; ?>
          <?php endif; ?>
          <?php if (trim((string)$n['comentario']) !== ''): ?><div><?= nl2br(e($n['comentario'])) ?></div><?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>
    <?php endif; ?>
  </div>
  <script>
    (function () {
      var est = document.getElementById('est'), mot = document.getElementById('c-motivo'),
          val = document.getElementById('c-valor'), com = document.getElementById('com'),
          lab = document.getElementById('l-com'), selMot = document.getElementById('mot');
      function ajusta() {
        var v = est.value;
        mot.classList.toggle('oculto', v !== 'perdida');
        val.classList.toggle('oculto', v !== 'ganada');
        selMot.required = v === 'perdida';
        com.required = v === 'perdida' || v === 'ganada';
        lab.textContent = v === 'perdida' ? 'Comentario: explica por qué se perdió *'
          : v === 'ganada' ? 'Comentario: póliza, aseguradora o cómo se cerró *' : 'Comentario';
      }
      est.addEventListener('change', ajusta); ajusta();
    })();
  </script>

<?php else:
    $lista = solicitudes($busca, $filtro);
    $nMias = $nSin = 0;
    foreach ($todas as $t) {
        $u = $asignadas[$t['radicado'] ?? ''] ?? '';
        if ($u === $miUsuario) $nMias++;
        if ($u === '') $nSin++;
    }
    if ($resp === 'mias') $lista = array_values(array_filter($lista, fn($x) => ($asignadas[$x['radicado']] ?? '') === $miUsuario));
    if ($resp === 'sin')  $lista = array_values(array_filter($lista, fn($x) => ($asignadas[$x['radicado']] ?? '') === ''));
    $res = resumen_solicitudes($todas);
    $ultimas = crm_notas();
    $enlace = fn(string $est) => '/comercial/?estado=' . $est . ($resp !== '' ? '&resp=' . $resp : '') . ($busca !== '' ? '&q=' . urlencode($busca) : '');
    $enlaceResp = fn(string $r) => '/comercial/?' . ($r !== '' ? 'resp=' . $r . '&' : '') . 'estado=' . $filtro . ($busca !== '' ? '&q=' . urlencode($busca) : ''); ?>
  <form method="get" class="buscar">
    <?php if ($filtro !== ''): ?><input type="hidden" name="estado" value="<?= e($filtro) ?>"><?php endif; ?>
    <?php if ($resp !== ''): ?><input type="hidden" name="resp" value="<?= e($resp) ?>"><?php endif; ?>
    <input name="q" value="<?= e($busca) ?>" maxlength="80" placeholder="Buscar por nombre, radicado, teléfono, correo o producto…">
    <button class="btn">Buscar</button>
  </form>
  <div class="filtros">
    <a href="<?= e($enlaceResp('')) ?>" class="<?= $resp === '' ? 'activo' : '' ?>">Todos</a>
    <a href="<?= e($enlaceResp('mias')) ?>" class="<?= $resp === 'mias' ? 'activo' : '' ?>">Mis solicitudes (<?= $nMias ?>)</a>
    <a href="<?= e($enlaceResp('sin')) ?>" class="<?= $resp === 'sin' ? 'activo' : '' ?>">Sin responsable (<?= $nSin ?>)</a>
  </div>
  <div class="filtros">
    <a href="<?= e($enlace('')) ?>" class="<?= $filtro === '' ? 'activo' : '' ?>">Todas (<?= $res['total'] ?>)</a>
    <a href="<?= e($enlace('sin_atender')) ?>" class="<?= $filtro === 'sin_atender' ? 'activo' : '' ?>">Sin atender (<?= $res['sin_atender'] ?>)</a>
    <?php foreach (ESTADOS as $k => $v): ?>
      <a href="<?= e($enlace($k)) ?>" class="<?= $filtro === $k ? 'activo' : '' ?>"><?= e($v) ?> (<?= $res['estados'][$k] ?>)</a>
    <?php endforeach; ?>
  </div>
  <?php if (!$lista): ?>
    <div class="vacio">No hay solicitudes que coincidan.</div>
  <?php else: foreach ($lista as $x):
        $ult = $ultimas[$x['radicado']] ?? []; $ult = $ult ? end($ult) : null; ?>
    <a class="fila-sol <?= $x['sin_atender'] ? 'alerta' : '' ?>" href="/comercial/?r=<?= e($x['radicado']) ?>">
      <div class="fila-top">
        <b><?= e($x['nombre'] ?? '') ?></b>
        <span class="chip estado-<?= e($x['estado']) ?>"><?= e(ESTADOS[$x['estado']]) ?></span>
      </div>
      <div class="meta"><?= e($x['tipo_seguro'] ?? '') ?> · <?= e($x['canal'] ?? '') ?> · llegó <?= e(hace($x['horas_espera'])) ?>
        · <?= isset($asignadas[$x['radicado']]) ? 'Responsable: <b>' . e($equipo[$asignadas[$x['radicado']]]['nombre'] ?? $asignadas[$x['radicado']]) . '</b>' : '<i>sin responsable</i>' ?>
        <?= $x['sin_atender'] ? ' · <b style="color:#b45309">sin atender</b>' : '' ?></div>
      <?php if ($ult && trim($ult['comentario']) !== ''): ?>
        <div class="ultima"><b><?= e($ult['nombre']) ?>:</b> <?= e(mb_strimwidth($ult['comentario'], 0, 140, '…')) ?></div>
      <?php endif; ?>
    </a>
  <?php endforeach; endif; ?>
<?php endif; ?>
</div></main>
</body>
</html>

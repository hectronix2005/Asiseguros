# Subir el sitio nuevo a Colombia Hosting

Este paquete reemplaza el WordPress de `www.asiseguros.com` por el sitio nuevo.

**No se toca el DNS.** El dominio sigue apuntando al mismo servidor, así que el
correo, el webmail, los MX y el SPF quedan exactamente como están. No hay nada
que se pueda romper por ese lado, ni propagación, ni ventana de caída.

El certificado SSL actual (Let's Encrypt) sigue sirviendo igual: es del servidor,
no del WordPress.

---

## Paso 1 — Respaldo completo (obligatorio)

En `https://cpanel.asiseguros.com` → **Copias de seguridad** → **Descargar una
copia de seguridad completa del sitio web**. Incluye archivos, bases de datos y
cuentas de correo. Guardarla antes de seguir.

## Paso 2 — Apartar el WordPress, sin borrarlo

En cPanel → **Administrador de archivos**:

1. Crear la carpeta `wp-anterior` **en `/home/<usuario>/`**, es decir **fuera**
   de `public_html`. Así deja de ser accesible por web pero no se pierde nada.
2. Entrar a `public_html` y mover ahí **todo** el contenido de WordPress:
   `index.php`, `wp-config.php`, `wp-admin`, `wp-content`, `wp-includes`,
   `wp-*.php`, `xmlrpc.php`, `readme.html`, `license.txt`.

> **No mover ni borrar** la carpeta `.well-known` si existe: es la que usa
> Let's Encrypt para renovar el certificado. Tampoco `cgi-bin`.
>
> Para ver las carpetas ocultas: **Configuración** → *Mostrar archivos ocultos*.

Al terminar, `public_html` debe quedar vacío salvo `.well-known` y `cgi-bin`.

## Paso 3 — Subir el sitio nuevo

1. Comprimir el contenido de esta carpeta en un `.zip`
   (o subir el `.zip` que viene junto a ella).
2. En el Administrador de archivos, entrar a `public_html` → **Cargar** → subir
   el zip.
3. Seleccionarlo → **Extraer**.
4. Verificar que los archivos quedaron **directamente en `public_html`**, no
   dentro de una subcarpeta. Debe verse así:

```
public_html/
├── index.html
├── politica-tratamiento-datos.html
├── terminos-y-condiciones.html
├── 404.html
├── .htaccess
├── assets/
├── css/
└── js/
```

5. Borrar el zip del servidor.

> El archivo `.htaccess` empieza con punto, así que puede no verse hasta activar
> *Mostrar archivos ocultos*. **Tiene que estar**: es el que fuerza HTTPS y
> mantiene vivas las direcciones antiguas.

## Paso 4 — Comprobar

- `https://www.asiseguros.com` muestra el sitio nuevo.
- `https://asiseguros.com` redirige a `www`.
- `https://www.asiseguros.com/quienes-somos/` redirige al inicio
  (igual con `/asistencia-legal/`, `/shop/`, `/privacy-policy/`…).
- Una dirección inventada muestra la página 404 con el logo.
- El formulario de cotización abre WhatsApp con los datos.
- **Enviar un correo de prueba a `contacto@asiseguros.com`** y confirmar que
  llega. No debería verse afectado, pero conviene verificarlo.

## Cómo revertir

Vaciar `public_html` y devolver a su sitio los archivos de `wp-anterior`. El
WordPress vuelve a funcionar tal como estaba. Por eso no se borra nada.

---

## Qué NO se sube, a propósito

- **`admin.html`** y sus archivos. Es el panel de configuración del sitio y no
  tiene contraseña. Si se quiere publicar, conviene protegerlo antes con
  **Privacidad del directorio** de cPanel.
- **`clon/`**, **`agencia/`** y **`asistencias/`**: versiones de trabajo. El
  dominio muestra únicamente el sitio de la agencia; las direcciones antiguas de
  asistencias redirigen al inicio.
- **`vaas.png`**: la promoción de «Vacaciones así de seguras» a $25.000, que se
  retiró del sitio por anunciar un precio de un producto que no está en el
  portafolio.

## Si algo sale mal

Si tras subir aparece un **error 500**, la causa casi segura es que el hosting
no permite alguna directiva del `.htaccess`. Renombrar el archivo a
`.htaccess-desactivado` desde el Administrador de archivos devuelve el sitio al
aire en segundos; luego se ajusta.

El archivo se probó sobre Apache 2.4 real: sintaxis correcta, las once
redirecciones responden 301 al destino previsto, la página 404 funciona y no se
producen bucles de redirección.

## Después

- En **Google Search Console**, pedir el rastreo de la portada. Las
  redirecciones del `.htaccess` conservan el posicionamiento de las direcciones
  antiguas.
- Mantener el WordPress en `wp-anterior` al menos unas semanas.
- Para actualizar el sitio más adelante: se edita en el repositorio y se vuelve
  a subir por el Administrador de archivos o por FTP. También se puede
  automatizar con un despliegue por FTP desde GitHub.

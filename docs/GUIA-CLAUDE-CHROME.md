# Publicar el sitio en cPanel con Claude en Chrome

Guía para hacer el despliegue con la extensión **Claude for Chrome**, que permite
a Claude ver la pestaña activa y actuar en ella.

## Antes de empezar

1. **Instalar la extensión.** Está en `claude.ai/chrome`. Es una función en
   vista previa: si no aparece disponible, es que tu plan no la incluye todavía.
   En ese caso, todo lo de abajo se puede hacer a mano siguiendo
   `DESPLIEGUE-HOSTING.md`; son unos quince clics.
2. **Iniciar sesión en cPanel tú mismo**, en `https://cpanel.asiseguros.com`,
   antes de activar a Claude. No escribas la contraseña en el chat de la
   extensión: que herede la sesión ya abierta.
3. **Conceder permiso solo para ese sitio** cuando lo pida.
4. Tener a mano el archivo `asiseguros-public_html.zip`.

## Qué conviene delegar y qué no

| Tarea | Recomendación |
|---|---|
| Descargar la copia de seguridad | Delegable: son menús simples |
| Mover el WordPress a `wp-anterior` | **Hazlo tú.** Es selección múltiple de archivos; si el agente se equivoca de carpeta, mueve lo que no debe |
| Subir y extraer el zip | Delegable, verificando el resultado |
| Verificar el sitio publicado | Delegable, es donde más ayuda |

La extensión pedirá confirmación antes de acciones sensibles. **Léelas.** Un
«mover» mal dirigido en `public_html` es exactamente lo que estamos evitando.

---

## Fase 1 — Copia de seguridad

Abre cPanel y pega esto en Claude:

```
Estoy en el cPanel de asiseguros.com. Ayúdame a descargar una copia de
seguridad completa del sitio.

1. Busca la sección "Copias de seguridad" o "Backup".
2. Entra y localiza la opción de descargar una copia de seguridad COMPLETA
   del sitio web (full backup), la que incluye archivos, bases de datos y
   cuentas de correo.
3. Genérala y dime cuándo esté lista para descargar.

No borres ni modifiques nada. Solo generar y descargar.
```

**No sigas hasta tener ese archivo descargado en tu equipo.** Es lo que permite
volver atrás si algo sale mal.

## Fase 2 — Apartar el WordPress

Este paso hazlo tú, con Claude mirando. Pega esto primero:

```
Abre el Administrador de archivos de cPanel y activa la opción de mostrar
archivos ocultos (Configuración → Show Hidden Files).

Luego dime exactamente qué archivos y carpetas hay dentro de public_html,
en una lista. No muevas ni borres nada todavía.
```

Con la lista delante, comprueba que coincide con lo esperado: `index.php`,
`wp-config.php`, `wp-admin`, `wp-content`, `wp-includes`, varios `wp-*.php`,
`xmlrpc.php`, y posiblemente `.well-known` y `cgi-bin`.

Ahora, **a mano**:

1. Sube un nivel, a `/home/<tu-usuario>/`, y crea la carpeta `wp-anterior`.
2. Vuelve a `public_html`, selecciona **todo excepto `.well-known` y `cgi-bin`**
   y muévelo a `/home/<tu-usuario>/wp-anterior`.

> `.well-known` es la carpeta que usa Let's Encrypt para renovar el certificado.
> Si desaparece, el HTTPS caduca. `cgi-bin` es del sistema.

Para confirmar, pega:

```
Dime qué queda ahora dentro de public_html. Debería estar vacío salvo
.well-known y cgi-bin, si existían.
```

## Fase 3 — Subir el sitio

```
En el Administrador de archivos, dentro de public_html:

1. Usa el botón "Cargar" / "Upload" para subir el archivo
   asiseguros-public_html.zip que tengo en mi equipo.
2. Cuando termine, vuelve a public_html, selecciona el zip y usa "Extraer".
3. Confirma que los archivos quedaron directamente en public_html y NO dentro
   de una subcarpeta. Debe verse: index.html, 404.html,
   politica-tratamiento-datos.html, terminos-y-condiciones.html, .htaccess,
   y las carpetas assets, css y js.
4. Dime si el archivo .htaccess está presente. Empieza con punto, así que
   necesitas tener activada la opción de mostrar archivos ocultos.
5. Cuando confirmes que todo está bien, borra el archivo zip del servidor.
```

Si al extraer todo quedó dentro de una carpeta como
`asiseguros-public_html/`, hay que subir su contenido un nivel. Díselo así:

```
Los archivos quedaron dentro de una subcarpeta. Entra en ella, selecciona
todo el contenido y muévelo a public_html. Luego borra la subcarpeta vacía.
```

## Fase 4 — Verificar

```
Abre estas direcciones una por una en pestañas nuevas y dime qué pasa en cada
una:

1. https://www.asiseguros.com  → debe mostrar el sitio de AsiSeguros con el
   titular "Protegemos lo que más importa para ti" y candado de seguridad.
2. https://asiseguros.com → debe redirigir a la versión con www.
3. https://www.asiseguros.com/quienes-somos/ → debe llevar al inicio.
4. https://www.asiseguros.com/shop/ → debe llevar al inicio.
5. https://www.asiseguros.com/privacy-policy/ → debe abrir la política de
   tratamiento de datos.
6. https://www.asiseguros.com/pagina-que-no-existe → debe mostrar una página
   404 con el logo de AsiSeguros.

Dime si alguna no se comporta así.
```

Y por último, lo más importante:

```
Abre el webmail en https://webmail.asiseguros.com y comprueba que puedo entrar
a la cuenta contacto@asiseguros.com.
```

Envíate un correo de prueba desde otra cuenta y confirma que llega. No debería
haberse visto afectado —no tocamos el DNS— pero conviene verificarlo.

---

## Si algo sale mal

**Error 500 en el sitio.** Es el `.htaccess`. Pega esto:

```
El sitio da error 500. En el Administrador de archivos, dentro de public_html,
renombra el archivo .htaccess a .htaccess-desactivado. Luego recarga
https://www.asiseguros.com y dime si vuelve a funcionar.
```

El sitio vuelve al aire en segundos; se pierden las redirecciones de las URLs
antiguas hasta que se ajuste el archivo.

**Volver al WordPress.** Vaciar `public_html` y devolver a su sitio todo lo que
está en `wp-anterior`. Por eso no se borró nada.

## Qué no debe hacer el agente

- Borrar `wp-anterior` o la copia de seguridad.
- Tocar la **zona DNS**, los registros **MX** o el **SPF**. En este despliegue
  no se toca el DNS: si algo propone cambiarlo, deténlo.
- Eliminar cuentas de correo o de FTP.
- Modificar `.well-known`.

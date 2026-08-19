# Mover asiseguros.com al sitio nuevo

Procedimiento para que `asiseguros.com` deje de servir el WordPress de Colombia
Hosting y pase a servir este repositorio desde GitHub Pages.

## Situación de partida

| Dato | Valor |
|---|---|
| Registrador del dominio | Tucows |
| DNS gestionado por | Colombia Hosting (`ns1`–`ns4.colombiahosting.com`) |
| Servidor actual (web y correo) | `190.8.176.86` |
| Sitio actual | WordPress + WooCommerce sobre cPanel |
| Correo | `contacto@asiseguros.com`, en ese mismo servidor |
| Sitio nuevo | `https://hectronix2005.github.io/Asiseguros/` |

## ⚠️ Antes de tocar nada: el correo

**`mail.asiseguros.com` es un CNAME que apunta a `asiseguros.com`.** El registro
MX apunta a `mail`, así que el correo sigue a donde apunte la web.

Si se cambia el registro A del dominio hacia GitHub sin corregir esto,
`mail.asiseguros.com` pasará a resolver a servidores de GitHub —que no aceptan
correo— y **todos los buzones del dominio dejan de recibir de inmediato**.

Corrección, en la zona DNS de Colombia Hosting, **antes de cualquier otro
cambio**:

```
BORRAR:  mail.asiseguros.com   CNAME   asiseguros.com
CREAR:   mail.asiseguros.com   A       190.8.176.86
```

Dejar pasar unas horas y comprobar que sigue resolviendo al servidor correcto:

```bash
dig +short mail.asiseguros.com     # debe devolver 190.8.176.86, sin CNAME
dig +short asiseguros.com MX       # debe seguir siendo 0 mail.asiseguros.com
```

Enviar un correo de prueba a `contacto@asiseguros.com` y confirmar que llega.
Solo entonces continuar.

Lo mismo aplica a `webmail`, `cpanel` y `ftp`: conviene verificar que tengan
registro A propio a `190.8.176.86` y no dependan del apex.

## Fase 1 — Respaldo completo (pendiente, lo hace el cliente)

Ya existe una copia del contenido público en `~/Downloads/`
(`respaldo-asiseguros-wordpress-*.zip`), pero **no es un respaldo restaurable**:
no lleva base de datos, pedidos, usuarios ni configuración.

Desde `https://cpanel.asiseguros.com` → **Copias de seguridad** → descargar la
**copia completa** (archivos + bases de datos + correo) y guardarla.

Conviene mantener el hosting contratado unas semanas después de la migración,
como red de seguridad.

## Fase 2 — Probar en un subdominio

Sirve para validar todo sin tocar el sitio en producción.

**En el DNS de Colombia Hosting:**

```
nuevo.asiseguros.com   CNAME   hectronix2005.github.io.
```

**Cuando ese registro ya resuelva** (`dig +short nuevo.asiseguros.com`), y no
antes, se configura del lado de GitHub:

1. Repositorio → **Settings** → **Pages** → *Custom domain* → `nuevo.asiseguros.com`
   → **Save**. Esto crea un archivo `CNAME` en la raíz del repositorio.
2. Esperar a que GitHub emita el certificado (unos minutos) y marcar
   **Enforce HTTPS**.

> **Orden importante.** Si se configura el dominio en GitHub *antes* de que el
> DNS resuelva, `hectronix2005.github.io/Asiseguros/` empieza a redirigir a un
> dominio que no existe y el sitio queda inaccesible mientras tanto.

Verificar en `https://nuevo.asiseguros.com`: que cargue, que el candado sea
válido, que se vean las fotos y que el formulario abra WhatsApp.

## Fase 3 — Mover el dominio principal

Con la prueba validada. **En el DNS de Colombia Hosting:**

```
# Apex: cuatro registros A (sustituyen al actual 190.8.176.86)
asiseguros.com     A       185.199.108.153
asiseguros.com     A       185.199.109.153
asiseguros.com     A       185.199.110.153
asiseguros.com     A       185.199.111.153

# www: pasa de A a CNAME
www.asiseguros.com CNAME   hectronix2005.github.io.

# mail: ya corregido en el paso previo, NO se toca
mail.asiseguros.com A      190.8.176.86
```

No tocar los registros **MX** ni el **TXT de SPF**.

**En GitHub**, cambiar el *Custom domain* de `nuevo.asiseguros.com` a
`www.asiseguros.com`, esperar el certificado y volver a activar **Enforce
HTTPS**. GitHub redirige solo el apex hacia www.

La propagación tarda entre unos minutos y 48 horas según el TTL. Bajar el TTL de
los registros a 300 segundos un día antes hace el cambio más rápido y más fácil
de revertir.

## Fase 4 — Después del cambio

**URLs del WordPress que dejarán de existir.** Estas están indexadas y pasarán a
dar 404:

```
/quienes-somos/            /asistencia-legal/        /shop/
/contactanos/              /asistencia-medica/       /product/plan-asi-x-mes/
/conoce-nuestros-planes-asi/  /asistencia-odontologica/  /product/plan-asi-x-3-meses/
/explora-nuestras-soluciones/ /asistencia-vial/      /product/plan-asi-x-ano/
/blog/                     /privacy-policy/
```

GitHub Pages no permite redirecciones de servidor, pero sí se pueden crear
páginas estáticas en esas rutas que redirijan a donde corresponda —por ejemplo
`/privacy-policy/` a la nueva política de datos, y las de asistencias a
`/asistencias/`—. Conviene hacerlo para no perder el posicionamiento.

**Otras tareas:**

- Añadir un `404.html` en la raíz del repositorio.
- Actualizar la propiedad en Google Search Console y enviar el sitio nuevo.
- Revisar que los enlaces de redes sociales y de Google Business apunten bien.

## Cómo revertir

Mientras el hosting siga activo, basta con devolver los registros a su valor
original:

```
asiseguros.com      A      190.8.176.86     (y borrar los cuatro de GitHub)
www.asiseguros.com  A      190.8.176.86     (borrar el CNAME)
```

y quitar el *Custom domain* en GitHub. El WordPress vuelve a responder en cuanto
propague.

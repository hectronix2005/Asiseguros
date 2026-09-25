# AsiSeguros — Estado del proyecto

Fecha de cierre: **17 de septiembre de 2026**
Sitio en producción: **https://www.asiseguros.com**

---

## Qué se hizo

Se partió del brief «Ajustes portafolio web» (29 puntos) y el alcance creció
hasta cubrir el despliegue completo, el cumplimiento de la Ley 1581 y el
posicionamiento. 31 cambios publicados.

### El portafolio se alineó con lo que realmente se vende

ARL salió del sitio por completo: no se intermedia. Las cuatro categorías pasan
a ser Personas · Automóviles · Generales · Empresariales, con los 20 productos
reales. Salieron viajes, exequias, hogar, comercio, equipos electrónicos y
arrendamiento, que no están en el portafolio de Seguros del Estado.

### Se retiró todo lo que no se podía sostener

| Qué | Por qué |
|---|---|
| Carrusel de 8 logos de aseguradoras | Marcas de terceros sin convenio; además estaban rotos en producción |
| «15+ aseguradoras», «37K clientes» | Cifras sin respaldo. Ahora: 20 productos, 32 departamentos, 5+ años |
| Tres testimonios | Inventados. Sustituidos por «Cómo trabajamos» |
| Imagen «Vacaciones así de seguras $25.000» | Anunciaba un precio de un producto ajeno al portafolio |
| «Acompañamiento 24/7» | Contradecía el horario publicado |

### Ley 1581 de 2012 — lo que exigió el área legal

El formulario no tenía servidor: armaba un mensaje de WhatsApp que el usuario
podía editar o no enviar. No quedaba prueba de la autorización, que es un deber
autónomo del responsable.

Ahora hay un endpoint propio que registra **antes de cualquier redirección**:
fecha y hora, versión y texto íntegro de la autorización mostrada, respuestas,
IP y navegador. Sin autorización el servidor rechaza. El archivo se guarda
**fuera de `public_html`**, inalcanzable por HTTP.

Además: aviso de privacidad antes de abrir WhatsApp, y acuse de recibo al
titular con copia de lo que autorizó (arts. 12 Ley 1581 y 15 Decreto 1377).

### Migración a producción

El sitio pasó de GitHub Pages al hosting de Colombia Hosting, **sin tocar el
DNS**: el dominio ya apuntaba ahí, así que el correo nunca estuvo en riesgo. El
WordPress se apartó a `/wp-anterior` sin borrarse.

---

## Cómo está montado

```
public_html/
├── index.html                       portada
├── poliza-de-cumplimiento.html      guía (nicho de mayor margen)
├── todo-riesgo-contratista.html     guía
├── responsabilidad-civil-extracontractual.html  guía (25-sep, sin revisión de legal)
├── poliza-de-manejo.html            guía (25-sep, sin revisión de legal)
├── seguro-transporte-de-carga.html  guía (25-sep, sin revisión de legal)
├── asesoria-juridica.html           recupera el tráfico del blog antiguo
├── politica-tratamiento-datos.html  publicada desde el .docx de legal
├── terminos-y-condiciones.html      publicada desde el .docx de legal
├── anexos-datos-personales.html     publicada desde el .docx de legal
├── 404.html · robots.txt · sitemap.xml
├── .htaccess                        redirecciones, seguridad, cabeceras
├── admin/                           panel: documentos + solicitudes
├── api/                             endpoint del formulario y correos
├── assets/ · css/ · js/
└── (fuera) ../asiseguros-datos/     registros de autorización
```

### Cuidado al desplegar: tres páginas las manda el panel, no el repositorio

`politica-tratamiento-datos.html`, `terminos-y-condiciones.html` y
`anexos-datos-personales.html` **las genera el panel** a partir de los `.docx`.
Subir la copia del repositorio encima de ellas borra lo que publicó el panel.

Pasó el 17 de septiembre: legal cargó los tres documentos a las 14:45 y un
despliegue posterior, a las 20:35, devolvió dos de las tres páginas al borrador
anterior. Se recuperaron regenerándolas desde los `.docx` originales, que el
panel conserva en `admin/originales/`.

Antes de subir cualquiera de esas tres, traer primero la versión del servidor.
Los `.docx` originales son la fuente de verdad y nunca se borran.

Los anexos son públicos por decisión del cliente. El enlace va en el **pie de
la plantilla**, no dentro del documento, para que sobreviva a cada nueva carga
de legal: `admin/lib/paginas.php` y el pie de `index.html`.

El `.htaccess` termina con un bloque que genera cPanel y fija PHP 8.1. Está
copiado en el repositorio para que un despliegue no lo borre: sin él, el panel
y el formulario pueden dejar de ejecutarse.

### El panel — `https://www.asiseguros.com/admin/`

Dos pestañas. **Documentos legales**: se carga el `.docx` y se publica como
página del sitio, conservando el original y la versión anterior. **Solicitudes**:
listado con búsqueda y exportación a Excel, incluida la constancia de
autorización.

Cada solicitud muestra además **por dónde llegó** la persona: anuncio pagado,
buscador, redes sociales, campaña, correo, directo u otro sitio. Arriba sale el
conteo por canal y el Excel trae las columnas de campaña. Se registra la primera
página que visitó en la sesión, el dominio que la trajo y los parámetros `utm_*`;
no la URL completa de origen ni identificadores de clic. Va en
`../asiseguros-datos/procedencia.csv`, aparte del registro de autorizaciones.
Las solicitudes anteriores al 25-sep-2026 salen como «Sin dato».

Para que una campaña se distinga, sus enlaces deben llevar
`?utm_source=…&utm_medium=…&utm_campaign=…` (por ejemplo
`utm_source=facebook&utm_medium=social&utm_campaign=cumplimiento-oct`).

Protegido con contraseña, bloqueo tras cinco intentos, y el firewall del hosting
como segunda capa.

---

## Pendientes

### Requieren acción tuya

- Abrir la bandeja de `comercial1@asiseguros.com` y confirmar que los avisos
  están ahí. El servidor ya se verificó: responde `250 Accepted` para
  `comercial1@` y `administrativo@`, y `550 No Such User Here` para
  `contacto@` —que por eso se retiró del sitio—. Falta solo mirar el buzón.

### Esperando a Google — nada que hacer

El 25 de septiembre se completó el trabajo en Search Console: propiedad
verificada por etiqueta HTML y registro TXT, `sitemap.xml` enviado (7 URLs,
estado correcto) y las cuatro páginas principales en cola de rastreo
prioritario.

Quedan **dos validaciones en curso** en *Fragmentos de productos*, por los
campos `review` y `aggregateRating`. No eran un problema del sitio actual:
venían de `/product/plan-asi-x-ano/` y las demás fichas de WooCommerce del
WordPress anterior, que Google no rastreaba desde el 22 de agosto —antes de la
migración— y seguía teniendo indexadas con su marcado de producto.

La causa era una regla propia: esas URLs redirigían a la portada, y Google trata
el redirect masivo al inicio como «soft 404», así que las mantenía en el índice
indefinidamente. Ahora `/shop/`, `/cart/`, `/checkout/`, `/my-account/` y todo
`/product/` y `/product-category/` responden **410**.

**No añadir `review` ni `aggregateRating`.** Significan reseñas y calificación
promedio: rellenarlos obligaría a inventarlas, que es lo que se retiró del sitio,
y Google lo trata como spam de datos estructurados.

Si alguna validación termina «Con errores», habrá aparecido una URL de tienda con
otra forma; se añade al patrón del `.htaccess`.

### Decisiones abiertas

- **¿«Seguro de Hogar» vuelve al portafolio?** El brief lo retiró porque no está
  en el catálogo de Seguros del Estado, y su sitio tampoco lo lista. Si sí se
  intermedia, hay que devolverlo a las tarjetas, al desplegable y al panel.
  Mientras tanto, su cuestionario sirve a Incendio y Sustracción.

### Cerrado sin necesitar criterio del cliente

- **Qué compañía expide cada póliza.** Verificado en el sitio de la aseguradora:
  su aviso de cookies nombra por separado a Seguros del Estado S.A. y Seguros de
  Vida del Estado S.A., y la sección de vida es de la segunda. Como seis de los
  veinte productos son de personas, la atribución era imprecisa para casi un
  tercio del catálogo. Corregido en las seis páginas, la plantilla del panel y
  los correos.
- **Cuestionarios del formulario.** De 5 a los 20 productos. El transporte de
  carga dejó de compartir el de vehículos y tiene el suyo: mercancía, rutas,
  valor por despacho y modalidad de flota.
- **Derechos de imagen de las fotos.** No era un tema para legal: se revisaron
  las siete una por una y solo `card-personas.jpg` mostraba rostros
  identificables —una familia de cuatro, **dos de ellos menores**—. Usar la
  imagen de un menor en publicidad exige autorización de los padres, que la
  licencia CC0 no otorga. Se reemplazó por una silueta a contraluz. Las otras
  seis son manos, personas de espaldas o sin gente. Hoy **ninguna foto del
  sitio permite identificar a una persona**.

### Dependen de terceros

- Revisión jurídica de las dos guías técnicas (cumplimiento y todo riesgo
  contratista). Las páginas legales ya no la necesitan: las tres salen de los
  `.docx` que aprobó legal, no de mi redacción.
- Logo de Seguros del Estado del manual de marca. **Verificado que no hay nada
  mejor en público**: los cuatro archivos que publica su propio sitio
  —`logo.png` 226×60, `logo-fx1.png` 232×60, `logo-sv.png` 226×60 y el del pie
  185×54— ninguno pasa de 60 px de alto, y no existe versión vectorial. Hay que
  pedírselo a la compañía. Mientras tanto se muestra a 40 px, donde no se nota.

### En observación

- El tráfico de `/2015/11/19/blog-asistencia-legal/` (1.472 visitas humanas al
  mes) tras redirigir a la página de asesoría jurídica.
- Los informes DMARC que empezarán a llegar a `administrativo@`.
- El WordPress en `/wp-anterior`: dejarlo unas semanas antes de borrarlo.

---

## Datos que conviene tener a mano

| | |
|---|---|
| Servidor | `190.8.176.86` (kemuel.colombiahosting.com.co) |
| cPanel | `https://kemuel.colombiahosting.com.co:2083` — no usar `cpanel.asiseguros.com`, su certificado está caducado |
| Repositorio | `github.com/hectronix2005/Asiseguros` |
| Copia previa a la migración | `~/Downloads/backup-asiseguros-9.17.2026.tar.gz` (2,8 GB) |
| Razón social | ASISEGUROS LTDA · NIT 901.483.323-4 |

### Para revertir

El WordPress está íntegro en `/wp-anterior` y la base de datos nunca se tocó.
Devolver esas carpetas a `public_html` restaura el sitio anterior.

### Para actualizar el sitio: se publica solo desde GitHub

Una tarea cron del hosting corre cada 10 minutos, trae los commits nuevos de
`main` y ejecuta `scripts/desplegar.sh`. Subir a GitHub es publicar; en menos de
diez minutos está en el sitio. No hace falta FTP ni entrar a cPanel.

El plan de Colombia Hosting **no incluye Git Version Control** de cPanel —se
comprobó enumerando sus 50 herramientas—, pero el servidor sí trae git 2.52 en
`/usr/bin/git` y tareas cron, que es todo lo necesario.

El comando de la tarea es:

```
[ -d $HOME/repos/asiseguros ] || /usr/bin/git clone -q \
  https://github.com/hectronix2005/Asiseguros.git $HOME/repos/asiseguros; \
/bin/sh $HOME/repos/asiseguros/scripts/desplegar.sh >> $HOME/despliegue.log 2>&1
```

El script compara contra el último commit **desplegado**, que guarda en
`~/.ultimo-desplegado`. Comparar el HEAD de antes y después de traer no servía:
un clon recién hecho ya viene al día y la condición nunca se cumplía.

Cada despliegue deja una línea en `~/despliegue.log`. El script respeta la lista
blanca: nunca copia las tres páginas que genera el panel, no toca los documentos
cargados ni los registros de autorización, y de `assets/img` publica solo las
once imágenes en uso —las doce restantes son del sitio anterior, entre ellas la
pieza del precio que retiró el brief—.

### Si hiciera falta subir algo a mano

**No hay cuenta FTP permanente.** La de despliegue se eliminó el 17 de septiembre porque
su contraseña se había escrito en una conversación. Antes de cerrarla se
comprobaron los 62 archivos del repositorio contra el servidor: ninguna
diferencia.

Para volver a desplegar hay que crear una cuenta FTP nueva en cPanel,
apuntándola a `/home/asisegur/public_html` —no a `/home/asisegur`, como estaba
la anterior—. También sirve el administrador de archivos de cPanel.

Los documentos legales no necesitan nada de eso: se cargan desde el panel, que
no depende de FTP.

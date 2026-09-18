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
├── asesoria-juridica.html           recupera el tráfico del blog antiguo
├── politica-tratamiento-datos.html  ← reemplazar por el .docx de legal
├── terminos-y-condiciones.html      ← reemplazar por el .docx de legal
├── 404.html · robots.txt · sitemap.xml
├── .htaccess                        redirecciones, seguridad, cabeceras
├── admin/                           panel: documentos + solicitudes
├── api/                             endpoint del formulario y correos
├── assets/ · css/ · js/
└── (fuera) ../asiseguros-datos/     registros de autorización
```

### El panel — `https://www.asiseguros.com/admin/`

Dos pestañas. **Documentos legales**: se carga el `.docx` y se publica como
página del sitio, conservando el original y la versión anterior. **Solicitudes**:
listado con búsqueda y exportación a Excel, incluida la constancia de
autorización.

Protegido con contraseña, bloqueo tras cinco intentos, y el firewall del hosting
como segunda capa.

---

## Pendientes

### Requieren acción tuya

- Cargar los tres `.docx` de legal en `/admin/`. **Hoy está publicada mi
  redacción, sin revisión jurídica.** Es el pendiente más importante.
- Borrar la cuenta FTP `despliegue@asiseguros.com`: su contraseña quedó escrita
  en la conversación.
- Search Console: verificar por DNS, enviar `sitemap.xml` y pedir indexación de
  las cuatro páginas principales.
- Confirmar que llegan los avisos a `comercial1@asiseguros.com`.

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

### Dependen de terceros

- Revisión jurídica de las dos páginas legales y de las dos guías técnicas.
- Derechos de imagen de las fotos: son CC0, lo que cubre al fotógrafo pero no
  acredita autorización de las personas retratadas.
- Logo de Seguros del Estado del manual de marca: el actual se tomó de su web y
  solo existe a 226×60 px.

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

### Para actualizar el sitio

Se edita en el repositorio y se sube por FTP o por el administrador de archivos.
Los documentos legales no requieren eso: se cargan desde el panel.

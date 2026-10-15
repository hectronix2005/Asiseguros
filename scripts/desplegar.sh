#!/bin/sh
# Despliegue de asiseguros.com desde GitHub.
#
# Lo ejecuta una tarea cron del hosting. El plan de Colombia Hosting no incluye
# Git Version Control de cPanel, pero sí trae git (/usr/bin/git) y cron, que es
# todo lo que hace falta.
#
# Lista blanca deliberada. Tres archivos del repositorio NO se copian nunca:
#
#   politica-tratamiento-datos.html
#   terminos-y-condiciones.html
#   anexos-datos-personales.html
#
# Esas páginas las genera el panel a partir de los .docx que carga el área
# jurídica. La copia del repositorio es un reflejo de la última versión conocida
# y suele estar desactualizada: copiarlas revertiría el documento vigente, que es
# lo que ocurrió el 17 de septiembre de 2026.
#
# Tampoco se tocan admin/originales/ ni admin/versiones/ (los .docx cargados y su
# histórico), datos/ (registros de autorización) ni admin/.clave.php.
#
# De assets/img solo se publican las imágenes en uso. Entre las que quedan fuera
# está vaas.png, la pieza que anunciaba «Vacaciones así de seguras desde
# $25.000», retirada por publicitar el precio de un producto ajeno al portafolio.

set -e

REPO="$HOME/repos/asiseguros"
DESTINO="$HOME/public_html"
REGISTRO="$HOME/despliegue.log"

cd "$REPO"

git fetch --quiet origin main
git reset --quiet --hard origin/main

# El reset puede haber cambiado este mismo script, pero sh ya lo tiene cargado y
# seguiría con la versión vieja: así se quedaron sin copiar las tres guías nuevas
# el 25 de septiembre de 2026. Se vuelve a ejecutar una vez, ya actualizado.
if [ "${1:-}" != "--actualizado" ]; then
  exec /bin/sh "$0" --actualizado
fi

# Reporte diario de solicitudes (7:00 a. m.) a gerencia y al comercial. Va
# antes de la comparación de commits porque debe correr aunque no haya nada
# que desplegar. El propio script decide si ya es hora y si ya se envió hoy;
# un fallo aquí no detiene el despliegue.
PHP=""
for candidato in /opt/cpanel/ea-php81/root/usr/bin/php /usr/local/bin/php /usr/bin/php; do
  if [ -x "$candidato" ]; then PHP="$candidato"; break; fi
done
if [ -n "$PHP" ] && [ -f "$DESTINO/admin/lib/reporte-diario.php" ]; then
  "$PHP" "$DESTINO/admin/lib/reporte-diario.php" >> "$REGISTRO" 2>&1 || true
fi

AHORA=$(git rev-parse HEAD)

# Se compara contra el último commit DESPLEGADO, no contra el que había antes de
# traer. Comparar antes/después fallaba en la primera ejecución: el clon recién
# hecho ya venía al día, así que nunca llegaba a copiar nada.
MARCA="$HOME/.ultimo-desplegado"
ULTIMO=$(cat "$MARCA" 2>/dev/null || true)
if [ "$ULTIMO" = "$AHORA" ]; then
  exit 0
fi

# Páginas
cp -f index.html 404.html asesoria-juridica.html \
      poliza-de-cumplimiento.html todo-riesgo-contratista.html \
      responsabilidad-civil-extracontractual.html poliza-de-manejo.html \
      seguro-transporte-de-carga.html seguros.html "$DESTINO/"

# Servidor e indexación
cp -f .htaccess robots.txt sitemap.xml "$DESTINO/"

# Iconos
cp -f favicon.ico favicon-32x32.png favicon-16x16.png apple-touch-icon.png "$DESTINO/"

# Estáticos
cp -Rf css js "$DESTINO/"

# Imágenes en uso
mkdir -p "$DESTINO/assets/img"
cp -f assets/img/logo.png assets/img/logo-web.png assets/img/og-asiseguros.jpg assets/img/banner2.jpg assets/img/site-11.png \
      assets/img/autos.jpg assets/img/nosotros.jpg assets/img/proceso.jpg \
      assets/img/card-personas.jpg assets/img/card-automoviles.jpg \
      assets/img/card-generales.jpg assets/img/card-empresariales.jpg \
      assets/img/banner2.webp assets/img/nosotros.webp assets/img/proceso.webp assets/img/autos.webp \
      assets/img/card-personas.webp assets/img/card-automoviles.webp \
      assets/img/card-generales.webp assets/img/card-empresariales.webp \
      assets/img/seguros-del-estado.png "$DESTINO/assets/img/"

# Portafolio en PDF para descargar desde la portada y el catálogo
mkdir -p "$DESTINO/assets/docs"
cp -f assets/docs/portafolio-asiseguros-2026.pdf "$DESTINO/assets/docs/"

# Formulario y correos
mkdir -p "$DESTINO/api"
cp -f api/.htaccess api/correo.php api/cotizacion.php "$DESTINO/api/"

# Anexos del manual de datos personales: son de uso interno y no se publican
# (área jurídica, 28-sep-2026). Si la página sigue en el servidor se aparta a
# un respaldo fuera de la web, y se quita su enlace del pie de las dos páginas
# legales que genera el panel. Solo se toca esa línea del pie, no el documento.
if [ -f "$DESTINO/anexos-datos-personales.html" ]; then
  mkdir -p "$HOME/respaldos"
  mv "$DESTINO/anexos-datos-personales.html" \
     "$HOME/respaldos/anexos-datos-personales-$(date +%Y%m%d-%H%M%S).html"
fi
for f in politica-tratamiento-datos.html terminos-y-condiciones.html; do
  if [ -f "$DESTINO/$f" ]; then
    sed -i '/^ *<a href="anexos-datos-personales.html">Anexos de Datos Personales<\/a> *$/d' "$DESTINO/$f"
  fi
done

# Panel: solo el código
mkdir -p "$DESTINO/admin/lib"
cp -f admin/.htaccess admin/index.php "$DESTINO/admin/"
cp -f admin/lib/.htaccess admin/lib/docx.php admin/lib/paginas.php \
      admin/lib/solicitudes.php admin/lib/zip.php \
      admin/lib/seguimiento.php admin/lib/reporte.php admin/lib/reporte-diario.php \
      "$DESTINO/admin/lib/"

echo "$AHORA" > "$MARCA"
echo "$(date '+%Y-%m-%d %H:%M:%S') desplegado $AHORA" >> "$REGISTRO"

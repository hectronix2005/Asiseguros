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
      poliza-de-cumplimiento.html todo-riesgo-contratista.html "$DESTINO/"

# Servidor e indexación
cp -f .htaccess robots.txt sitemap.xml "$DESTINO/"

# Iconos
cp -f favicon.ico favicon-32x32.png favicon-16x16.png apple-touch-icon.png "$DESTINO/"

# Estáticos
cp -Rf css js "$DESTINO/"

# Imágenes en uso
mkdir -p "$DESTINO/assets/img"
cp -f assets/img/logo.png assets/img/banner2.jpg assets/img/site-11.png \
      assets/img/autos.jpg assets/img/nosotros.jpg assets/img/proceso.jpg \
      assets/img/card-personas.jpg assets/img/card-automoviles.jpg \
      assets/img/card-generales.jpg assets/img/card-empresariales.jpg \
      assets/img/seguros-del-estado.png "$DESTINO/assets/img/"

# Formulario y correos
mkdir -p "$DESTINO/api"
cp -f api/.htaccess api/correo.php api/cotizacion.php "$DESTINO/api/"

# Panel: solo el código
mkdir -p "$DESTINO/admin/lib"
cp -f admin/.htaccess admin/index.php "$DESTINO/admin/"
cp -f admin/lib/.htaccess admin/lib/docx.php admin/lib/paginas.php \
      admin/lib/solicitudes.php admin/lib/zip.php "$DESTINO/admin/lib/"

echo "$AHORA" > "$MARCA"
echo "$(date '+%Y-%m-%d %H:%M:%S') desplegado $AHORA" >> "$REGISTRO"

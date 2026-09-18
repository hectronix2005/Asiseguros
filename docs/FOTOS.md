# Fotografías del sitio

La página está preparada para recibir fotos sin tocar código. Basta con dejar el
archivo en `assets/img/` **con el nombre exacto** de la tabla y hacer commit.

Cómo funciona: cada zona declara la foto que le corresponde en un atributo
`data-photo`. Al cargar la página, `js/main.js` comprueba si el archivo existe.
Si existe, lo aplica de fondo y activa el tratamiento visual (capa oscura y texto
en blanco donde corresponde). Si no existe, la sección se ve con su color de
respaldo, exactamente como está hoy. No hay imágenes rotas en ningún momento.

Para quitar una foto, basta con borrar el archivo.

## Archivos que espera la página

| Archivo | Dónde sale | Medida | Peso máx. | Qué debe mostrar |
|---|---|---|---|---|
| `autos.jpg` | Fondo de «Seguro de Autos» | 1920×1080 | 300 KB | Persona sonriendo junto a su vehículo, transmitiendo tranquilidad. El texto va sobre la mitad izquierda, así que el sujeto debe quedar hacia la derecha. |
| `card-personas.jpg` | Tarjeta «Seguros de Personas» | 800×500 | 150 KB | Familia o grupo de trabajo. Cercano, humano. |
| `card-automoviles.jpg` | Tarjeta «Automóviles» | 800×500 | 150 KB | Vehículo particular o camión de carga en carretera. |
| `card-generales.jpg` | Tarjeta «Seguros Generales» | 800×500 | 150 KB | Obra, bodega o maquinaria en operación. |
| `card-empresariales.jpg` | Tarjeta «Seguros Empresariales» | 800×500 | 150 KB | Firma de contrato, reunión de negocios o entrega de obra. |
| `nosotros.jpg` | Sección «Nosotros» | 1200×900 | 250 KB | Asesoría uno a uno o equipo de la agencia. Mientras no exista, se muestra la ilustración actual. |
| `proceso.jpg` | Fondo de «Cómo trabajamos» | 1920×1080 | 300 KB | Escena de asesoría, sin mucho detalle: va cubierta por una capa oscura al 90 %. |
| `seguros-del-estado.png` | Franja «Con el respaldo de» | alto 104 px o más | 60 KB | Logo oficial de Seguros del Estado, en PNG con fondo transparente. Uso autorizado por la compañía. Mientras no exista, la franja muestra el nombre en texto. |

## Fotos actualmente publicadas

Son provisionales, de banco gratuito. Todas provienen de **StockSnap.io** y están
bajo **licencia CC0 1.0** (dominio público): uso comercial permitido, sin
atribución obligatoria y sin costo. Se listan aquí para dejar registro.

| Archivo | Origen |
|---|---|
| `autos.jpg` | https://stocksnap.io/photo/people-man-B6JKY2BT1U |
| `proceso.jpg` | https://stocksnap.io/photo/writing-papers-Y01VDYAX63 |
| `nosotros.jpg` | https://stocksnap.io/photo/typing-working-T1NUHZ0SU7 |
| `card-personas.jpg` | https://stocksnap.io/photo/silhouette-family-Q7UIKF58IR |
| `card-automoviles.jpg` | https://stocksnap.io/photo/highway-road-AOEI2XN99G |
| `card-generales.jpg` | https://stocksnap.io/photo/construction-blueprint-BZ4FJO6KZE |
| `card-empresariales.jpg` | https://stocksnap.io/photo/work-business-J5LXKNDREC |

`autos.jpg` va espejada respecto al original, para que el conductor quede en el
lado opuesto al texto.

Dos límites que conviene tener presentes:

- **El logo de Seguros del Estado no existe en alta resolución públicamente.**
  Se revisaron los cuatro archivos que publica su propio sitio —`logo.png`
  (226×60), `logo-fx1.png` (232×60), `logo-sv.png` (226×60) y el del pie
  (185×54)— y ninguno supera los 60 px de alto. No hay versión vectorial. El
  que está publicado es el mayor disponible; para mejorarlo hay que pedirle a
  la compañía el archivo de su manual de marca. Se muestra a 40 px de alto,
  donde la pérdida no se percibe en pantallas normales.
- **Resolución de origen.** El banco solo expone estas fotos a 960 px de ancho.
  Se reescalaron al tamaño de la tabla de arriba. En las tarjetas y en `nosotros`
  no se nota; en los dos fondos a ancho completo el detalle es blando, aunque
  queda disimulado por la capa oscura. Fotos propias en alta resolución darían
  mejor resultado.
- **Derechos de imagen: resuelto.** La licencia CC0 cubre los derechos de autor
  del fotógrafo, pero **no acredita autorización de las personas retratadas**.
  Se revisaron las siete fotos una por una y solo `card-personas.jpg` mostraba
  rostros identificables: una familia de cuatro, **dos de ellos menores de
  edad**. Usar la imagen de un menor en una pieza comercial exige autorización
  expresa de sus padres (Ley 1581, art. 7 y Decreto 1377, art. 12), que la
  licencia CC0 no otorga. Se reemplazó por una silueta a contraluz, sin rostros.

  Las otras seis no tienen el problema: `autos.jpg` es el conductor visto desde
  atrás, `nosotros.jpg` una persona de espaldas, `card-empresariales.jpg` y
  `proceso.jpg` solo manos, y las dos restantes no muestran personas.

  **Ninguna foto del sitio permite hoy identificar a una persona.** Si en el
  futuro se suben fotos propias con personas reconocibles, hace falta
  autorización de uso de imagen firmada.

## Recomendaciones

- **Formato**: JPG para fotografía. Si la foto lleva transparencia, PNG.
- **Encuadre**: en los fondos a ancho completo el recorte es `cover` y centrado,
  así que lo importante debe estar en el centro y no en los bordes.
- **Contraste**: en `autos.jpg` y `proceso.jpg` el texto va encima. Funcionan
  mejor las fotos con zonas amplias y poco ruido visual.
- **Derechos**: si son de banco de imágenes, guardar la licencia. Si aparecen
  personas identificables en una pieza comercial, hace falta autorización de uso
  de imagen.

## Verificar el resultado

Levantar el sitio en local y revisar la página:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/
```

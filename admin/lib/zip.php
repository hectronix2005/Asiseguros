<?php
/**
 * Lectura de una entrada de un archivo ZIP sin la extensión ZipArchive.
 *
 * El hosting de producción corre PHP 8.0 sin la extensión `zip`, así que
 * ZipArchive no existe y un .docx no se podía abrir. Sí están `zlib` y
 * `gzinflate`, que es todo lo que hace falta: un ZIP es un formato sencillo y
 * los .docx guardan sus partes con deflate (método 8) o sin comprimir (0).
 *
 * Se lee el directorio central —no los encabezados locales uno a uno— porque es
 * la forma fiable de localizar una entrada por nombre.
 */

declare(strict_types=1);

/**
 * Devuelve el contenido de una entrada del ZIP, o null si no está.
 *
 * @param string $rutaZip  Archivo .zip/.docx en disco
 * @param string $entrada  Ruta interna, p. ej. "word/document.xml"
 */
function zip_leer(string $rutaZip, string $entrada): ?string
{
    $datos = @file_get_contents($rutaZip);
    if ($datos === false || strlen($datos) < 22) return null;

    // --- Localizar el End of Central Directory (firma PK\x05\x06) ---
    // Va al final, pero puede llevar hasta 64 KB de comentario detrás.
    $maxBusqueda = min(strlen($datos), 65557);
    $posEOCD = false;
    for ($i = strlen($datos) - 22; $i >= strlen($datos) - $maxBusqueda; $i--) {
        if ($i < 0) break;
        if (substr($datos, $i, 4) === "PK\x05\x06") { $posEOCD = $i; break; }
    }
    if ($posEOCD === false) return null;

    $eocd = unpack('vdisco/vdiscoCD/ventradasDisco/ventradas/Vtam/Voffset', substr($datos, $posEOCD + 4, 16));
    if (!$eocd) return null;

    $p = $eocd['offset'];
    $entradas = $eocd['entradas'];

    // --- Recorrer el directorio central buscando la entrada ---
    for ($n = 0; $n < $entradas; $n++) {
        if (substr($datos, $p, 4) !== "PK\x01\x02") return null;

        $c = unpack(
            'vversion/vversionNec/vflags/vmetodo/vhora/vfecha/Vcrc/VtamComp/VtamOrig/'
            . 'vlonNombre/vlonExtra/vlonComent/vdiscoIni/vattrInt/VattrExt/VoffsetLocal',
            substr($datos, $p + 4, 42)
        );
        if (!$c) return null;

        $nombre = substr($datos, $p + 46, $c['lonNombre']);

        if ($nombre === $entrada) {
            // El encabezado local repite nombre y extra, y puede diferir del
            // central: hay que leer sus longitudes ahí, no reutilizar las de arriba.
            $ol = $c['offsetLocal'];
            if (substr($datos, $ol, 4) !== "PK\x03\x04") return null;
            $l = unpack('vlonNombre/vlonExtra', substr($datos, $ol + 26, 4));
            if (!$l) return null;

            $inicio = $ol + 30 + $l['lonNombre'] + $l['lonExtra'];
            $crudo  = substr($datos, $inicio, $c['tamComp']);

            if ($c['metodo'] === 0) {            // almacenado sin comprimir
                return $crudo;
            }
            if ($c['metodo'] === 8) {            // deflate
                $salida = @gzinflate($crudo);
                return $salida === false ? null : $salida;
            }
            return null;                          // método no soportado
        }

        $p += 46 + $c['lonNombre'] + $c['lonExtra'] + $c['lonComent'];
    }

    return null;
}

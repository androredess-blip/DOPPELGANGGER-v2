# Hecho con apoyo de un asistente de IA y revisado por el equipo Gatitácticos.
"""Descubre candidatos desde Earthdata CMR y actualiza datos de comparación PDS.

Uso (desde la carpeta del proyecto):
    python scripts/actualizar_analogos_nasa.py

Los metadatos de Earthdata solo proponen ubicaciones. Los rasgos no observables
se dejan sin calificar y los candidatos requieren revisión del equipo.
"""

import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIOS = RAIZ / "data" / "sitios.json"
CLIMA = RAIZ / "data" / "clima.json"
PDS_SALIDA = RAIZ / "data" / "pds.json"

CMR = "https://cmr.earthdata.nasa.gov/search"
PDS = "https://pds.nasa.gov/api/search/1"
GIBS_DOCS = "https://nasa-gibs.github.io/gibs-api-docs/"
CLAVES_RASGOS = (
    "basalto",
    "crateres",
    "dunas",
    "sales",
    "hielo",
    "paleolago",
    "extremofilos",
    "cuevas",
    "aislamiento",
)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from descargar_clima import descargar as descargar_clima  # noqa: E402


def obtener_json(url, accept="application/json"):
    request = urllib.request.Request(
        url,
        headers={
            "Accept": accept,
            "User-Agent": "Doppelganger-v2 NASA open-data catalog",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def buscar_colecciones(termino):
    query = urllib.parse.urlencode({"keyword": termino, "page_size": 100})
    return obtener_json(f"{CMR}/collections.umm_json?{query}")["items"]


def contiene_analogo_marciano(texto):
    return bool(
        re.search(r"\bmars\b.{0,100}\banalog(?:ue)?\b", texto, re.IGNORECASE | re.DOTALL)
        or re.search(r"\banalog(?:ue)?\b.{0,100}\bmars\b", texto, re.IGNORECASE | re.DOTALL)
    )


def centro_espacial(umm):
    horizontal = (
        umm.get("SpatialExtent", {})
        .get("HorizontalSpatialDomain", {})
        .get("Geometry", {})
    )
    rectangulos = horizontal.get("BoundingRectangles", [])
    if rectangulos:
        bounds = rectangulos[0]
        oeste = bounds.get("WestBoundingCoordinate")
        este = bounds.get("EastBoundingCoordinate")
        sur = bounds.get("SouthBoundingCoordinate")
        norte = bounds.get("NorthBoundingCoordinate")
        if None not in (oeste, este, sur, norte):
            if este - oeste > 30 or norte - sur > 30:
                return None
            return (sur + norte) / 2, (oeste + este) / 2

    poligonos = horizontal.get("GPolygons", [])
    puntos = []
    for poligono in poligonos:
        puntos.extend(poligono.get("Boundary", {}).get("Points", []))
    if not puntos:
        return None
    latitudes = [p.get("Latitude") for p in puntos]
    longitudes = [p.get("Longitude") for p in puntos]
    if any(v is None for v in latitudes + longitudes):
        return None
    if max(longitudes) - min(longitudes) > 30 or max(latitudes) - min(latitudes) > 30:
        return None
    return sum(latitudes) / len(latitudes), sum(longitudes) / len(longitudes)


def centro_granula(concept_id):
    query = urllib.parse.urlencode(
        {"collection_concept_id": concept_id, "page_size": 20}
    )
    respuesta = obtener_json(f"{CMR}/granules.umm_json?{query}")
    for item in respuesta.get("items", []):
        centro = centro_espacial(item.get("umm", {}))
        if centro:
            return centro
    return None


def slug(texto):
    normalizado = unicodedata.normalize("NFKD", texto)
    ascii_texto = normalizado.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_texto).strip("-")


def dist_km(a, b):
    from math import asin, cos, radians, sin, sqrt

    lat1, lon1 = map(radians, a)
    lat2, lon2 = map(radians, b)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(h))


def ubicacion(umm, lat, texto):
    if "don juan pond" in texto.lower():
        return "Don Juan Pond", "Valles Secos de McMurdo", "Antártida"

    palabras = umm.get("LocationKeywords", [])
    pais = next(
        (
            entrada.get("Type")
            for entrada in palabras
            if entrada.get("Category") in ("COUNTRY", "CONTINENT") and entrada.get("Type")
        ),
        None,
    )
    lugar = next(
        (
            entrada.get("Type")
            for entrada in palabras
            if entrada.get("Category") in ("GEOGRAPHIC REGION", "FEATURE")
            and entrada.get("Type")
        ),
        None,
    )
    if lat <= -60 and not pais:
        pais = "Antártida"
    if pais and pais.lower() == "antarctica":
        pais = "Antártida"
    if not lugar and lat <= -60:
        lugar = "Antártida"
    if not pais or not lugar:
        return None
    return umm.get("EntryTitle", "Candidato Earthdata"), lugar, pais


def world_view_url(lat, lon):
    west, south, east, north = lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5
    view = ",".join(f"{value:.4f}" for value in (west, south, east, north))
    return f"https://worldview.earthdata.nasa.gov/index.html?v={view}"


def descubrir_candidatos(sitios):
    por_concepto = {}
    for termino in ("Mars analog", "Mars analogue", "planetary analog"):
        for item in buscar_colecciones(termino):
            concept_id = item.get("meta", {}).get("concept-id")
            umm = item.get("umm", {})
            texto = f"{umm.get('EntryTitle', '')} {umm.get('Abstract', '')}"
            if concept_id and contiene_analogo_marciano(texto):
                por_concepto[concept_id] = (item, texto)

    existentes = [(s["lat"], s["lon"]) for s in sitios]
    candidatos = []
    for concept_id, (item, texto) in por_concepto.items():
        umm = item["umm"]
        centro = centro_granula(concept_id)
        if centro is None:
            centro = centro_espacial(umm)
        if centro is None:
            continue

        lat, lon = (round(centro[0], 4), round(centro[1], 4))
        if any(dist_km((lat, lon), punto) < 15 for punto in existentes):
            continue

        sitio = ubicacion(umm, lat, texto)
        if sitio is None:
            continue
        nombre, lugar, pais = sitio
        sitio_id = f"cmr-{slug(concept_id)}"
        if any(s["id"] == sitio_id for s in sitios):
            continue

        concept_url = (
            f"{CMR}/collections.umm_json?"
            + urllib.parse.urlencode({"concept_id": concept_id})
        )
        latitud = urllib.parse.quote(f"{lat:.4f}")
        longitud = urllib.parse.quote(f"{lon:.4f}")
        razones = {
            clave: "Sin calificar automáticamente: CMR no proporciona una medición de este rasgo."
            for clave in CLAVES_RASGOS
        }
        candidato = {
            "id": sitio_id,
            "nombre": nombre,
            "lugar": lugar,
            "pais": pais,
            "tipo": "candidato",
            "lat": lat,
            "lon": lon,
            "rasgos": {clave: None for clave in CLAVES_RASGOS},
            "motivos": razones,
            "resumen": (
                "Ubicación candidata detectada en metadatos de NASA Earthdata que "
                "describen explícitamente un ambiente análogo a Marte. La coordenada "
                "representa el centro de la cobertura del conjunto y requiere revisión."
            ),
            "pruebas": (
                "Revisar el conjunto Earthdata y las imágenes GIBS; completar los "
                "rasgos geológicos y biológicos con fuentes revisadas."
            ),
            "fuentes": [
                {
                    "titulo": f"NASA Earthdata CMR: {umm.get('EntryTitle', 'colección análoga a Marte')}",
                    "url": concept_url,
                },
                {
                    "titulo": "NASA Earthdata Search",
                    "url": f"https://search.earthdata.nasa.gov/search?q={urllib.parse.quote(umm.get('EntryTitle', 'Mars analog'))}",
                },
                {
                    "titulo": "NASA Worldview: imágenes satelitales del sitio",
                    "url": world_view_url(lat, lon),
                },
                {
                    "titulo": "NASA GIBS: documentación de visualizaciones satelitales",
                    "url": GIBS_DOCS,
                },
                {
                    "titulo": "NASA PDS: datos de misiones a Marte para comparación",
                    "url": f"{PDS}/products?keywords=Mars&limit=100",
                },
            ],
            "verificado": False,
            "cmr_concept_id": concept_id,
            "coordenada_aproximada": True,
        }
        candidatos.append(candidato)
        existentes.append((lat, lon))

    return candidatos


def productos_pds_marte():
    query = urllib.parse.urlencode({"keywords": "Mars", "limit": 100})
    respuesta = obtener_json(f"{PDS}/products?{query}")
    productos = []
    for producto in respuesta.get("data", []):
        titulo = producto.get("title", "")
        tipo = producto.get("type", "")
        if tipo not in ("Product_SIP_Deep_Archive", "Product_Collection", "Product_Observational"):
            continue
        if not re.search(r"\bmars\b", titulo, re.IGNORECASE):
            continue
        identificador = producto.get("id")
        if not identificador:
            continue
        productos.append(
            {
                "titulo": titulo,
                "tipo": tipo,
                "id": identificador,
                "url": f"{PDS}/products/{urllib.parse.quote(identificador, safe='')}",
            }
        )
    productos.sort(key=lambda producto: producto["titulo"].lower())
    return productos[:8]


def escribir_json(ruta, contenido):
    temporal = ruta.with_suffix(ruta.suffix + ".tmp")
    temporal.write_text(
        json.dumps(contenido, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporal.replace(ruta)


def main():
    sitios = json.loads(SITIOS.read_text(encoding="utf-8"))
    clima = json.loads(CLIMA.read_text(encoding="utf-8"))
    candidatos = descubrir_candidatos(sitios)

    for sitio in candidatos:
        clima["sitios"][sitio["id"]] = descargar_clima(sitio["lat"], sitio["lon"])

    if candidatos:
        sitios.extend(candidatos)
        clima["descargado"] = date.today().isoformat()
        escribir_json(SITIOS, sitios)
        escribir_json(CLIMA, clima)

    productos = productos_pds_marte()
    escribir_json(
        PDS_SALIDA,
        {
            "fuente": f"{PDS}/products",
            "descargado": date.today().isoformat(),
            "productos": productos,
        },
    )

    for sitio in candidatos:
        print(f"Nuevo candidato: {sitio['nombre']} ({sitio['lat']}, {sitio['lon']})")
    if not candidatos:
        print("Earthdata no encontró ubicaciones nuevas que cumplan el filtro.")
    print(f"Productos PDS de Marte: {len(productos)}")


if __name__ == "__main__":
    main()

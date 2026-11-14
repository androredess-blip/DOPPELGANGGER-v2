# Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
# Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
"""Descarga de NASA POWER la climatología anual de cada sitio y la guarda en data/clima.json.

Uso (desde la carpeta del proyecto):
    python scripts/descargar_clima.py

Solo usa la biblioteca estándar, no hay que instalar nada.
"""

import json
import time
import urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SITIOS = RAIZ / "data" / "sitios.json"
SALIDA = RAIZ / "data" / "clima.json"

URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
PARAMETROS = [
    "T2M", "T2M_MIN", "T2M_MAX", "T2M_RANGE",
    "PRECTOTCORR", "RH2M", "WS10M", "ALLSKY_SFC_SW_DWN",
]


def descargar(lat, lon):
    consulta = (
        f"{URL}?parameters={','.join(PARAMETROS)}&community=RE"
        f"&latitude={lat}&longitude={lon}&format=JSON"
    )
    with urllib.request.urlopen(consulta, timeout=60) as resp:
        datos = json.load(resp)

    valores = datos["properties"]["parameter"]
    fila = {"elev": datos["geometry"]["coordinates"][2]}
    for p in PARAMETROS:
        fila[p] = valores[p]["ANN"]
    return fila


def main():
    sitios = json.loads(SITIOS.read_text(encoding="utf-8"))
    clima = {}

    for s in sitios:
        try:
            clima[s["id"]] = descargar(s["lat"], s["lon"])
            print(f"ok   {s['nombre']}")
        except Exception as err:  # si uno falla, seguimos con los demás
            print(f"fallo {s['nombre']}: {err}")
        time.sleep(1)  # para no saturar la API

    salida = {
        "fuente": "NASA POWER, climatología anual (API temporal/climatology/point, comunidad RE)",
        "descargado": date.today().isoformat(),
        "sitios": clima,
    }
    SALIDA.write_text(json.dumps(salida, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nGuardado en {SALIDA} ({len(clima)} sitios)")


if __name__ == "__main__":
    main()

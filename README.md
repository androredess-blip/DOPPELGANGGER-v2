# Doppelgänger (versión 2): los dobles de la Luna y Marte en la Tierra

Proyecto del equipo **Gatitácticos** para el NASA Space Apps Challenge 2026,
reto *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*.

La página compara sitios de la Tierra con la región del polo sur lunar (donde se planea la base permanente)
y con Marte. Cada sitio recibe un puntaje de 0 a 100 en ocho dimensiones: geología, terreno,
temperatura e iluminación, agua y hielo, polvo y viento, habitabilidad, subsuelo y operación.

## Cómo verla en tu computadora

La página lee archivos JSON, así que necesita un servidor local (abrir `index.html` con doble clic no funciona).

```bash
python -m http.server 8000
```

Después abre http://localhost:8000. En VS Code también sirve la extensión *Live Server*.

## Publicarla con GitHub Pages

1. Sube todo el contenido de esta carpeta a la rama `main` del repositorio.
2. En el repositorio: **Settings → Pages → Branch: main / (root) → Save**.
3. En un par de minutos queda en `https://<usuario>.github.io/<repositorio>/`.

## Estructura

```
index.html            página principal
css/estilos.css       estilos
js/main.js            carga de datos y controles
js/puntaje.js         cálculo de similitud
js/mapa.js            mapa con Leaflet
js/ficha.js           ficha de cada sitio
js/radar.js           gráfica de radar en SVG
data/sitios.json      sitios, rasgos y fuentes
data/clima.json       datos de NASA POWER
data/modelo.json      dimensiones, indicadores, umbrales y pesos
scripts/descargar_clima.py   vuelve a descargar data/clima.json
```

## Agregar o corregir un sitio

1. Agrega el sitio en `data/sitios.json` con sus coordenadas, rasgos (0, 0.5 o 1) y fuentes.
2. Corre `python scripts/descargar_clima.py` para bajar su clima.
3. Cuando el equipo revise las fuentes del sitio, cambia `"verificado"` a `true`.

Para cambiar pesos o umbrales, edita `data/modelo.json`. La página se recalcula sola.

## Datos

- [NASA POWER](https://power.larc.nasa.gov): temperatura, lluvia, humedad, viento y elevación.
- [Regiones candidatas de Artemis III](https://www.nasa.gov/?p=748006) y [Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html) como referencia.
- Bibliografía de cada sitio: ver el campo `fuentes` en `data/sitios.json`.

## Uso de herramientas de IA

Usamos un asistente de IA para apoyar la programación de la página y la búsqueda inicial de bibliografía.
La elección del reto, los criterios, la verificación de fuentes y el análisis son del equipo.

### AI use (English)

This project was built with help from an AI assistant (Claude, Anthropic) for coding, an initial literature search and writing. The team chose the criteria, checked the data and sources, and made the analysis. Every code file carries a header saying so, and `index.html` has an `ai-assistance` meta tag. No AI-generated images are used: all images and maps come from NASA (POWER, GIBS/Worldview, Trek).

## Novedades de la versión 2

- Selector Tierra / Luna / Marte en la barra de arriba. **Tierra** muestra solo el catálogo de análogos, sin puntajes. **Luna** y **Marte** muestran únicamente sus propios parámetros, ranking, ficha y validación.
- Fondo animado (`js/fondo.js`): estrellas, estrellas fugaces, nebulosas, satélites y el astro de cada mundo; polvo y remolinos en Marte.
- 28 sitios: se agregaron 10 análogos que usan la NASA y la ESA (San Francisco, Islandia, Potrillo, Mistastin, Ries, Lonar, Bockfjord, Craters of the Moon, Hanksville) y un candidato (Kachchh, India).
- Cada rasgo de cada sitio tiene su motivo (`motivos` en `data/sitios.json`) y cada parámetro su explicación (`que`, `luna`, `marte` en `data/modelo.json`).
- La ficha muestra el desglose: valor medido, por qué importa, cómo se calculó y cuánto aporta al total.
- Al elegir un sitio, la página ya no baja sola: solo se mueve el mapa.

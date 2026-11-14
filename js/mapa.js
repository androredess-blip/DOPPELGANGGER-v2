// Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
// Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
// Mapas con Leaflet (se carga desde index.html como variable global L).
import { CAPAS_TIERRA, CAPAS_LUNA, CAPAS_MARTE, ATRIBUCION_GIBS, ATRIBUCION_TREK } from "./capas.js";

let mapa;
let capaSitios;

// Los colores salen de la paleta activa (variables CSS): entre más parecido,
// más claro y más grande el punto.
function variable(nombre) {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
}

function colorPara(total) {
  if (total >= 70) return variable("--claro");
  if (total >= 50) return variable("--acento");
  return variable("--oscuro");
}

function capasBase(definiciones, atribucion, extra = {}) {
  const capas = {};
  for (const [nombre, d] of Object.entries(definiciones)) {
    capas[nombre] = L.tileLayer(d.url, {
      maxNativeZoom: d.maxNativeZoom,
      maxZoom: 10,
      attribution: atribucion,
      minNativeZoom: 0,
      noWrap: extra.noWrap ?? false,
      bounds: extra.bounds,
    });
  }
  return capas;
}

function sinLeaflet(id) {
  document.getElementById(id).innerHTML =
    '<p class="aviso">No se pudo cargar el mapa. Revisa tu conexión a internet.</p>';
}

export function crearMapa(id) {
  if (typeof L === "undefined") return sinLeaflet(id);

  mapa = L.map(id, { worldCopyJump: true, minZoom: 2 }).setView([20, 0], 2);
  const capas = capasBase(CAPAS_TIERRA, ATRIBUCION_GIBS);
  capas["Imagen (Blue Marble)"].addTo(mapa);
  L.control.layers(capas, null, { collapsed: false, position: "topright" }).addTo(mapa);
  capaSitios = L.layerGroup().addTo(mapa);
}

export function pintarSitios(resultados, seleccionado, alElegir, modo = "inicio") {
  if (!mapa) return;
  capaSitios.clearLayers();
  const conPuntaje = modo === "luna" || modo === "marte";

  for (const r of resultados) {
    const s = r.sitio;
    const activo = s.id === seleccionado;
    if (!conPuntaje) {
      // vista general: solo dónde está cada análogo, sin puntajes
      const m = L.circleMarker([s.lat, s.lon], {
        radius: activo ? 10 : 7,
        color: activo ? variable("--marcador-activo") : variable("--fondo"),
        weight: activo ? 3 : 2,
        fillColor: s.tipo === "candidato" ? variable("--candidato") : variable("--acento"),
        fillOpacity: 0.95,
      });
      m.bindTooltip(`${s.nombre} · ${s.pais}`);
      m.on("click", () => alElegir(s.id));
      capaSitios.addLayer(m);
      continue;
    }
    const marcador = L.circleMarker([s.lat, s.lon], {
      radius: 6 + r.total / 10,
      color: activo ? variable("--marcador-activo") : s.tipo === "candidato" ? variable("--candidato") : variable("--fondo"),
      weight: activo ? 3 : 2,
      fillColor: colorPara(r.total),
      fillOpacity: 0.95,
    });
    marcador.bindTooltip(`${s.nombre} · ${r.total}`);
    marcador.on("click", () => alElegir(s.id));
    capaSitios.addLayer(marcador);
  }
}

export function centrarEn(sitio) {
  if (mapa) mapa.flyTo([sitio.lat, sitio.lon], 6, { duration: 0.8 });
}

// Mapas de la Luna y Marte. Los mosaicos de Trek están en proyección
// geográfica (2 x 1 mosaicos en el nivel 0), igual que EPSG:4326 de Leaflet.
const OBJETIVOS = {
  luna: (m) => {
    L.rectangle([[-90, -180], [-84, 180]], { color: "#ffd166", weight: 2, fillOpacity: 0.15 })
      .bindTooltip("Polo sur: zona de las 9 regiones candidatas de Artemis III", { sticky: true })
      .addTo(m);

    // Cráteres de control sin hielo (Magaña et al.): ecuatoriales y pre-nectarianos,
    // donde no se pueden acumular volátiles congelados. Se comparan con los cráteres del polo sur.
    // Longitudes positivas = Este.
    const controles = [
      { nombre: "Morozov F", lat: 4.92, lon: 130.2 },
      { nombre: "Van Maanen", lat: 36.03, lon: 128.18 },
      { nombre: "Fraunhofer E", lat: -43.2, lon: 61.57 },
      { nombre: "Brisbane", lat: -49.2, lon: 68.76 },
      { nombre: "Rosenberger C", lat: -52.28, lon: 42.2 },
      { nombre: "Asclepi", lat: -55.19, lon: 25.52 },
    ];
    for (const c of controles) {
      L.circleMarker([c.lat, c.lon], { radius: 6, color: "#ffffff", weight: 2, fillColor: "#4f9bf0", fillOpacity: 1 })
        .bindTooltip(`${c.nombre}: cráter de control sin hielo`)
        .addTo(m);
    }

    // Cráter Amundsen: sector iluminado (~220 km²) usado como análogo térmico
    // de su sector en sombra permanente (~245 km²).
    L.circleMarker([-84.44, 83.07], { radius: 8, color: "#ffffff", weight: 2, fillColor: "#ffd166", fillOpacity: 1 })
      .bindTooltip("Cráter Amundsen: sector iluminado vs. sector en sombra permanente")
      .addTo(m);
  },
  marte: (m) => {
    const sitios = [
      { nombre: "Cráter Jezero (rover Perseverance)", lat: 18.38, lon: 77.58 },
      { nombre: "Cráter Gale (rover Curiosity)", lat: -5.4, lon: 137.85 },
    ];
    for (const s of sitios) {
      L.circleMarker([s.lat, s.lon], { radius: 7, color: "#ffffff", weight: 2, fillColor: "#ffd166", fillOpacity: 1 })
        .bindTooltip(s.nombre)
        .addTo(m);
    }
  },
};

export function crearMundo(id, cuerpo) {
  if (typeof L === "undefined") return sinLeaflet(id);

  const limites = [[-90, -180], [90, 180]];
  const m = L.map(id, {
    crs: L.CRS.EPSG4326,
    minZoom: -1,
    maxBounds: limites,
    maxBoundsViscosity: 1,
    zoomSnap: 0.5,
  });
  const definiciones = cuerpo === "luna" ? CAPAS_LUNA : CAPAS_MARTE;
  const capas = capasBase(definiciones, ATRIBUCION_TREK, { noWrap: true, bounds: limites });
  const inicial = cuerpo === "luna" ? "Topografía (LRO LOLA)" : "Topografía (MGS MOLA)";
  capas[inicial].addTo(m);
  L.control.layers(capas, null, { collapsed: false, position: "topright" }).addTo(m);
  OBJETIVOS[cuerpo](m);
  m.fitBounds(limites);
  return m;
}

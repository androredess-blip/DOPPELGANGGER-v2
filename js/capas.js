// Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
// Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
// Capas de imágenes de la NASA para los mapas y las fichas.
// Tierra: NASA GIBS (Global Imagery Browse Services).
// Luna y Marte: NASA Solar System Treks (Moon Trek y Mars Trek).

const GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
const TREK = "https://trek.nasa.gov/tiles";

export const CAPAS_TIERRA = {
  "Imagen (Blue Marble)": {
    url: `${GIBS}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`,
    maxNativeZoom: 8,
  },
  "Relieve (ASTER GDEM)": {
    url: `${GIBS}/ASTER_GDEM_Greyscale_Shaded_Relief/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpeg`,
    maxNativeZoom: 12,
  },
};

export const CAPAS_LUNA = {
  "Imagen (LRO WAC)": {
    url: `${TREK}/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    maxNativeZoom: 7,
  },
  "Topografía (LRO LOLA)": {
    url: `${TREK}/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/{z}/{y}/{x}.png`,
    maxNativeZoom: 6,
  },
};

export const CAPAS_MARTE = {
  "Imagen (Viking)": {
    url: `${TREK}/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    maxNativeZoom: 7,
  },
  "Topografía (MGS MOLA)": {
    url: `${TREK}/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`,
    maxNativeZoom: 6,
  },
};

// Imagen fija de un recuadro alrededor del sitio (API de capturas de Worldview).
export function imagenSitio(lat, lon, capa, lado = 1) {
  const m = lado / 2;
  const bbox = [lat - m, lon - m, lat + m, lon + m].map((v) => v.toFixed(3)).join(",");
  return (
    "https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot" +
    `&LAYERS=${capa}&CRS=EPSG:4326&BBOX=${bbox}&FORMAT=image/jpeg&WIDTH=480&HEIGHT=480`
  );
}

export const ATRIBUCION_GIBS =
  'Imágenes: <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener">NASA GIBS</a>';
export const ATRIBUCION_TREK =
  'Imágenes: <a href="https://trek.nasa.gov" target="_blank" rel="noopener">NASA Solar System Treks</a>';

// Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
// Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
// Gráfica de radar en SVG, sin librerías.
// Recibe las dimensiones de los dos cuerpos para dibujarlas encimadas.

const NS = "http://www.w3.org/2000/svg";

function el(nombre, attrs = {}, texto) {
  const nodo = document.createElementNS(NS, nombre);
  for (const [k, v] of Object.entries(attrs)) nodo.setAttribute(k, v);
  if (texto != null) nodo.textContent = texto;
  return nodo;
}

function punto(cx, cy, r, i, n) {
  const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
}

export function dibujarRadar(contenedor, series, activo) {
  const ancho = 420;
  const alto = 330;
  const cx = ancho / 2;
  const cy = alto / 2 + 4;
  const radio = 105;
  const etiquetas = series[0].dimensiones.map((d) => d.corto);
  const n = etiquetas.length;

  const svg = el("svg", { viewBox: `0 0 ${ancho} ${alto}`, class: "radar", role: "img" });
  svg.appendChild(el("title", {}, "Similitud por dimensión"));

  for (const nivel of [0.25, 0.5, 0.75, 1]) {
    const pts = etiquetas.map((_, i) => punto(cx, cy, radio * nivel, i, n).join(",")).join(" ");
    svg.appendChild(el("polygon", { points: pts, class: "radar-red" }));
  }

  etiquetas.forEach((texto, i) => {
    const [x, y] = punto(cx, cy, radio, i, n);
    svg.appendChild(el("line", { x1: cx, y1: cy, x2: x, y2: y, class: "radar-eje" }));
    const [lx, ly] = punto(cx, cy, radio + 22, i, n);
    const ancla = Math.abs(lx - cx) < 8 ? "middle" : lx > cx ? "start" : "end";
    svg.appendChild(el("text", { x: lx, y: ly + 4, "text-anchor": ancla, class: "radar-etiqueta" }, texto));
  });

  // primero el cuerpo no seleccionado, para que el activo quede encima
  const ordenadas = [...series].sort(
    (a, b) => (a.cuerpo === activo) - (b.cuerpo === activo)
  );
  for (const serie of ordenadas) {
    const pts = serie.dimensiones
      .map((d, i) => punto(cx, cy, radio * (d.valor ?? 0), i, n).join(","))
      .join(" ");
    const clase = `radar-serie radar-${serie.cuerpo}${serie.cuerpo === activo ? " activa" : ""}`;
    svg.appendChild(el("polygon", { points: pts, class: clase }));
  }

  contenedor.replaceChildren(svg);
}

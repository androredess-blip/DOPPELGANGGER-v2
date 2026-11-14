// Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
// Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
// Ficha de un sitio. En vista general solo se describe el lugar; con Luna o Marte
// se muestra el desglose de ese cuerpo: cada parámetro, su valor, por qué y cómo se calculó.
import { calcular, fortalezasYDebilidades } from "./puntaje.js";
import { dibujarRadar } from "./radar.js";
import { imagenSitio } from "./capas.js";
import { icono } from "./iconos.js";

const VISTAS = [
  { capa: "BlueMarble_NextGeneration", titulo: "Imagen satelital", nota: "Blue Marble, NASA" },
  { capa: "ASTER_GDEM_Greyscale_Shaded_Relief", titulo: "Relieve sombreado", nota: "ASTER GDEM, NASA/METI" },
  { capa: "ASTER_GDEM_Color_Shaded_Relief", titulo: "Elevación a color", nota: "ASTER GDEM, NASA/METI" },
];
const NOMBRE_CUERPO = { luna: "la Luna", marte: "Marte" };

const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const num = (v, dec = 1) => (v == null ? "—" : Number(v).toFixed(dec));
const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)} %`);

function galeria(sitio) {
  return VISTAS.map(
    (v) => `<figure class="vista">
      <img src="${imagenSitio(sitio.lat, sitio.lon, v.capa, 0.8)}" alt="${esc(v.titulo)} de ${esc(sitio.nombre)}"
           loading="lazy" onerror="this.closest('figure').classList.add('sin-imagen')">
      <figcaption><b>${v.titulo}</b> · ${v.nota}</figcaption>
    </figure>`
  ).join("");
}

function cabecera(sitio) {
  return `<header class="ficha-cabecera">
      <div>
        <p class="ficha-lugar">${icono("ubicacion", "ico-mini")} ${esc(sitio.lugar)}, ${esc(sitio.pais)} · ${sitio.lat}°, ${sitio.lon}°</p>
        <h3>${esc(sitio.nombre)}</h3>
      </div>
      <div class="etiquetas">
        <span class="etiqueta ${sitio.tipo}">${sitio.tipo === "candidato" ? "Candidato nuevo" : "Análogo que ya se usa"}</span>
        ${sitio.verificado ? `<span class="etiqueta ok">${icono("check", "ico-mini")} Verificado</span>` : `<span class="etiqueta pendiente">Por verificar</span>`}
      </div>
    </header>`;
}

function listaFuentes(sitio) {
  return sitio.fuentes.length
    ? sitio.fuentes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.titulo)}</a></li>`).join("")
    : `<li class="aviso">Sin fuente todavía. Falta investigar este sitio.</li>`;
}

// ---------- vista general (Tierra / inicio): solo el lugar ----------
export function mostrarFichaGeneral(contenedor, sitio) {
  contenedor.innerHTML = `
    ${cabecera(sitio)}
    <p class="ficha-resumen">${esc(sitio.resumen)}</p>
    <div class="galeria">${galeria(sitio)}</div>
    <p class="nota">Recuadro de unos 90 km por lado alrededor del sitio, visto por satélites de la NASA.</p>
    <div class="columnas">
      <div><h4>${icono("bandera", "ico-mini")} Para qué se usa o podría usarse</h4><p>${esc(sitio.pruebas)}</p></div>
      <div><h4>${icono("libro", "ico-mini")} Fuentes</h4><ul class="fuentes">${listaFuentes(sitio)}</ul></div>
    </div>
    <div class="invitacion">
      ${icono("estrella")}
      <p>Elige <b>Luna</b> o <b>Marte</b> en la barra de arriba para ver qué tanto se parece este sitio, parámetro por parámetro.</p>
    </div>`;
}

// ---------- vista de un cuerpo ----------
function filaIndicador(clave, valor, sitio, clima, modelo, cuerpo) {
  const ind = modelo.indicadores[clave];
  if (ind.tipo === "rasgo") {
    const v = sitio.rasgos[clave] ?? 0;
    const texto = clave === "aislamiento" ? `${v}` : v === 1 ? "Sí" : v === 0.5 ? "En parte" : "No";
    const motivo = sitio.motivos?.[clave] ?? "Las fuentes revisadas no lo reportan.";
    return `<li class="ind">
      <div class="ind-cabeza"><b>${ind.nombre}</b><span class="ind-valor v${String(v).replace(".", "")}">${texto}</span><span class="ind-pct">${pct(valor)}</span></div>
      <p>${esc(motivo)}</p>
      <p class="ind-como">${icono("libro", "ico-mini")} Calificado con las fuentes del sitio (1 = principal, 0.5 = en parte, 0 = no se reporta).</p>
    </li>`;
  }
  let medido;
  if (ind.tipo === "geo") medido = `${num(Math.abs(sitio.lat), 1)}° de latitud`;
  else medido = `${num(clima?.[ind.campo], ind.dec ?? 1)} ${ind.unidad ?? ""}`;
  return `<li class="ind">
    <div class="ind-cabeza"><b>${ind.nombre}</b><span class="ind-valor">${medido}</span><span class="ind-pct">${pct(valor)}</span></div>
    <p>${esc(ind[cuerpo])}</p>
    <p class="ind-como">${icono("satelite", "ico-mini")} ${esc(ind.fuente)}. Vale 0 % con ${ind.min} ${ind.unidad ?? ""} y 100 % con ${ind.max} ${ind.unidad ?? ""}.</p>
  </li>`;
}

export function mostrarFicha(contenedor, sitio, clima, modelo, cuerpo, lugar = {}) {
  const res = calcular(sitio, clima, modelo, cuerpo);
  const { fuertes, debiles } = fortalezasYDebilidades(res);
  const usadas = res.dimensiones.filter((d) => d.valor != null && d.peso);
  const sumaPesos = usadas.reduce((a, d) => a + d.peso, 0);

  const desglose = usadas
    .map((d) => {
      const aporte = (100 * d.peso * d.valor) / sumaPesos;
      return `<details class="dimension" ${d === usadas[0] ? "open" : ""}>
        <summary>
          ${icono(d.icono, "ico-dim")}
          <span class="dim-nombre">${d.nombre}<small>pesa ${Math.round(d.peso * 100)} %</small></span>
          <span class="pista"><span class="relleno" style="width:${Math.round(d.valor * 100)}%"></span></span>
          <b>${Math.round(d.valor * 100)}</b>
        </summary>
        <ul class="indicadores">${d.indicadores.map((i) => filaIndicador(i.clave, i.valor, sitio, clima, modelo, cuerpo)).join("")}</ul>
        <p class="dim-aporte">Promedio de la dimensión: <b>${Math.round(d.valor * 100)} %</b> → aporta <b>${aporte.toFixed(1)}</b> puntos al total.</p>
      </details>`;
    })
    .join("");

  const sumaTexto = usadas
    .map((d) => `<span>${Math.round(d.peso * 100)} % × ${(d.valor).toFixed(2)}</span>`)
    .join(" + ");

  const fuente = sitio.fuentes.length > 0;
  contenedor.innerHTML = `
    ${cabecera(sitio)}
    <p class="ficha-resumen">${esc(sitio.resumen)}</p>
    <div class="galeria">${galeria(sitio)}</div>

    <div class="resultado">
      <div class="puntaje-grande">
        <span>Parecido con ${NOMBRE_CUERPO[cuerpo]}</span>
        <b>${res.total}</b>
        <small>${esc(res.nivel)}${lugar.pos ? ` · lugar ${lugar.pos} de ${lugar.total}` : ""}</small>
      </div>
      <figure class="radar-caja">
        <div id="radar"></div>
        <figcaption>Similitud por dimensión (0 al centro, 100 en el borde)</figcaption>
      </figure>
      <div class="resumen-dims">
        <h4>${icono("check", "ico-mini")} Dónde se parece</h4>
        <ul class="lista-dim">${fuertes.map((d) => `<li>${esc(d.nombre)} <span class="dato">${Math.round(d.valor * 100)}</span></li>`).join("")}</ul>
        <h4>${icono("pendiente", "ico-mini")} Dónde falla</h4>
        <ul class="lista-dim">${debiles.map((d) => `<li>${esc(d.nombre)} <span class="dato">${Math.round(d.valor * 100)}</span></li>`).join("")}</ul>
      </div>
    </div>

    <h4 class="sub">${icono("regla", "ico-mini")} Desglose: por qué tiene este puntaje</h4>
    <p class="nota">Abre cada dimensión para ver sus parámetros, el valor medido, por qué importa para ${NOMBRE_CUERPO[cuerpo]} y cómo se calculó.</p>
    <div class="desglose">${desglose}</div>

    <div class="calculo">
      <h4>${icono("grafica", "ico-mini")} Cómo se calculó el total</h4>
      <p class="formula-web">P = 100 × (${sumaTexto}) / ${Math.round(sumaPesos * 100)} % = <b>${res.total}</b></p>
      <p class="nota">Además, ningún sitio de la Tierra reproduce la gravedad${cuerpo === "luna" ? ", el vacío lunar" : ", la atmósfera de Marte"} ni la radiación del espacio.</p>
    </div>

    <div class="columnas">
      <div>
        <h4>${icono("bandera", "ico-mini")} Qué se podría probar aquí</h4>
        <p>${esc(sitio.pruebas)}</p>
        <h4>${icono("escudo", "ico-mini")} Cómo verificamos este sitio</h4>
        <ul class="checklist">
          <li class="${fuente ? "ok" : ""}">${icono(fuente ? "check" : "pendiente", "ico-mini")} Fuente científica de sus rasgos</li>
          <li class="ok">${icono("check", "ico-mini")} Clima descargado de NASA POWER</li>
          <li class="${sitio.verificado ? "ok" : ""}">${icono(sitio.verificado ? "check" : "pendiente", "ico-mini")} Ubicación revisada en las imágenes de satélite de arriba</li>
          <li class="${sitio.verificado ? "ok" : ""}">${icono(sitio.verificado ? "check" : "pendiente", "ico-mini")} Revisión de dos integrantes del equipo</li>
        </ul>
      </div>
      <div>
        <h4>${icono("termometro", "ico-mini")} Clima del sitio (NASA POWER, promedio anual)</h4>
        <table class="tabla-clima">
          <tr><th>Temp. media</th><td>${num(clima?.T2M)} °C</td><th>Mínima</th><td>${num(clima?.T2M_MIN)} °C</td></tr>
          <tr><th>Oscilación</th><td>${num(clima?.T2M_RANGE)} °C</td><th>Lluvia</th><td>${num(clima?.PRECTOTCORR, 2)} mm/día</td></tr>
          <tr><th>Humedad</th><td>${num(clima?.RH2M, 0)} %</td><th>Viento</th><td>${num(clima?.WS10M)} m/s</td></tr>
          <tr><th>Elevación</th><td>${num(clima?.elev, 0)} m</td><th>Radiación solar</th><td>${num(clima?.ALLSKY_SFC_SW_DWN, 2)} kWh/m²/día</td></tr>
        </table>
        <h4>${icono("libro", "ico-mini")} Fuentes</h4>
        <ul class="fuentes">${listaFuentes(sitio)}</ul>
      </div>
    </div>`;

  dibujarRadar(contenedor.querySelector("#radar"), [{ cuerpo, dimensiones: usadas }], cuerpo);
}

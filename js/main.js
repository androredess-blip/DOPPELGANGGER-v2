// Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
// Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
import { ranking } from "./puntaje.js";
import { crearMapa, crearMundo, pintarSitios, centrarEn } from "./mapa.js";
import { mostrarFicha, mostrarFichaGeneral } from "./ficha.js";
import { iniciarFondo } from "./fondo.js";
import { icono, pintarIconos } from "./iconos.js";

// modo: "inicio" (azul) o "tierra" = vista general, sin puntajes.
// "luna" o "marte" = solo los parámetros y puntajes de ese cuerpo.
const estado = { modo: "inicio", filtro: "todos", busqueda: "", seleccionado: null };
const ES_CUERPO = (m) => m === "luna" || m === "marte";
let datos;
const mundosCreados = {};

const TEXTOS = {
  general: {
    titulo: "Los dobles de la Luna y Marte en la Tierra",
    entrada: "Antes de mandar personas al polo sur de la Luna o a Marte, el equipo y los procedimientos se prueban en lugares de la Tierra que se les parecen: los análogos. Elige Luna o Marte arriba para ver qué tanto se parece cada uno.",
    boton: "Ver todos los análogos",
    "exp-titulo": "Todos los análogos que consideramos",
    "par-titulo": "Parámetros",
  },
  luna: {
    titulo: "¿Qué lugares de la Tierra se parecen al polo sur de la Luna?",
    entrada: "Comparamos cada sitio con la región donde la NASA planea la base de Artemis: frío extremo, Sol rasante, cráteres, hielo en sombra, sin aire y sin viento.",
    boton: "Ver el ranking lunar",
    "obj-titulo": "Contra qué comparamos: el polo sur lunar",
    "exp-titulo": "Ranking: parecido al polo sur lunar",
    "par-titulo": "Parámetros de la Luna",
    "par-entrada": "Estos son los parámetros que usamos solo para la Luna. Cada dimensión pesa distinto según lo que importa para una base en el polo sur.",
  },
  marte: {
    titulo: "¿Qué lugares de la Tierra se parecen a Marte?",
    entrada: "Comparamos cada sitio con las zonas que exploran los rovers: aire delgado y seco, frío, polvo y viento, sales y lagos antiguos.",
    boton: "Ver el ranking marciano",
    "obj-titulo": "Contra qué comparamos: Marte",
    "exp-titulo": "Ranking: parecido a Marte",
    "par-titulo": "Parámetros de Marte",
    "par-entrada": "Estos son los parámetros que usamos solo para Marte. Aquí sí cuentan el polvo, el viento, las sales y la búsqueda de vida.",
  },
};

async function cargarJSON(ruta) {
  const resp = await fetch(ruta);
  if (!resp.ok) throw new Error(`No se pudo leer ${ruta}`);
  return resp.json();
}

async function cargarDatos() {
  const [modelo, sitios, clima] = await Promise.all([
    cargarJSON("data/modelo.json"),
    cargarJSON("data/sitios.json"),
    cargarJSON("data/clima.json"),
  ]);
  return { modelo, sitios, clima: clima.sitios };
}

const sitioPorId = (id) => datos.sitios.find((s) => s.id === id);

function filtrar(lista) {
  const q = estado.busqueda.trim().toLowerCase();
  return lista.filter((r) => {
    if (estado.filtro !== "todos" && r.sitio.tipo !== estado.filtro) return false;
    if (!q) return true;
    return `${r.sitio.nombre} ${r.sitio.pais} ${r.sitio.lugar}`.toLowerCase().includes(q);
  });
}

function resultadosVisibles() {
  if (ES_CUERPO(estado.modo)) return filtrar(ranking(datos.sitios, datos.clima, datos.modelo, estado.modo));
  const catalogo = [...datos.sitios]
    .sort((a, b) => a.pais.localeCompare(b.pais, "es") || a.nombre.localeCompare(b.nombre, "es"))
    .map((s) => ({ sitio: s }));
  return filtrar(catalogo);
}

function pintarLista(resultados) {
  const lista = document.getElementById("ranking");
  if (!resultados.length) {
    lista.innerHTML = `<li class="aviso">Ningún sitio coincide con la búsqueda.</li>`;
    return;
  }
  const cuerpo = ES_CUERPO(estado.modo);
  lista.classList.toggle("catalogo", !cuerpo);
  lista.innerHTML = resultados
    .map((r, i) => {
      const s = r.sitio;
      const etiqueta = s.tipo === "candidato" ? `<em class="mini-etq candidato">nuevo</em>` : `<em class="mini-etq">conocido</em>`;
      const derecha = cuerpo
        ? `<span class="mini-barra"><span style="width:${r.total}%"></span></span><b>${r.total}</b>`
        : etiqueta;
      return `<li class="${s.id === estado.seleccionado ? "elegido" : ""}" style="--i:${i}">
        <button type="button" data-id="${s.id}">
          <span class="pos">${cuerpo ? i + 1 : icono("ubicacion", "ico-mini")}</span>
          <span class="nombre">${s.nombre}<small>${s.lugar}, ${s.pais}${cuerpo && s.tipo === "candidato" ? " · candidato" : ""}</small></span>
          ${derecha}
        </button>
      </li>`;
    })
    .join("");
}

function pintarElegido() {
  const caja = document.getElementById("elegido");
  if (!estado.seleccionado) {
    caja.hidden = true;
    return;
  }
  const s = sitioPorId(estado.seleccionado);
  let extra = "";
  if (ES_CUERPO(estado.modo)) {
    const r = ranking(datos.sitios, datos.clima, datos.modelo, estado.modo);
    const pos = r.findIndex((x) => x.sitio.id === s.id);
    extra = `<span class="elegido-dato">${r[pos].total} pts · lugar ${pos + 1} de ${r.length}</span>`;
  }
  caja.hidden = false;
  caja.innerHTML = `${icono("ubicacion")}<div><b>${s.nombre}</b><small>${s.lugar}, ${s.pais}</small>${extra}</div>
    <a class="boton chico" href="#ficha">${icono("abajo")}<span>${ES_CUERPO(estado.modo) ? "Ver por qué" : "Ver ficha"}</span></a>`;
}

function pintarFicha() {
  const ficha = document.getElementById("ficha");
  if (!estado.seleccionado) {
    ficha.innerHTML = "";
    return;
  }
  const s = sitioPorId(estado.seleccionado);
  if (ES_CUERPO(estado.modo)) {
    const r = ranking(datos.sitios, datos.clima, datos.modelo, estado.modo);
    const pos = r.findIndex((x) => x.sitio.id === s.id) + 1;
    mostrarFicha(ficha, s, datos.clima[s.id], datos.modelo, estado.modo, { pos, total: r.length });
  } else {
    mostrarFichaGeneral(ficha, s);
  }
}

// Al elegir un sitio solo se mueve el mapa; la ficha se actualiza abajo sin saltar.
function seleccionar(id, mover = true) {
  estado.seleccionado = id;
  if (mover) centrarEn(sitioPorId(id));
  actualizarVista();
  pintarFicha();
}

function actualizarVista() {
  const resultados = resultadosVisibles();
  pintarLista(resultados);
  pintarSitios(resultados, estado.seleccionado, (id) => seleccionar(id), estado.modo);
  pintarElegido();
}

function aplicarTextos() {
  const t = ES_CUERPO(estado.modo) ? TEXTOS[estado.modo] : TEXTOS.general;
  document.querySelectorAll("[data-texto]").forEach((el) => {
    const v = t[el.dataset.texto] ?? TEXTOS.general[el.dataset.texto];
    if (v != null) el.textContent = v;
  });
  document.getElementById("titulo-ranking").textContent = ES_CUERPO(estado.modo)
    ? `Ranking ${estado.modo === "luna" ? "lunar" : "marciano"} (0 a 100)`
    : "Catálogo de análogos";
}

function cambiarModo(modo, alternar = false) {
  // en el selector de arriba, un segundo clic sobre el mundo elegido regresa al inicio (azul)
  estado.modo = alternar && estado.modo === modo ? "inicio" : modo;
  document.documentElement.dataset.tema = estado.modo;
  document.querySelectorAll(".selector [data-cuerpo]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.cuerpo === estado.modo);
  });
  aplicarTextos();

  if (ES_CUERPO(estado.modo)) {
    if (!mundosCreados[estado.modo]) {
      mundosCreados[estado.modo] = crearMundo(`mapa-${estado.modo}`, estado.modo);
    }
    setTimeout(() => mundosCreados[estado.modo]?.invalidateSize?.(), 60);
    // al entrar a un cuerpo, se elige el primer lugar si no había selección
    if (!estado.seleccionado) {
      estado.seleccionado = ranking(datos.sitios, datos.clima, datos.modelo, estado.modo)[0].sitio.id;
    }
  }
  pintarParametros();
  pintarVerificacion();
  actualizarVista();
  pintarFicha();
}

// ---------- parámetros (solo del cuerpo elegido) ----------
function textoUmbral(ind) {
  if (ind.tipo === "rasgo") return "Rasgo calificado con 0, 0.5 o 1 según las fuentes.";
  const u = ind.unidad ?? "";
  return `Vale 0 con ${ind.min} ${u} y vale 1 con ${ind.max} ${u}.`;
}

function pintarParametros() {
  const caja = document.getElementById("lista-parametros");
  if (!ES_CUERPO(estado.modo)) {
    caja.innerHTML = "";
    return;
  }
  const { modelo } = datos;
  const cuerpo = estado.modo;
  const dims = modelo.dimensiones
    .map((d) => ({ ...d, peso: modelo.pesos[cuerpo][d.id], claves: d[cuerpo] }))
    .filter((d) => d.claves.length && d.peso)
    .sort((a, b) => b.peso - a.peso);

  caja.innerHTML = dims
    .map(
      (d, i) => `<details class="parametro" style="--i:${i}" ${i === 0 ? "open" : ""}>
      <summary>
        ${icono(d.icono, "ico-dim")}
        <span class="par-nombre">${d.nombre}</span>
        <span class="par-peso"><span style="width:${d.peso * 100 * 4}%"></span></span>
        <b>${Math.round(d.peso * 100)} %</b>
      </summary>
      <ul>
        ${d.claves
          .map((c) => {
            const ind = modelo.indicadores[c];
            const fuente = ind.tipo === "rasgo" ? "Bibliografía de cada sitio" : ind.fuente;
            return `<li>
              <h4>${ind.nombre}</h4>
              <p><b>Qué mide:</b> ${ind.que}</p>
              <p><b>Por qué importa:</b> ${ind[cuerpo]}</p>
              <p class="par-dato">${icono(ind.tipo === "rasgo" ? "libro" : "satelite", "ico-mini")} ${fuente} · ${textoUmbral(ind)}</p>
            </li>`;
          })
          .join("")}
      </ul>
    </details>`
    )
    .join("");

  const fuera = modelo.dimensiones.filter((d) => !d[cuerpo].length || !modelo.pesos[cuerpo][d.id]);
  if (fuera.length) {
    caja.insertAdjacentHTML(
      "beforeend",
      `<p class="nota">No cuentan para ${cuerpo === "luna" ? "la Luna" : "Marte"}: ${fuera.map((d) => d.nombre).join(", ")}.</p>`
    );
  }

  document.getElementById("criterios").innerHTML =
    modelo.criterios_rasgos.map((c) => `<li><b>${c.valor}</b> ${c.texto}</li>`).join("") +
    `<li><b>Aislamiento</b> ${modelo.criterio_aislamiento}</li>`;
}

// ---------- verificación ----------
function spearman(a, b) {
  const n = a.length;
  let d = 0;
  for (let i = 0; i < n; i++) d += (a[i] - b[i]) ** 2;
  return 1 - (6 * d) / (n * (n * n - 1));
}

function pruebaPesos(cuerpo, corridas = 300) {
  const base = ranking(datos.sitios, datos.clima, datos.modelo, cuerpo).map((x) => x.sitio.id);
  let suma = 0;
  let primero = 0;
  for (let k = 0; k < corridas; k++) {
    const m = structuredClone(datos.modelo);
    for (const d in m.pesos[cuerpo]) m.pesos[cuerpo][d] *= 0.8 + 0.4 * Math.random();
    const r = ranking(datos.sitios, datos.clima, m, cuerpo).map((x) => x.sitio.id);
    suma += spearman(base.map((_, i) => i), base.map((id) => r.indexOf(id)));
    if (r[0] === base[0]) primero++;
  }
  return { rho: suma / corridas, primero: Math.round((100 * primero) / corridas) };
}

function pintarVerificacion() {
  const total = datos.sitios.length;
  const conFuente = datos.sitios.filter((s) => s.fuentes.length).length;
  const verificados = datos.sitios.filter((s) => s.verificado).length;
  document.getElementById("estado-verificacion").innerHTML = `
    <div>${icono("libro")}<b>${conFuente} de ${total}</b><span>sitios con fuente científica</span></div>
    <div>${icono("satelite")}<b>${total} de ${total}</b><span>con clima de NASA POWER</span></div>
    <div>${icono("personas")}<b>${verificados} de ${total}</b><span>revisados por el equipo</span></div>`;

  const caja = document.getElementById("validacion");
  if (!ES_CUERPO(estado.modo)) {
    caja.innerHTML = `<p class="nota">Elige Luna o Marte arriba para ver la prueba del método con sus propios parámetros.</p>`;
    return;
  }
  const cuerpo = estado.modo;
  const r = ranking(datos.sitios, datos.clima, datos.modelo, cuerpo);
  const conocidos = r.map((x, i) => [x, i]).filter(([x]) => x.sitio.tipo === "conocido");
  const arriba = conocidos.filter(([, i]) => i < r.length / 2).length;
  const { rho, primero } = pruebaPesos(cuerpo);
  caja.innerHTML = `
    <div class="paso"><span class="dato-grande">${arriba} de ${conocidos.length}</span><h4>¿Reconoce los análogos que ya se usan?</h4>
      <p>Análogos conocidos que quedan en la mitad superior del ranking ${cuerpo === "luna" ? "lunar" : "marciano"}.
      ${cuerpo === "marte" ? "Varios análogos conocidos son de entrenamiento lunar o volcánico, por eso no todos quedan arriba para Marte." : ""}</p></div>
    <div class="paso"><span class="dato-grande">${rho.toFixed(2)}</span><h4>¿Es estable?</h4>
      <p>Correlación media del ranking al mover cada peso ±20 % (300 pruebas, se calcula en tu navegador). El primer lugar se mantuvo en ${primero} % de las pruebas.</p></div>
    <div class="paso"><span class="dato-grande">64 800</span><h4>¿Escala a todo el planeta?</h4>
      <p>Celdas de 1° que cubren la Tierra. Probamos que calificarlas todas tarda menos de medio segundo.</p></div>`;
}

function pintarCifras() {
  const s = datos.sitios;
  document.getElementById("c-sitios").textContent = s.length;
  document.getElementById("c-conocidos").textContent = s.filter((x) => x.tipo === "conocido").length;
  document.getElementById("c-candidatos").textContent = s.filter((x) => x.tipo === "candidato").length;
  document.getElementById("c-paises").textContent = new Set(s.map((x) => x.pais)).size;
}

function conectarControles() {
  document.querySelectorAll("[data-cuerpo]").forEach((b) =>
    b.addEventListener("click", () => {
      const dentroDeSelector = b.closest(".selector");
      cambiarModo(b.dataset.cuerpo, Boolean(dentroDeSelector));
      if (!dentroDeSelector) document.getElementById("explorar").scrollIntoView({ behavior: "smooth" });
    })
  );
  document.getElementById("filtro").addEventListener("change", (e) => {
    estado.filtro = e.target.value;
    actualizarVista();
  });
  document.getElementById("buscar").addEventListener("input", (e) => {
    estado.busqueda = e.target.value;
    actualizarVista();
  });
  document.getElementById("ranking").addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-id]");
    if (boton) seleccionar(boton.dataset.id);
  });
}

async function iniciar() {
  iniciarFondo();
  pintarIconos();
  try {
    datos = await cargarDatos();
  } catch (err) {
    document.getElementById("ranking").innerHTML =
      `<li class="aviso">No se pudieron cargar los datos. Si abriste index.html directo, usa el archivo de un solo archivo o un servidor local (ver README).</li>`;
    console.error(err);
    return;
  }
  crearMapa("mapa");
  conectarControles();
  pintarCifras();
  aplicarTextos();
  pintarParametros();
  pintarVerificacion();
  actualizarVista();
}

iniciar();

// Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
// Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
// Íconos de línea en SVG (24 x 24). Toman el color del texto (currentColor).

const TRAZOS = {
  roca: '<path d="M4 17l3-8 5-3 5 2 3 7-4 4H8z"/><path d="M7 9l4 3 6-4M11 12l1 7"/>',
  crater: '<ellipse cx="12" cy="14" rx="9" ry="5"/><ellipse cx="12" cy="13.5" rx="4.5" ry="2.2"/><path d="M3 14c0-3 2-6 4-7M21 14c0-3-2-6-4-7"/>',
  termometro: '<path d="M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  gota: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  viento: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8"/>',
  microbio: '<circle cx="12" cy="12" r="5"/><circle cx="10.5" cy="11" r="1"/><circle cx="13.5" cy="13.5" r="1"/><path d="M12 7V4M12 20v-3M7 12H4M20 12h-3M8.5 8.5 6.5 6.5M17.5 17.5l-2-2M15.5 8.5l2-2M6.5 17.5l2-2"/>',
  cueva: '<path d="M3 20c0-8 4-14 9-14s9 6 9 14"/><path d="M8 20c0-4 2-7 4-7s4 3 4 7"/>',
  bandera: '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
  tierra: '<circle cx="12" cy="12" r="9"/><path d="M6.5 6.8c1.6.4 2.4 1.6 2 3-.3 1.1-1.6 1.3-1.6 2.6 0 1.4 1.5 1.8 1.7 3.3M13.5 3.2c-.6 1.3.1 2.4 1.5 2.6 1.6.2 2.2 1.4 1.5 2.6-.6 1 .2 2 1.4 2.2 1.2.2 2 .9 2.4 1.9"/>',
  luna: '<path d="M15.2 2.6A9.6 9.6 0 1 0 21.4 17 8 8 0 0 1 15.2 2.6Z"/>',
  marte: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="9" r="1.6"/><circle cx="15" cy="14.5" r="2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>',
  pendiente: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M12 7v5l3 2"/>',
  ubicacion: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  libro: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h8M8 11h6"/>',
  escudo: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  regla: '<path d="M4 4h4v16H4zM8 7h3M8 11h2M8 15h3M14 4l6 16M14 20l6-16"/>',
  personas: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M14.5 14.3c3.2-.6 6.5 1.4 6.5 5.7"/>',
  abajo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  satelite: '<path d="M7 7l4 4M13 13l4 4"/><rect x="3" y="3" width="5" height="5" transform="rotate(45 5.5 5.5)"/><rect x="15" y="15" width="5" height="5" transform="rotate(45 17.5 17.5)"/><circle cx="12" cy="12" r="2.5"/>',
  grafica: '<path d="M4 20V4M4 20h16"/><path d="M7 16l4-5 3 3 5-7"/>',
  estrella: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
};

export function icono(nombre, clase = "ico") {
  const t = TRAZOS[nombre] ?? TRAZOS.estrella;
  return `<svg class="${clase}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${t}</svg>`;
}

// Rellena todos los <i data-ico="nombre"> de la página.
export function pintarIconos(raiz = document) {
  raiz.querySelectorAll("[data-ico]").forEach((el) => {
    el.innerHTML = icono(el.dataset.ico, el.dataset.clase || "ico");
  });
}

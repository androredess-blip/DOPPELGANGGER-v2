// Hecho con apoyo de un asistente de IA (Claude, Anthropic) y revisado por el equipo Gatitácticos.
// Written with help from an AI assistant (Claude, Anthropic) and reviewed by team Gatitácticos.
// Fondo animado: cielo con estrellas que se desplazan, estrellas fugaces, nebulosas,
// satélites y el astro que se vería desde cada mundo. Se dibuja en un <canvas> fijo
// detrás de la página. Si la persona pidió menos movimiento, se dibuja quieto.

const PERFILES = {
  inicio: {
    estrella: "207,224,255", densidad: 1.1, fugaz: "159,211,255", fugacesPorSeg: 0.25,
    nebulosas: ["79,155,240", "120,90,220"], astro: null, polvo: null,
  },
  // Tierra: noche cálida, motas doradas que suben y la Luna en el cielo
  tierra: {
    estrella: "243,223,191", densidad: 0.8, fugaz: "236,201,143", fugacesPorSeg: 0.15,
    nebulosas: ["201,138,75", "120,150,80"], astro: "luna",
    polvo: { color: "214,160,96", cantidad: 60, vx: 0.08, vy: -0.2, tam: [1, 2.6], alfa: [0.15, 0.5] },
  },
  // Luna: cielo negro sin atmósfera, muchas estrellas, lluvia de fugaces y la Tierra a lo lejos
  luna: {
    estrella: "255,255,255", densidad: 1.8, fugaz: "222,234,255", fugacesPorSeg: 0.9,
    nebulosas: ["185,203,230", "110,130,170"], astro: "tierra", polvo: null,
  },
  // Marte: tormenta de polvo rojizo, meteoros anaranjados, remolinos y sus dos lunas
  marte: {
    estrella: "255,217,199", densidad: 0.6, fugaz: "255,154,107", fugacesPorSeg: 0.4,
    nebulosas: ["224,104,58", "150,60,30"], astro: "fobos",
    polvo: { color: "224,112,64", cantidad: 150, vx: 0.9, vy: 0.06, tam: [0.8, 2.4], alfa: [0.12, 0.45] },
    remolinos: true,
  },
};

const azar = (a, b) => a + Math.random() * (b - a);

export function iniciarFondo() {
  const lienzo = document.createElement("canvas");
  lienzo.id = "cielo";
  lienzo.setAttribute("aria-hidden", "true");
  document.body.prepend(lienzo);
  const ctx = lienzo.getContext("2d");
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let ancho = 0, alto = 0;
  let perfil = PERFILES.inicio;
  let estrellas = [], fugaces = [], motas = [], satelites = [], remolinos = [], nebulosas = [];

  function crearTodo() {
    const n = Math.round(((ancho * alto) / 9000) * perfil.densidad);
    estrellas = Array.from({ length: n }, () => ({
      x: Math.random() * ancho, y: Math.random() * alto,
      r: Math.random() < 0.08 ? azar(1.2, 1.9) : azar(0.4, 1.1),
      fase: Math.random() * Math.PI * 2, vel: azar(0.6, 2.2),
      capa: Math.random() < 0.3 ? 2 : 1, // las de la capa 2 se mueven más (paralaje)
    }));
    const p = perfil.polvo;
    motas = p
      ? Array.from({ length: p.cantidad }, () => ({
          x: Math.random() * ancho, y: Math.random() * alto, r: azar(...p.tam), a: azar(...p.alfa),
          vx: p.vx * azar(0.5, 1.5), vy: p.vy * azar(0.5, 1.5), ondula: Math.random() * Math.PI * 2,
        }))
      : [];
    nebulosas = perfil.nebulosas.map((color, i) => ({
      color, x: azar(0.1, 0.9) * ancho, y: azar(0.1, 0.9) * alto,
      r: azar(0.35, 0.55) * Math.max(ancho, alto), vx: azar(-0.06, 0.06), vy: azar(-0.04, 0.04), a: i ? 0.07 : 0.1,
    }));
    fugaces = [];
    satelites = [];
    remolinos = [];
  }

  function medir() {
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    ancho = window.innerWidth;
    alto = window.innerHeight;
    lienzo.width = ancho * escala;
    lienzo.height = alto * escala;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    crearTodo();
  }

  function lanzarFugaz() {
    const angulo = azar(0.35, 0.75);
    const rapidez = azar(9, 16);
    fugaces.push({
      x: azar(-0.1, 0.8) * ancho, y: azar(-0.05, 0.45) * alto,
      vx: Math.cos(angulo) * rapidez, vy: Math.sin(angulo) * rapidez,
      largo: azar(80, 200), vida: 0, dura: azar(45, 85), grosor: azar(1.2, 2.4),
    });
  }

  function lanzarSatelite() {
    const izquierda = Math.random() < 0.5;
    satelites.push({
      x: izquierda ? -10 : ancho + 10, y: azar(0.05, 0.6) * alto,
      vx: (izquierda ? 1 : -1) * azar(0.5, 0.9), vy: azar(-0.1, 0.1), t: 0,
    });
  }

  function lanzarRemolino() {
    remolinos.push({ x: azar(0.1, 0.9) * ancho, y: alto * azar(0.75, 0.95), vida: 0, dura: azar(400, 700), giro: Math.random() * 6 });
  }

  function dibujarNebulosas() {
    for (const n of nebulosas) {
      if (!quieto) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < -n.r * 0.3 || n.x > ancho + n.r * 0.3) n.vx *= -1;
        if (n.y < -n.r * 0.3 || n.y > alto + n.r * 0.3) n.vy *= -1;
      }
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `rgba(${n.color},${n.a})`);
      g.addColorStop(1, `rgba(${n.color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, ancho, alto);
    }
  }

  function dibujarAstro(t) {
    if (!perfil.astro) return;
    const R = Math.min(ancho, alto) * 0.06 + 18;
    // abajo a la izquierda, para no tapar los globos de la portada
    const x = R * 1.6;
    const y = alto - R * 2.2 + Math.sin(t / 9000) * 8;
    if (perfil.astro === "tierra") {
      // la Tierra vista desde la Luna: azul con nubes y un halo
      const halo = ctx.createRadialGradient(x, y, R * 0.9, x, y, R * 1.8);
      halo.addColorStop(0, "rgba(120,170,255,.28)");
      halo.addColorStop(1, "rgba(120,170,255,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, R * 1.8, 0, Math.PI * 2); ctx.fill();
      const cuerpo = ctx.createRadialGradient(x - R * 0.4, y - R * 0.4, R * 0.1, x, y, R);
      cuerpo.addColorStop(0, "#9cc8ff"); cuerpo.addColorStop(0.6, "#2f6fc4"); cuerpo.addColorStop(1, "#0d2a5c");
      ctx.fillStyle = cuerpo; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = R * 0.12; ctx.lineCap = "round";
      const giro = (t / 30000) % (Math.PI * 2);
      for (let i = 0; i < 4; i++) {
        const yy = y - R * 0.6 + i * R * 0.4;
        const dx = Math.sin(giro + i) * R * 0.5;
        ctx.beginPath(); ctx.moveTo(x - R * 0.7 + dx, yy); ctx.lineTo(x - R * 0.1 + dx, yy + R * 0.08); ctx.stroke();
      }
      // lado de noche
      ctx.fillStyle = "rgba(5,8,15,.55)"; ctx.beginPath(); ctx.arc(x + R * 0.55, y + R * 0.2, R * 1.05, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (perfil.astro === "luna") {
      const halo = ctx.createRadialGradient(x, y, R * 0.8, x, y, R * 2);
      halo.addColorStop(0, "rgba(255,236,200,.22)"); halo.addColorStop(1, "rgba(255,236,200,0)");
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, R * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f3e6cc"; ctx.beginPath(); ctx.arc(x, y, R * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(160,140,110,.35)";
      for (const [a, b, r] of [[-0.3, -0.2, 0.18], [0.2, 0.25, 0.14], [0.1, -0.35, 0.1]]) {
        ctx.beginPath(); ctx.arc(x + a * R, y + b * R, r * R, 0, Math.PI * 2); ctx.fill();
      }
    } else if (perfil.astro === "fobos") {
      // Fobos y Deimos: dos lunas pequeñas e irregulares que cruzan despacio
      const lunas = [
        { r: R * 0.22, periodo: 60000, radio: ancho * 0.35, alto: alto * 0.18, color: "rgba(185,165,150,.75)" },
        { r: R * 0.13, periodo: 140000, radio: ancho * 0.42, alto: alto * 0.1, color: "rgba(216,200,187,.7)" },
      ];
      for (const l of lunas) {
        const a = (t / l.periodo) * Math.PI * 2;
        const lx = ancho / 2 + Math.cos(a) * l.radio;
        const ly = alto * 0.22 + Math.sin(a) * l.alto;
        ctx.fillStyle = l.color;
        ctx.beginPath(); ctx.ellipse(lx, ly, l.r * 1.25, l.r, a * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(60,30,20,.35)";
        ctx.beginPath(); ctx.arc(lx + l.r * 0.3, ly - l.r * 0.2, l.r * 0.3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function dibujar(t, dt) {
    ctx.clearRect(0, 0, ancho, alto);
    dibujarNebulosas();

    for (const e of estrellas) {
      if (!quieto) {
        e.x -= 0.03 * e.capa * dt * 60 * 0.5;
        if (e.x < -2) e.x = ancho + 2;
      }
      const brillo = quieto ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(e.fase + (t / 1000) * e.vel));
      ctx.fillStyle = `rgba(${perfil.estrella},${brillo})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
      if (e.r > 1.5 && brillo > 0.85) {
        ctx.strokeStyle = `rgba(${perfil.estrella},${(brillo - 0.85) * 2})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(e.x - 5, e.y); ctx.lineTo(e.x + 5, e.y); ctx.moveTo(e.x, e.y - 5); ctx.lineTo(e.x, e.y + 5); ctx.stroke();
      }
    }

    dibujarAstro(t);

    for (const s of satelites) {
      s.x += s.vx; s.y += s.vy; s.t += dt;
      const parpadeo = Math.sin(s.t * 6) > 0.6 ? 1 : 0.35;
      ctx.fillStyle = `rgba(255,255,255,${parpadeo})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.4, 0, Math.PI * 2); ctx.fill();
    }
    satelites = satelites.filter((s) => s.x > -20 && s.x < ancho + 20);

    if (perfil.polvo) {
      for (const m of motas) {
        if (!quieto) {
          m.x += m.vx + Math.sin(t / 1400 + m.ondula) * 0.25;
          m.y += m.vy + Math.cos(t / 1700 + m.ondula) * 0.12;
          if (m.x > ancho + 5) m.x = -5;
          if (m.x < -5) m.x = ancho + 5;
          if (m.y > alto + 5) m.y = -5;
          if (m.y < -5) m.y = alto + 5;
        }
        ctx.fillStyle = `rgba(${perfil.polvo.color},${m.a})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    for (const r of remolinos) {
      r.vida++;
      const f = Math.sin(Math.PI * Math.min(r.vida / r.dura, 1));
      r.x += 0.25;
      for (let k = 0; k < 26; k++) {
        const h = k * 6;
        const ang = r.giro + r.vida * 0.12 + k * 0.7;
        const rad = 4 + k * 1.3;
        ctx.fillStyle = `rgba(224,140,90,${0.12 * f * (1 - k / 30)})`;
        ctx.beginPath(); ctx.arc(r.x + Math.cos(ang) * rad, r.y - h, 2 + k * 0.15, 0, Math.PI * 2); ctx.fill();
      }
    }
    remolinos = remolinos.filter((r) => r.vida < r.dura);

    for (const f of fugaces) {
      f.x += f.vx; f.y += f.vy; f.vida++;
      const desvanece = Math.sin(Math.PI * Math.min(f.vida / f.dura, 1));
      const norma = Math.hypot(f.vx, f.vy);
      const cx = f.x - (f.vx / norma) * f.largo;
      const cy = f.y - (f.vy / norma) * f.largo;
      const estela = ctx.createLinearGradient(f.x, f.y, cx, cy);
      estela.addColorStop(0, `rgba(${perfil.fugaz},${0.95 * desvanece})`);
      estela.addColorStop(1, `rgba(${perfil.fugaz},0)`);
      ctx.strokeStyle = estela; ctx.lineWidth = f.grosor; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${desvanece})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.grosor, 0, Math.PI * 2); ctx.fill();
    }
    fugaces = fugaces.filter((f) => f.vida < f.dura && f.x < ancho + 250 && f.y < alto + 250);
  }

  let anterior = 0;
  function cuadro(t) {
    const dt = anterior ? Math.min((t - anterior) / 1000, 0.1) : 0;
    anterior = t;
    if (!document.hidden) {
      if (Math.random() < perfil.fugacesPorSeg * dt) lanzarFugaz();
      if (Math.random() < 0.06 * dt) lanzarSatelite();
      if (perfil.remolinos && remolinos.length < 2 && Math.random() < 0.08 * dt) lanzarRemolino();
      dibujar(t, dt);
    }
    requestAnimationFrame(cuadro);
  }

  function cambiarPerfil() {
    const tema = document.documentElement.dataset.tema || "inicio";
    perfil = PERFILES[tema] || PERFILES.inicio;
    crearTodo();
    if (perfil.fugacesPorSeg > 0.5 && !quieto) for (let i = 0; i < 2; i++) lanzarFugaz(); // bienvenida
    if (quieto) dibujar(0, 0);
  }

  window.addEventListener("resize", () => {
    medir();
    if (quieto) dibujar(0, 0);
  });
  new MutationObserver(cambiarPerfil).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-tema"],
  });

  medir();
  cambiarPerfil();
  if (!quieto) requestAnimationFrame(cuadro);
}

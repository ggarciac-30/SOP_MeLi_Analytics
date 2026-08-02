/**
 * script.js
 * -----------------------------------------------------------------------
 * 1) Carga data/resultados.json (fetch) — TODOS los números y textos
 *    del sitio viven ahí. Este archivo solo lee y renderiza.
 * 2) Maneja navegación del sidebar, menú móvil y el aviso de rotar
 *    pantalla.
 * 3) Inicializa las gráficas (Chart.js) dentro de inicializarGraficos().
 *
 * Nota: algunos navegadores bloquean fetch() en archivos locales
 * (file://). Si el JSON no carga, sirve la carpeta con un servidor
 * local: `python -m http.server` y abre http://localhost:8000
 * -----------------------------------------------------------------------
 */

const $ = (sel, root = document) => root.querySelector(sel);
const crear = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

/* =======================================================================
   OVERLAY DE ROTACION
   ======================================================================= */
function checkOrientation() {
  const overlay = $("#rotate-message");
  if (!overlay) return;
  const esMovilAngosto = window.innerWidth <= 760;
  const esVertical = window.innerHeight > window.innerWidth;
  overlay.classList.toggle("visible", esMovilAngosto && esVertical);
}
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

/* =======================================================================
   MENU MOVIL
   ======================================================================= */
function initMenu() {
  const sidebar = $("#sidebar");
  const toggle = $("#menuToggle");
  toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  sidebar.querySelectorAll(".nav-link").forEach(a =>
    a.addEventListener("click", () => sidebar.classList.remove("open"))
  );
}

/* =======================================================================
   NAV ACTIVO AL HACER SCROLL
   ======================================================================= */
function initActiveNav() {
  const links = [...document.querySelectorAll(".nav-link[data-section]")];
  const secciones = links
    .map(l => document.getElementById(l.dataset.section))
    .filter(Boolean);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove("active"));
        const link = links.find(l => l.dataset.section === entry.target.id);
        if (link) link.classList.add("active");
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });

  secciones.forEach(s => io.observe(s));
}

/* =======================================================================
   RENDER: cada funcion llena una seccion a partir de DATA
   ======================================================================= */
function renderHero(data) {
  $("#hero-badge").textContent = data.meta.badgeAnalisis;
  $("#hero-titulo").textContent = data.hero.titulo;
  $("#hero-subtitulo").textContent = data.hero.subtitulo;
  const grid = $("#hero-stats");
  data.hero.stats.forEach(s => {
    const d = crear("div", "stat reveal");
    d.innerHTML = `<div class="valor">${s.valor}</div><div class="etiqueta">${s.etiqueta}</div>`;
    grid.appendChild(d);
  });
}

function renderObjetivo(data) {
  const o = data.objetivo;
  $("#objetivo-texto").innerHTML = `<p>${o.texto}</p>`;
  $("#objetivo-callout-icono").textContent = o.callout.icono;
  $("#objetivo-callout-titulo").textContent = o.callout.titulo;
  $("#objetivo-callout-texto").textContent = o.callout.texto;
  $("#objetivo-entregables").innerHTML = o.entregables.map(t => `<li>${t}</li>`).join("");
  $("#objetivo-consideraciones").innerHTML = o.consideraciones.map(t => `<li>${t}</li>`).join("");
}

function renderDataset(data) {
  const d = data.dataset;
  $("#dataset-texto").innerHTML = `<p>${d.texto}</p>`;
  const grid = $("#dataset-cards");
  d.fuentes.forEach(f => {
    const c = crear("div", "card reveal");
    c.innerHTML = `<h3>${f.titulo}</h3><p>${f.texto}</p>`;
    grid.appendChild(c);
  });
}

function renderCalidadDatos(data) {
  const cont = $("#calidad-datos-container");
  data.calidadDatos.forEach(item => {
    const div = crear("div", `alerta alerta-${item.severidad} reveal`);
    div.innerHTML = `<strong>${item.titulo}</strong><p>${item.texto}</p>`;
    cont.appendChild(div);
  });
}

/* --- helpers para armar piezas dentro de una tarjeta de fase --- */
function tablaHTML(tabla) {
  if (!tabla) return "";
  const head = `<tr>${tabla.columnas.map(c => `<th>${c}</th>`).join("")}</tr>`;
  const rows = tabla.filas.map((fila, i) => {
    const cls = tabla.destacada === i ? ' class="fila-destacada"' : "";
    return `<tr${cls}>${fila.map((v, j) => `<td>${v}${(tabla.destacada === i && j === 0) ? '<span class="badge-mini">Recomendado</span>' : ""}</td>`).join("")}</tr>`;
  }).join("");
  return `
    <div class="table-block">
      <div class="table-block-title">${tabla.titulo}</div>
      <div class="table-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>
      ${tabla.nota ? `<p class="tabla-nota">${tabla.nota}</p>` : ""}
    </div>`;
}

function hierarchyHTML(niveles) {
  if (!niveles) return "";
  const maxFilas = Math.max(...niveles.map(n => parseInt(n.filas.replace(/,/g, ""))));
  const rows = niveles.map(n => {
    const filasNum = parseInt(n.filas.replace(/,/g, ""));
    const widthPct = Math.max(6, (filasNum / maxFilas) * 100);
    return `
      <div class="hlevel">
        <div class="hn">${n.n}</div>
        <div class="hbar-wrap">
          <div class="hbar-fill" style="width:${widthPct}%"></div>
          <div class="hbar-content">
            <div>
              <span class="hbar-name">${n.nombre} <span style="color:var(--texto-tenue);font-family:var(--fuente-mono);font-size:11px"> / ${n.campo}</span></span>
              <span class="hbar-q">${n.pregunta}</span>
            </div>
            <div class="hbar-stats">
              <span>filas <b>${n.filas}</b></span>
              <span>respaldo prom. <b>${n.respaldo}</b></span>
              <span>respaldo máx. <b>${n.respaldoMax}</b></span>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");
  return `<div class="hierarchy">${rows}</div>`;
}

function leakToggleHTML(toggle, idx) {
  if (!toggle) return "";
  const canvasId = `chart-leak-${idx}`;
  return `
    <div class="leak-demo" data-mode="honesta" data-idx="${idx}">
      <div class="leak-top">
        <div class="toggle-row">
          <h4 style="margin:0;font-size:.95rem">Reconstruye la fuga tú mismo</h4>
          <div class="toggle-switch">
            <button class="modo-honesta active" data-mode="honesta">Honesta</button>
            <button class="modo-trampa" data-mode="trampa">Con trampa</button>
          </div>
        </div>
        <div class="leak-readout">
          <div class="rmsle-val">${toggle.honesta.rmsle.toFixed(4)}</div>
          <div class="rmsle-label">RMSLE real, semana 8 — nunca vista por el modelo</div>
        </div>
        <div class="chart-card"><canvas id="${canvasId}" height="90"></canvas></div>
        <p class="leak-note">${toggle.honesta.nota}</p>
      </div>
      <div class="leak-sql"><pre>${toggle.honesta.sql}</pre></div>
    </div>`;
}

function chartCardHTML(chart) {
  if (!chart) return "";
  return `<div class="chart-card"><canvas id="${chart.canvas}"></canvas></div>`;
}

function importanciaHTML(imp) {
  if (!imp) return "";
  return `
    <div class="table-block">
      <div class="table-block-title">${imp.titulo}</div>
      <div class="chart-card"><canvas id="chart-importancia"></canvas></div>
      <p class="tabla-nota">${imp.hallazgo}</p>
    </div>`;
}

function renderAnalisis(data) {
  const cont = $("#analisisContainer");
  data.analisis.forEach((fase, idx) => {
    const card = crear("div", "fase-card reveal");
    let body = "";

    if (fase.kpis) {
      body += `<div class="kpi-strip">${fase.kpis.map(k => `<div class="kpi"><div class="v">${k.valor}</div><div class="l">${k.etiqueta}</div></div>`).join("")}</div>`;
    }
    if (fase.reglaTemporal) {
      body += `<p class="regla-temporal">${fase.reglaTemporal}</p>`;
    }
    if (fase.hierarchy) {
      body += hierarchyHTML(fase.hierarchy);
    }
    if (fase.tabla) {
      body += tablaHTML(fase.tabla);
    }
    if (fase.chart) {
      body += chartCardHTML(fase.chart);
    }
    if (fase.explicacion) {
      body += `<p style="color:var(--texto-suave);font-size:.92rem;margin:16px 0">${fase.explicacion}</p>`;
    }
    if (fase.leakToggle) {
      body += leakToggleHTML(fase.leakToggle, idx);
    }
    if (fase.fugaEntrenamiento) {
      body += `<h4 class="mini-title" style="margin-top:20px">${fase.fugaEntrenamiento.titulo}</h4><p style="color:var(--texto-suave);font-size:.92rem">${fase.fugaEntrenamiento.texto}</p>`;
    }
    if (fase.justificacionLightGBM) {
      const j = fase.justificacionLightGBM;
      body += `<h4 class="mini-title" style="margin-top:20px">${j.titulo}</h4>
        <ul class="check-list">${j.puntos.map(p => `<li>${p}</li>`).join("")}</ul>
        <div class="code-block"><pre>${j.codigo}</pre></div>`;
    }
    if (fase.importancia) {
      body += importanciaHTML(fase.importancia);
    }
    if (fase.hallazgos) {
      body += `<div class="hallazgos-list"><div class="mini-title">Hallazgos clave</div><ul class="simple-list">${fase.hallazgos.map(h => `<li>${h}</li>`).join("")}</ul></div>`;
    }

    card.innerHTML = `
      <div class="fase-card-head">
        <span class="fase-tag">${fase.tag}</span>
        <h3>${fase.titulo}</h3>
        <p class="resumen">${fase.resumen}</p>
      </div>
      <div class="fase-card-body">${body}</div>`;
    cont.appendChild(card);
  });
}

function renderConclusiones(data) {
  $("#conclusionesContainer").innerHTML = data.conclusiones.map(c => `<li>${c}</li>`).join("");
}

function renderRecomendaciones(data) {
  $("#recomendacionesContainer").innerHTML = data.recomendaciones.map(r => `<li>${r}</li>`).join("");
}

/* =======================================================================
   GRAFICAS (Chart.js)
   Cada funcion busca su <canvas> por id; si no existe en el DOM
   (porque esa fase no lo generó), no hace nada.
   ======================================================================= */
function inicializarGraficos(data) {
  const GRID = "rgba(233,231,225,0.07)";
  const MUTED = "#9AA3B2";
  const AZUL = "#5B9BE0";
  const AMBAR = "#E0A339";
  const VERDE = "#4FAE7C";

  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = MUTED;

  // --- Fase A: comparativo escala real vs. logarítmica ---
  const logCtx = document.getElementById("chart-log");
  if (logCtx) {
    new Chart(logCtx, {
      type: "bar",
      data: {
        labels: ["Percentiles 1–80 (cuerpo)", "Percentiles 80–100 (cola)"],
        datasets: [
          { label: "Escala real", data: [0.114, 236.15], backgroundColor: AMBAR, borderRadius: 3 },
          { label: "Escala log(1+x)", data: [0.029, 0.308], backgroundColor: AZUL, borderRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: "top", labels: { boxWidth: 10, color: MUTED } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: MUTED } },
          y: { type: "logarithmic", grid: { color: GRID }, ticks: { color: MUTED } }
        }
      }
    });
  }

  // --- Fase D: resultados por método ---
  const resCtx = document.getElementById("chart-resultados");
  if (resCtx) {
    const rows = data.analisis.find(f => f.id === "fase-d").tabla.filas;
    const destacada = data.analisis.find(f => f.id === "fase-d").tabla.destacada;
    new Chart(resCtx, {
      type: "bar",
      data: {
        labels: rows.map(r => r[0]),
        datasets: [{
          data: rows.map(r => parseFloat(r[3])),
          backgroundColor: rows.map((r, i) => i === destacada ? VERDE : "rgba(154,163,178,0.35)"),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: GRID }, ticks: { color: MUTED }, title: { display: true, text: "RMSLE (menor es mejor)", color: MUTED } },
          y: { grid: { display: false }, ticks: { color: MUTED, font: { size: 10.5 } } }
        }
      }
    });
  }

  // --- Fase D: importancia de variables ---
  const impCtx = document.getElementById("chart-importancia");
  if (impCtx) {
    const vars = data.analisis.find(f => f.id === "fase-d").importancia.variables;
    new Chart(impCtx, {
      type: "bar",
      data: {
        labels: vars.map(v => v.nombre),
        datasets: [{
          data: vars.map(v => v.valor),
          backgroundColor: vars.map((v, i) => i === 0 ? AZUL : "rgba(91,155,224,0.35)"),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: GRID }, ticks: { color: MUTED } },
          y: { grid: { display: false }, ticks: { color: MUTED, font: { size: 10.5 } } }
        }
      }
    });
  }

  // --- Fase C: toggle honesta / con trampa ---
  document.querySelectorAll(".leak-demo").forEach(demo => {
    const idx = demo.dataset.idx;
    const faseC = data.analisis.find(f => f.leakToggle);
    const toggle = faseC.leakToggle;
    const canvas = document.getElementById(`chart-leak-${idx}`);
    let chart = null;

    function pintar(modo) {
      const bg = modo === "honesta" ? [AZUL, "rgba(224,163,57,0.25)"] : ["rgba(91,155,224,0.25)", AMBAR];
      if (chart) chart.destroy();
      chart = new Chart(canvas, {
        type: "bar",
        data: {
          labels: ["Honesta (real)", "Con trampa (inflada)"],
          datasets: [{ data: [toggle.honesta.rmsle, toggle.trampa.rmsle], backgroundColor: bg, borderRadius: 4, barThickness: 40 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: MUTED } },
            y: { grid: { color: GRID }, ticks: { color: MUTED }, title: { display: true, text: "RMSLE", color: MUTED } }
          }
        }
      });
    }

    function setMode(modo) {
      const d = toggle[modo];
      demo.setAttribute("data-mode", modo);
      demo.querySelector(".rmsle-val").textContent = d.rmsle.toFixed(4);
      demo.querySelector(".rmsle-label").textContent = modo === "honesta"
        ? "RMSLE real, semana 8 — nunca vista por el modelo"
        : "RMSLE inflado — semana 8 filtrada al propio cálculo";
      demo.querySelector(".leak-note").textContent = d.nota;
      demo.querySelector(".leak-sql pre").textContent = d.sql;
      demo.querySelectorAll(".toggle-switch button").forEach(b => b.classList.toggle("active", b.dataset.mode === modo));
      pintar(modo);
    }

    demo.querySelectorAll(".toggle-switch button").forEach(btn => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });
    setMode("honesta");
  });
}

/* =======================================================================
   REVEAL ON SCROLL
   ======================================================================= */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(i => io.observe(i));
}

/* =======================================================================
   BOOT
   ======================================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  checkOrientation();
  initMenu();

  try {
    const res = await fetch("data/resultados.json");
    const data = await res.json();

    renderHero(data);
    renderObjetivo(data);
    renderDataset(data);
    renderCalidadDatos(data);
    renderAnalisis(data);
    renderConclusiones(data);
    renderRecomendaciones(data);

    initActiveNav();
    inicializarGraficos(data);
    initReveal();
  } catch (err) {
    console.error("No se pudo cargar data/resultados.json:", err);
    console.error("Si estas abriendo index.html directamente (file://), sirve la carpeta con: python -m http.server");
  }
});

/* ================================================================
   SCRIPT PRINCIPAL — Caso S&OP Pronóstico de Demanda
   ================================================================
   Basado en el mismo patrón del repo de referencia
   (SOP_MeLi_Capacity_Business_Case). Este archivo hace lo mismo
   que el original:
   1. Carga los datos desde data/resultados.json
   2. Inyecta esos datos en el HTML (Análisis, Conclusiones, Recomendaciones)
   3. Controla el menu lateral (resaltar seccion activa + boton movil)
   4. Muestra el aviso de "rota tu dispositivo" en movil

   EXTENSION sobre el original: cada pregunta de "analisis" ahora
   tambien puede traer:
     - "grafica"   -> dibuja un Chart.js en vez de/ademas de <img>
     - "jerarquia" -> dibuja el funnel de niveles de la Fase B
     - "toggle"    -> dibuja el interruptor Honesta/Con trampa (Fase C)
   Todos son OPCIONALES, igual que "imagen" o "tabla" en el original.

   Si quieres AGREGAR una pregunta nueva al Análisis, NO necesitas
   tocar este archivo -- edita data/resultados.json.
   ================================================================ */


/* ----------------------------------------------------------------
   1. CARGA DE DATOS
   ---------------------------------------------------------------- */
fetch('data/resultados.json')
  .then(function (respuesta) {
    return respuesta.json();
  })
  .then(function (datos) {
    // Cada renderX() va en su propio try/catch: si algo falla en "analisis"
    // (por ejemplo, Chart.js bloqueado por un ad-blocker o firewall), las
    // secciones de "conclusiones" y "recomendaciones" igual se dibujan.
    // Sin esto, un solo error dejaba TODA la pagina a medio cargar.
    try { renderAnalisis(datos.analisis); }
    catch (error) { console.error('Error dibujando "analisis":', error); }

    try { renderListaSimple('conclusionesContainer', datos.conclusiones); }
    catch (error) { console.error('Error dibujando "conclusiones":', error); }

    try { renderListaSimple('recomendacionesContainer', datos.recomendaciones); }
    catch (error) { console.error('Error dibujando "recomendaciones":', error); }
  })
  .catch(function (error) {
    console.error('No se pudo cargar data/resultados.json:', error);
    console.error('Si abriste index.html con doble clic (file://), sirve la carpeta con: python -m http.server');
  });


/* ----------------------------------------------------------------
   2. FUNCIONES QUE INYECTAN DATOS EN EL HTML
   ---------------------------------------------------------------- */

/* Dibuja las tarjetas de pregunta/respuesta dentro de <div id="analisisContainer">.

   Cada pregunta puede tener estos campos (ver data/resultados.json):
     - numero      (obligatorio) el numero de la pregunta
     - pregunta    (obligatorio) el texto de la pregunta
     - respuesta   (obligatorio) el texto de la respuesta
     - kpis        (opcional) array de numeros destacados: [{valor, etiqueta, tipo}]
     - imagen      (opcional) ruta a una imagen (grafica exportada de Python)
     - tabla       (opcional) {titulo, encabezados: [...], filas: [[...]]}
     - jerarquia   (opcional) array de niveles: [{n, nombre, campo, pregunta, filas, respaldo, respaldoMax}]
     - grafica     (opcional) {tipo, canvasId, labels, datasets} -> Chart.js
     - toggle      (opcional) {honesta:{...}, trampa:{...}} -> interruptor Fase C
     - nota        (opcional) un texto destacado al final (supuesto o recomendacion) */
function renderAnalisis(preguntas) {
  var contenedor = document.getElementById('analisisContainer');
  if (!contenedor || !preguntas) return;

  preguntas.forEach(function (item) {
    // Cada tarjeta va en su propio try/catch: si UNA pregunta tiene un
    // problema (por ejemplo su grafica, si Chart.js no cargo), las demas
    // preguntas se siguen dibujando con normalidad.
    try {
      renderUnaTarjetaDeAnalisis(item, contenedor);
    } catch (error) {
      console.error('Error dibujando la pregunta ' + item.numero + ':', error);
    }
  });
}

function renderUnaTarjetaDeAnalisis(item, contenedor) {
    var tarjeta = document.createElement('div');
    tarjeta.className = 'analisis-card';

    // --- Encabezado: numero + pregunta ---
    var html = '<div class="analisis-header">' +
      '<span class="analisis-numero">' + item.numero + '</span>' +
      '<h3>' + item.pregunta + '</h3>' +
      '</div>';

    // --- KPIs (opcional) ---
    if (item.kpis && item.kpis.length > 0) {
      html += '<div class="kpi-grid kpi-grid-compacta">';
      item.kpis.forEach(function (kpi) {
        var esAlerta = kpi.tipo === 'alerta';
        html += '<div class="kpi-card' + (esAlerta ? ' alerta' : '') + '">' +
          '<span class="kpi-valor">' + kpi.valor + '</span>' +
          '<span class="kpi-etiqueta">' + kpi.etiqueta + '</span>' +
          '</div>';
      });
      html += '</div>';
    }

    // --- Imagen (opcional) ---
    if (item.imagen) {
      html += '<img class="analisis-imagen" src="' + item.imagen + '" alt="' + item.pregunta + '" />';
    }

    // --- Texto de la respuesta ---
    html += '<p class="analisis-respuesta">' + item.respuesta + '</p>';

    // --- Jerarquia (opcional, EXTENSION Fase B) ---
    if (item.jerarquia) {
      html += construirJerarquiaHTML(item.jerarquia);
    }

    // --- Tabla (opcional) ---
    if (item.tabla) {
      html += '<h4 class="analisis-tabla-titulo">' + item.tabla.titulo + '</h4>';
      html += '<table class="data-table">';
      html += '<thead><tr>' +
        item.tabla.encabezados.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
        '</tr></thead>';
      html += '<tbody>' +
        item.tabla.filas.map(function (fila) {
          return '<tr>' + fila.map(function (celda) { return '<td>' + celda + '</td>'; }).join('') + '</tr>';
        }).join('') +
        '</tbody>';
      html += '</table>';
    }

    // --- Toggle Honesta/Con trampa (opcional, EXTENSION Fase C) ---
    if (item.toggle) {
      html += construirToggleHTML(item.toggle, item.numero);
    }

    // --- Grafica Chart.js (opcional, EXTENSION) ---
    if (item.grafica) {
      html += '<div class="analisis-grafica-wrap"><canvas id="' + item.grafica.canvasId + '"></canvas></div>';
    }

    // --- Nota destacada (opcional) ---
    if (item.nota) {
      html += '<div class="analisis-nota">' + item.nota + '</div>';
    }

    tarjeta.innerHTML = html;
    contenedor.appendChild(tarjeta);

    // Las graficas se inicializan DESPUES de insertar el HTML (el <canvas> debe existir ya en el DOM)
    if (item.grafica) {
      dibujarGrafica(item.grafica);
    }
    if (item.toggle) {
      activarToggle(item.numero, item.toggle);
    }
}

// Dibuja una lista simple (usada en Conclusiones y Recomendaciones).
function renderListaSimple(idContenedor, items) {
  var contenedor = document.getElementById(idContenedor);
  if (!contenedor || !items) return;

  items.forEach(function (texto) {
    var li = document.createElement('li');
    li.textContent = texto;
    contenedor.appendChild(li);
  });
}


/* ----------------------------------------------------------------
   2b. EXTENSIONES: jerarquia, toggle y graficas
   ---------------------------------------------------------------- */

// Fase B: dibuja los 5 niveles de la jerarquia de encoders como barras
// proporcionales al numero de filas de cada nivel.
function construirJerarquiaHTML(niveles) {
  var maxFilas = 0;
  niveles.forEach(function (n) {
    var f = parseInt(String(n.filas).replace(/,/g, ''), 10);
    if (f > maxFilas) maxFilas = f;
  });

  var html = '<div class="jerarquia" style="margin-bottom: var(--espacio-sm)">';
  niveles.forEach(function (n) {
    var filasNum = parseInt(String(n.filas).replace(/,/g, ''), 10);
    var anchoPct = Math.max(8, (filasNum / maxFilas) * 100);
    html += '<div class="jerarquia-nivel">' +
      '<div class="jerarquia-barra-fondo">' +
        '<div class="jerarquia-barra-fill" style="width:' + anchoPct + '%"></div>' +
        '<div class="jerarquia-barra-contenido">' +
          '<div><span class="jerarquia-nombre">' + n.n + '. ' + n.nombre + '</span>' +
          '<span class="jerarquia-pregunta">' + n.pregunta + '</span></div>' +
          '<div class="jerarquia-stats">filas <b>' + n.filas + '</b> &nbsp;·&nbsp; respaldo prom. <b>' + n.respaldo + '</b></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';
  return html;
}

// Fase C: arma el HTML del toggle (los botones se activan aparte, en activarToggle())
function construirToggleHTML(toggle, numero) {
  var idPrefijo = 'leak-' + numero;
  return '<div class="leak-toggle-switch" id="' + idPrefijo + '-switch">' +
      '<button class="modo-honesta activo" data-modo="honesta">Honesta</button>' +
      '<button class="modo-trampa" data-modo="trampa">Con trampa</button>' +
    '</div>' +
    '<span class="leak-rmsle-valor modo-honesta" id="' + idPrefijo + '-valor">' + toggle.honesta.rmsle.toFixed(4) + '</span>' +
    '<span class="leak-rmsle-etiqueta" id="' + idPrefijo + '-etiqueta">RMSLE real, semana 8 — nunca vista por el modelo</span>' +
    '<div class="analisis-grafica-wrap"><canvas id="' + idPrefijo + '-chart" height="90"></canvas></div>' +
    '<a href="#calculos" class="ver-codigo-link">Ver el código SQL y Python completo en Cálculos →</a>';
}

// Activa los botones del toggle y dibuja/redibuja su mini-grafica
function activarToggle(numero, toggle) {
  var idPrefijo = 'leak-' + numero;
  var switchEl = document.getElementById(idPrefijo + '-switch');
  if (!switchEl) return;
  var valorEl = document.getElementById(idPrefijo + '-valor');
  var etiquetaEl = document.getElementById(idPrefijo + '-etiqueta');
  var canvas = document.getElementById(idPrefijo + '-chart');
  var chartInstancia = null;

  function pintarChart(modo) {
    // Si Chart.js no cargo, el numero grande y el SQL igual cambian de
    // modo (eso ya pasa en setModo) -- solo se omite la mini-grafica.
    if (typeof Chart === 'undefined' || !canvas) return;

    var colorHonesta = '#3483FA';
    var colorTrampa = '#FF7733';
    var colores = modo === 'honesta'
      ? [colorHonesta, 'rgba(255,119,51,0.25)']
      : ['rgba(52,131,250,0.25)', colorTrampa];

    if (chartInstancia) chartInstancia.destroy();
    chartInstancia = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Honesta (real)', 'Con trampa (inflada)'],
        datasets: [{
          data: [toggle.honesta.rmsle, toggle.trampa.rmsle],
          backgroundColor: colores,
          borderRadius: 6,
          barThickness: 46
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#E0E0E0' }, title: { display: true, text: 'RMSLE' } }
        }
      }
    });
  }

  function setModo(modo) {
    var d = toggle[modo];
    valorEl.textContent = d.rmsle.toFixed(4);
    valorEl.className = 'leak-rmsle-valor modo-' + modo;
    etiquetaEl.textContent = modo === 'honesta'
      ? 'RMSLE real, semana 8 — nunca vista por el modelo'
      : 'RMSLE inflado — semana 8 filtrada al propio cálculo';
    var botones = switchEl.querySelectorAll('button');
    botones.forEach(function (b) {
      if (b.getAttribute('data-modo') === modo) {
        b.classList.add('activo');
      } else {
        b.classList.remove('activo');
      }
    });
    pintarChart(modo);
  }

  var botonesIniciales = switchEl.querySelectorAll('button');
  botonesIniciales.forEach(function (btn) {
    btn.addEventListener('click', function () { setModo(btn.getAttribute('data-modo')); });
  });
  setModo('honesta');
}

// Aviso corto que reemplaza a un <canvas> cuando Chart.js no esta disponible
function construirAvisoGraficaNoDisponible() {
  var aviso = document.createElement('p');
  aviso.className = 'analisis-nota';
  aviso.textContent = 'La gráfica no pudo cargar (Chart.js fue bloqueado por la red o un bloqueador de anuncios). El resto del contenido de esta pregunta sigue disponible.';
  return aviso;
}

// Dibuja una grafica de barras generica a partir del campo "grafica" del JSON
function dibujarGrafica(g) {
  var ctx = document.getElementById(g.canvasId);
  if (!ctx) return;

  // Si Chart.js no cargo (CDN bloqueado por un ad-blocker, firewall, o sin
  // internet), no truena la pagina -- muestra un aviso corto en su lugar.
  if (typeof Chart === 'undefined') {
    ctx.replaceWith(construirAvisoGraficaNoDisponible());
    return;
  }

  new Chart(ctx, {
    type: g.tipo || 'bar',
    data: {
      labels: g.labels,
      datasets: g.datasets.map(function (ds) {
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.color,
          borderRadius: 6
        };
      })
    },
    options: {
      indexAxis: g.horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: g.datasets.length > 1 } },
      scales: {
        x: { grid: { color: g.horizontal ? '#E0E0E0' : 'transparent' } },
        y: { grid: { color: g.horizontal ? 'transparent' : '#E0E0E0' } }
      }
    }
  });
}


/* ----------------------------------------------------------------
   3. NAVEGACION DEL MENU LATERAL
   ---------------------------------------------------------------- */
var botonMenu = document.getElementById('menuToggle');
var sidebar = document.getElementById('sidebar');

if (botonMenu && sidebar) {
  botonMenu.addEventListener('click', function () {
    sidebar.classList.toggle('sidebar-abierto');
  });
}

var secciones = document.querySelectorAll('.page-section');
var linksDelMenu = document.querySelectorAll('.nav-link');

// try/catch por si el navegador no soporta IntersectionObserver: sin esto,
// un error aqui impedia que el codigo de mas abajo (seccion 4, el aviso de
// "rota tu dispositivo") llegara a ejecutarse.
try {
  var observador = new IntersectionObserver(
    function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          var idVisible = entrada.target.getAttribute('id');
          linksDelMenu.forEach(function (link) {
            link.classList.remove('active');
          });
          var linkActivo = document.querySelector('.nav-link[data-section="' + idVisible + '"]');
          if (linkActivo) {
            linkActivo.classList.add('active');
          }
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  secciones.forEach(function (seccion) {
    observador.observe(seccion);
  });
} catch (error) {
  console.error('No se pudo activar el resaltado de seccion activa en el menu:', error);
}

linksDelMenu.forEach(function (link) {
  link.addEventListener('click', function () {
    if (sidebar) {
      sidebar.classList.remove('sidebar-abierto');
    }
  });
});


/* ----------------------------------------------------------------
   4. AVISO DE "ROTA TU DISPOSITIVO" EN MOVIL
   ---------------------------------------------------------------- */
function checkOrientation() {
  var esMovil = window.innerWidth <= 900;
  var esVertical = window.innerHeight > window.innerWidth;
  var overlay = document.getElementById('rotate-message');

  if (!overlay) return;

  if (esMovil && esVertical) {
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
  }
}

window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);
checkOrientation();

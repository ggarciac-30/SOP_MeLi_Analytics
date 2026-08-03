# Caso S&OP — Pronóstico de Demanda Semanal — Sitio ejecutivo

Sitio estático (HTML/CSS/JS puro, sin frameworks) para presentar el caso de
pronóstico de demanda semanal (LightGBM vs. baseline jerárquico). Usa dos
librerías externas — **Chart.js** (gráficas) y **Prism.js** (resaltado de
sintaxis SQL/Python) — pero **ninguna de las dos se carga desde un CDN**:
ambas viven autoalojadas dentro del repo (`js/lib/`), para que el sitio no
dependa de que un dominio externo esté disponible (algunas redes
corporativas o bloqueadores de anuncios bloquean CDNs como `cdnjs.cloudflare.com`).

Pensado para editarse fácilmente aunque regreses en 6 meses — misma
filosofía que [SOP_MeLi_Capacity_Business_Case](https://github.com/ggarciac-30/SOP_MeLi_Capacity_Business_Case).

## Estructura

```
/
├── index.html               <- estructura y contenido fijo de TODAS las secciones
├── css/
│   ├── styles.css           <- todos los estilos propios; variables de color/espaciado al inicio (:root)
│   └── prism-theme.min.css  <- tema de color para el resaltado de código (Prism.js, autoalojado)
├── js/
│   ├── script.js            <- carga resultados.json + dibuja "Análisis"/"Conclusiones"/"Recomendaciones" + navegación
│   └── lib/                 <- librerías externas AUTOALOJADAS (no CDN)
│       ├── chart.umd.min.js       <- Chart.js, para las gráficas de barras
│       └── prism-bundle.min.js    <- Prism.js (núcleo + SQL + Python), para el resaltado de código
├── images/                  <- capturas, diagramas y gráficas exportadas de Python (histograma, ERD, etc.)
├── data/
│   └── resultados.json      <- el contenido de "Análisis", "Conclusiones" y "Recomendaciones" vive aquí
└── README.md
```

## Las 8 secciones del sitio, y de dónde sale cada una

El menú lateral tiene 8 links, cada uno apunta a un `<section id="...">` de
`index.html`. No todas las secciones se editan igual — unas son HTML fijo y
otras se dibujan solas desde el JSON:

| # | Sección (`id`) | ¿Dónde vive su contenido? |
|---|---|---|
| 1 | `inicio` | HTML fijo en `index.html` (hero, título, botón) |
| 2 | `objetivo` | HTML fijo — incluye el bloque `.formula-box` con la ecuación de la demanda |
| 3 | `dataset` | HTML fijo — las 5 tarjetas de los archivos de datos originales |
| 4 | `calidad-datos` | HTML fijo — incluye el diagrama entidad-relación (`images/`) |
| 5 | `analisis` | **JSON** — cada pregunta es un objeto del array `analisis` en `resultados.json` |
| 6 | `conclusiones` | **JSON** — array `conclusiones`, una lista simple |
| 7 | `recomendaciones` | **JSON** — array `recomendaciones`, una lista simple |
| 8 | `calculos` | HTML fijo — 9 tarjetas de código (SQL + Python), una por hallazgo técnico |

## ¿Dónde edito qué?

| Quiero cambiar...                                          | Edito este archivo                                     |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| Una pregunta, KPI, tabla, gráfica o hallazgo de "Análisis"    | `data/resultados.json` (array `analisis`)               |
| Un ítem de "Conclusiones" o "Recomendaciones"                | `data/resultados.json` (arrays `conclusiones` / `recomendaciones`) |
| El texto de "Objetivo", "Dataset" o "Calidad de datos"        | `index.html` directamente (son secciones fijas, no JSON) |
| Una tarjeta de código en "Cálculos"                          | `index.html`, dentro de `<section id="calculos">`       |
| Colores, tipografía, espaciados                              | `css/styles.css`, bloque `:root` al inicio               |
| El color del resaltado de código (SQL/Python)                 | `css/prism-theme.min.css`, o `.leak-sql-block` en `styles.css` |
| Agregar una fase/pregunta nueva a "Análisis"                  | Ver instrucciones abajo                                  |
| Agregar una sección nueva al menú                             | Ver instrucciones abajo                                  |

## Cómo agregar una pregunta nueva a "Análisis"

1. En `data/resultados.json`, copia un objeto completo del array `analisis`
   (desde `{` hasta `}`, incluida la coma de después) y pégalo antes del `]`
   que cierra el array.
2. Cambia `numero`, `pregunta` y `respuesta`. Todo lo demás es opcional —
   borra los campos que no uses:
   - `kpis` — números destacados: `[{ "valor": "...", "etiqueta": "..." }]`
   - `imagen` — ruta a una imagen en `images/`
   - `tabla` — `{ "titulo": "...", "encabezados": [...], "filas": [[...]] }`
   - `jerarquia` — niveles de una jerarquía (ver la pregunta 4 como ejemplo)
   - `grafica` — gráfica de barras con Chart.js: `{ "tipo": "bar", "canvasId": "id-unico", "horizontal": true/false, "labels": [...], "datasets": [{ "label", "data": [...], "color": "#hex" }] }`. El `canvasId` debe ser único en toda la página.
   - `toggle` — el interruptor Honesta/Con trampa (patrón específico de la Fase C, ver pregunta 6 como ejemplo)
   - `verCodigo` — `"calculo-tu-id"`: agrega el link "Ver el código SQL y Python completo en Cálculos →", apuntando a esa tarjeta (ver siguiente sección)
   - `nota` — un texto destacado al final (supuesto, hallazgo o recomendación)
3. No necesitas tocar `js/script.js` para nada de esto — ya sabe leer y
   dibujar cualquier combinación de estos campos.

## Cómo ocultar una consulta SQL/Python detrás de un link ("Ver código")

Este patrón evita saturar una pregunta de "Análisis" con código largo: el
código vive en una tarjeta de la sección "Cálculos", y la pregunta solo
enlaza hacia ella.

1. En `index.html`, dentro de `<section id="calculos">`, crea (o reusa) una
   tarjeta:
   ```html
   <div class="codigo-card" id="calculo-tu-id">
     <h3>Título</h3>
     <p class="codigo-desc">...</p>
     <span class="codigo-etiqueta codigo-etiqueta-sql">SQL</span>
     <pre class="leak-sql-block"><code class="language-sql">TU SQL AQUI</code></pre>
     <span class="codigo-etiqueta codigo-etiqueta-python" style="margin-top: var(--espacio-sm);">Python</span>
     <pre class="leak-sql-block"><code class="language-python">TU PYTHON AQUI</code></pre>
   </div>
   ```
   Usa `class="language-sql"` o `class="language-python"` en el `<code>` para
   que Prism.js sepa qué resaltar — no hace falta marcar palabras a mano.
2. En `data/resultados.json`, en la pregunta que corresponda, agrega:
   `"verCodigo": "calculo-tu-id"` (el mismo id que le pusiste a la tarjeta).
3. No toques `js/script.js` — ya sabe leer `verCodigo` y dibuja el link
   automáticamente.

## Cómo agregar una fórmula visual (como la de "Objetivo")

Para mostrar una ecuación (no código) de forma visual, en cualquier sección
de `index.html` copia:
```html
<div class="formula-box">
  <span class="formula-etiqueta">Etiqueta corta</span>
  <p class="formula-ecuacion">Tu_Ecuacion&nbsp;=&nbsp;...</p>
  <p class="formula-nota">Explicación breve, opcional.</p>
</div>
```
Estilos en `css/styles.css`, bloque `4c. FORMULA`.

## Cómo agregar una sección nueva al menú (fuera de "Análisis")

1. En `index.html`, dentro de `<nav class="sidebar-nav">`, copia un `<a>`
   existente y cambia el texto y el `href="#tu-id"` / `data-section="tu-id"`.
2. Copia un bloque `<section class="page-section" id="tu-id">...</section>`
   y cambia su `id` para que coincida exactamente con el que pusiste en el
   link — el orden en que la coloques en el archivo es el orden en que
   aparece al hacer scroll.

## Cómo actualizar Chart.js o Prism.js

Ambas librerías están autoalojadas en `js/lib/` — no hay que tocar ningún
CDN. Para actualizar de versión: descarga el nuevo archivo `.min.js` y
reemplaza el que ya existe en `js/lib/` con el mismo nombre. Si quieres
agregar a Prism.js soporte para otro lenguaje (ej. R o JavaScript), descarga
el componente `prism-<lenguaje>.min.js` correspondiente y pégalo dentro de
`js/lib/prism-bundle.min.js` (es una simple concatenación de archivos).

## Cómo publicar en GitHub Pages

```
git add .
git commit -m "Sitio caso S&OP - Pronostico de demanda"
git push origin main
```

Luego: `Settings → Pages → Source: main / (root)`.

## Antes de publicar

- Si subes archivos por la interfaz web de GitHub (arrastrar y soltar) en
  vez de `git push` desde tu copia local, **verifica que las subcarpetas se
  hayan creado con el nombre exacto** (`js/lib/`, no `js/lb/` ni `js/Lib/`)
  — GitHub no corrige nombres de carpeta por ti, y un typo ahí deja las
  gráficas y el resaltado de código sin cargar, sin ningún otro síntoma.
- Completa los links del footer y del badge flotante con tu repositorio real.
- Revisa `data/resultados.json` y ajusta cualquier cifra si el análisis cambia.
- Prueba abriendo `index.html` con un servidor local antes de subirlo — los
  navegadores bloquean `fetch()` en archivos abiertos directamente (`file://`).
  Desde esta carpeta: `python -m http.server` y abre `http://localhost:8000`.

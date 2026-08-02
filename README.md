# Caso S&OP — Pronóstico de Demanda Semanal — Sitio ejecutivo

Sitio estático (HTML/CSS/JS puro, sin frameworks, salvo Chart.js vía CDN) para
presentar el caso de pronóstico de demanda semanal (LightGBM vs. baseline
jerárquico). Pensado para editarse fácilmente aunque regreses en 6 meses —
misma filosofía que [SOP_MeLi_Capacity_Business_Case](https://github.com/ggarciac-30/SOP_MeLi_Capacity_Business_Case).

## Estructura

```
/
├── index.html          <- estructura y contenido fijo (hero, títulos de sección)
├── css/
│   └── styles.css      <- todos los estilos, variables al inicio del archivo
├── js/
│   └── script.js       <- carga de datos + navegación + gráficas (Chart.js)
├── images/              <- si agregas capturas o logo, van aquí
├── data/
│   └── resultados.json <- TODOS los números y textos del sitio viven aquí
└── README.md
```

## ¿Dónde edito qué?

| Quiero cambiar...                              | Edito este archivo                                  |
| ----------------------------------------------- | ----------------------------------------------------- |
| Un KPI, hallazgo, tabla, fase, conclusión o recomendación | `data/resultados.json`                     |
| El texto fijo de "Objetivo" o "Dataset"          | `data/resultados.json` (bloques `objetivo` / `dataset`) |
| Colores, tipografía, espaciados                  | `css/styles.css`, bloque `:root` al inicio            |
| Agregar una gráfica real distinta                | `js/script.js`, dentro de `inicializarGraficos()`     |
| Agregar una fase/sección nueva al menú            | Ver instrucciones abajo                               |

## Cómo agregar una fase nueva

1. En `data/resultados.json`, agrega un objeto nuevo al array `analisis` (copia
   uno existente como plantilla — `id`, `tag`, `titulo`, `resumen`, y cualquier
   combinación de `kpis`, `tabla`, `hierarchy`, `hallazgos`, etc.).
2. `js/script.js` arma la tarjeta automáticamente — no necesitas tocar el JS
   para esto, solo si agregas un tipo de bloque nuevo que no exista todavía.

## Cómo agregar una sección nueva al menú (fuera de "Fases del análisis")

1. En `index.html`, dentro de `<nav class="sidebar-nav">`, copia un `<a>`
   existente y cambia el texto y el `href="#tu-id"` / `data-section="tu-id"`.
2. Copia un bloque `<section class="page-section" id="tu-id">...</section>` y
   cambia su `id` para que coincida exactamente con el que pusiste en el link.

## Cómo publicar en GitHub Pages

```
git add .
git commit -m "Sitio caso S&OP - Pronostico de demanda"
git push origin main
```

Luego: `Settings → Pages → Source: main / (root)`.

## Antes de publicar

- Completa los links del footer y del badge flotante con tu repositorio real.
- Revisa `data/resultados.json` y ajusta cualquier cifra si el análisis cambia.
- Prueba abriendo `index.html` con un servidor local antes de subirlo — algunos
  navegadores bloquean `fetch()` en archivos abiertos directamente (`file://`).
  Desde esta carpeta: `python -m http.server` y abre `http://localhost:8000`.

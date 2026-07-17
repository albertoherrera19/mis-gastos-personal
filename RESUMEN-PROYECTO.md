# Resumen de estado — actualizado 2026-07-11

> Este archivo describe el ESTADO ACTUAL (cambia con el tiempo). Las reglas fijas del proyecto están
> en `CLAUDE.md` — léelo primero.

## Punto de sincronización entre los dos repos
**Sincronizado el 2026-07-12** (commit amigos `65c7596`). Se portaron a `mis-gastos`
(carpeta `mis-gastos-timeless`) las 4 funcionalidades pendientes desde `900a642`/`c91ebef`:

- `d3bc281` — Feature #1: grupos personalizados de categorías (en amigos, `catGroups` empieza **vacío**;
  NO se pre-crean Timeless/Personal — eso sigue siendo exclusivo del repo personal).
- `94133f3` — Feature #5: buscador y filtros en Movimientos.
- `323733d` — Feature #7: gastos recurrentes.
- `300eccb` — Lote de 8 ajustes, **excepto** el punto #3 (botón 💾 Sheets + toast, que no aplica sin
  Sheets): orden por fecha + "Más antiguo", confirmar borrado, engranaje coloreado en detalle, scroll al
  primer día con gasto, 3 colores nuevos (Amarillo/Gris/Azul Marino), etiqueta de grupo por gasto
  individual, barra de grupos reubicada al header.

Quedaron intencionalmente FUERA del repo de amigos (como siempre): la integración con Google Sheets
completa (constantes, funciones, botón, toast), la pre-creación de grupos, y los íconos nuevos
(`daa3989`/`e43c3f0`, exclusivos del repo personal, nunca pedidos para amigos). Verificado en navegador
sin errores de consola antes del push (cache del service worker de amigos subida a `v20`).

Todo cambio FUTURO en el repo personal (después de este punto) vuelve a quedar pendiente de portar a
amigos hasta el próximo pedido explícito de sincronización.

## ✅ Funcionalidades implementadas y funcionando (repo personal, verificadas en navegador)
- Registro de gastos: monto, nota, categoría, **fecha manual opcional** (por defecto hoy, no permite
  futuro), **etiqueta de grupo opcional** por gasto individual.
- 8 categorías base + categorías personalizadas (emoji + nombre), con confirmación al borrar una
  personalizada (ofrece mover sus gastos a "Otros" si tenía).
- Selector de categoría con **toggle** (tocar de nuevo deselecciona).
- 13 temas de color, con la regla de acento neutro (Negro/Blanco) y color independiente por categoría.
- Donut por categoría (interactivo, click muestra %), con monto central compacto y escalado por dígitos.
- Comparativo de barras por mes (Comparar meses) — verificado que julio se conserva como historial al
  simular el paso a agosto, sin mezclar totales.
- **Detalle de categoría** (página completa): gráfico de barras por día con zoom/pinch, posicionado para
  que la barra del **primer día con gasto** quede pegada al borde izquierdo (sin scroll manual, sea el
  día 1, el 9 o el 30); lista "Días con gasto" expandible con montos individuales; **comparativo ▲/▼ %
  vs mes anterior** (oculto si no hay datos previos); **presupuesto mensual opcional** con barra
  verde/amarillo/rojo; engranaje ⚙️ coloreado que abre color + presupuesto juntos.
- **Editar gastos** en página completa (lápiz, desde Movimientos y desde Días con gasto): edita monto,
  nota, categoría y fecha; actualiza el mismo registro (no duplica).
- **Movimientos recientes**: SIN límite de cantidad (verificado con 1000 gastos, todos visibles, sumas
  exactas); orden "Predeterminado" (por fecha, más reciente arriba), "Más antiguo" (fecha ascendente),
  "Por categoría" (agrupado, expandible); **buscador y filtros** (texto de nota/categoría, rango de
  monto, rango de fechas), compatible con los 3 modos de orden; confirmación antes de borrar un gasto.
- **Grupos de categorías**: pestañas Predeterminado + grupos personalizados (crear/editar/eliminar,
  nombre + categorías, una categoría puede estar en varios grupos); filtra total del mes, donut y "Por
  categoría"; además, un gasto individual puede etiquetarse a un grupo aunque su categoría no pertenezca
  a él. Barra de grupos ubicada entre "Mis gastos" y el mes actual, en el header.
- **Gastos recurrentes**: vista de página completa (ícono 🔁 en el header, primero de los 3 botones:
  🔁 💾 ⚙️), lista de recurrentes con nombre/monto/día/categoría, toggle Pagado/Pendiente por mes; al
  marcar pagado, ofrece registrar el gasto real (o no); al desmarcar, ofrece quitar el gasto vinculado.
- **Google Sheets** (solo repo personal): cada gasto se envía automáticamente al registrarse
  (`queueForSheets`), con cola de reintento si no hay internet (`timeless_sheets_pending`, se reintenta
  en el evento `online`). Además hay un **botón 💾 manual** en el header que fuerza el reenvío y muestra
  un toast: "✓ Guardado en Google Sheets" (éxito), "Sin conexión, intenta de nuevo" (offline).
- **Respaldo de datos**: exportar (descarga `.json` con `BACKUP_KEYS`) e importar (reemplaza localStorage
  y recarga), en el panel ⚙️. Usado exitosamente por el usuario para migrar datos de un ícono viejo de
  iOS a la instalación nueva.
- **Auto-actualización de la PWA**: el service worker revisa actualizaciones en `load`, `visibilitychange`
  y `pageshow` (no solo la primera vez), para minimizar el problema de iconos instalados que quedan
  pegados en versiones viejas de iOS.
- **Íconos nuevos** (solo repo personal): set completo en `icons/` (any 192/512, maskable 192/512,
  apple-touch-icon-180, favicon 32/16), rutas relativas, verificado con HTTP 200 en vivo en el subpath.

## ⏳ Pendiente / a medio hacer
- **Sincronizar al repo de amigos** todo lo listado en "Punto de sincronización" arriba — el usuario
  aún no lo ha pedido explícitamente. No hacerlo hasta que lo pida.
- El usuario mencionó que después de "editar gastos" quería, en algún momento, pedir una edición de
  fecha "de una" con un prompt preparado — ya se implementó fecha manual y edición de fecha vía "Editar
  gasto"; no quedó nada explícitamente pendiente de esa idea, pero si el usuario trae un prompt viejo
  sobre esto, ya está cubierto.
- No hay ninguna funcionalidad a medias dentro del repo personal en este momento — todo lo commiteado
  fue probado y confirmado por el usuario ("todo bien ya esta" tras la migración de íconos).

## 🐛 Bugs conocidos
- Ninguno abierto actualmente. Notas de comportamiento (no bugs, pero conviene recordarlos):
  - El envío a Google Sheets usa `fetch(..., {mode:'no-cors'})` → es "fire-and-forget", no se puede leer
    la respuesta real del servidor desde el navegador (limitación intencional para evitar bloqueos CORS).
    El botón 💾 asume éxito si el fetch no lanza error de red.
  - Los pushes a GitHub a veces fallan una vez con "Deployment failed, try again later" (infraestructura
    de GitHub Pages, no del código) — se resuelve reintentando con un commit vacío.
  - En iOS, un ícono instalado antes de un cambio de código puede tardar hasta 24h en autoactualizarse
    aunque el fix de `visibilitychange` ya esté desplegado, porque ese fix necesita llegar primero. Un
    ícono MUY viejo puede necesitar una recarga manual una sola vez vía Safari normal para "despegarse".

## Decisiones de diseño de esta sesión (no cubiertas en CLAUDE.md)
- El engranaje de categoría es un SVG inline (no emoji ni imagen), coloreado vía `style.color` con el
  hex de la categoría, para que combine visualmente sin depender de assets externos.
- El toast (`#toast`) es un elemento único reutilizado por `showToast(msg, kind)`, con clases `.ok`/`.err`
  para el borde de color; se autolimpia con `setTimeout` guardado en `t._timer` (cancela el anterior si
  se dispara de nuevo rápido).
- La carpeta de íconos fuente que trajo el usuario (`Downloads/app-icons/`, NO "icons-nuevos/" como decía
  el prompt) se copió a `icons/` dentro del repo y luego se borró el original — si en el futuro se pide
  cambiar íconos de nuevo, ya no existe esa carpeta fuente.
- El README.md de instrucciones de íconos traía rutas absolutas `/icons/...`; se decidió usarlas
  **relativas** (`icons/...`) porque el proyecto entero es 100% rutas relativas y se sirve en subpath —
  esta fue una decisión explícita del usuario en su punto 4 ("ajusta las rutas si la estructura real
  usa una base distinta").

## Preguntas sin responder
- Ninguna pendiente en este momento. La única decisión abierta es **cuándo** el usuario quiere
  sincronizar los cambios acumulados al repo de amigos — queda a su criterio, sin fecha definida.

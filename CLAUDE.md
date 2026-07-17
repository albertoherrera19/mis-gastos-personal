# Mis Gastos — Guía del proyecto (leer siempre al empezar)

PWA de control de gastos personales (streetwear/recibo, fondo oscuro). Vanilla JS, sin build
step: `index.html` + `style.css` + `app.js` + `manifest.json` + `service-worker.js`.

## ⚠️ Arquitectura de DOS repos (los nombres están CRUZADOS — leer con cuidado)

| | Carpeta local | Repo en GitHub | URL pública | Google Sheets |
|---|---|---|---|---|
| **MI repo (personal)** | `mis-gastos-personal` | `mis-gastos-timeless` | https://albertoherrera19.github.io/mis-gastos-timeless/ | ✅ Sí |
| **Repo de amigos** | `mis-gastos-timeless` | `mis-gastos` | https://albertoherrera19.github.io/mis-gastos/ | ❌ No, nunca |

- **Todo cambio se implementa SOLO en el repo personal** (carpeta `mis-gastos-personal`), probado en
  navegador y commiteado/pusheado ahí. **No tocar el repo de amigos** (ni `git add/commit/push` ahí) hasta
  que el usuario lo pida explícitamente con algo como "sincroniza los cambios pendientes al repo de
  amigos" — no asumir que un cambio debe sincronizarse solo porque se hizo en personal (confirmado
  2026-07-17: el usuario NO quiere sync automático, para ahorrar tokens y porque las diferencias
  intencionales entre ambos repos son parte del diseño, no algo a resolver).
- Al sincronizar (solo cuando se pida): comparar con `git diff`/`git log` qué cambió en personal desde
  el último punto en común, portar SOLO esas diferencias (no reimplementar desde cero) — usar
  `git merge-file` de 3 vías (base=commit del último sync, ours=archivo actual de amigos, theirs=HEAD de
  personal) por archivo, que reconcilia solo, probar en navegador, commitear y pushear. El usuario NO
  quiere tener que recordar la lista de exclusiones cada vez; mantenerla aplicada sin que la repita:
  - la integración con Google Sheets (constantes `SHEETS_*`, `queueForSheets`, `google-apps-script.gs`),
  - la pre-creación de grupos "Timeless"/"Personal" (`PRECREATE_GROUPS = true` es exclusivo del personal;
    en amigos ese flag debe ir en `false` y los grupos empiezan vacíos, sin pestañas "Timeless"/"Personal").
  - los íconos de la PWA fueron una EXCEPCIÓN puntual sincronizada el 2026-07-17 a pedido explícito; salvo
    que se repita el pedido, no asumir que se sincronizan de nuevo automáticamente en el futuro.
- Ambos usan **rutas relativas** en todo el HTML/CSS/JS (`href="style.css"`, no `/style.css`) porque se
  sirven en un subpath de GitHub Pages, no en la raíz del dominio. Nunca usar rutas absolutas `/algo`.

## Despliegue
- GitHub Actions (`.github/workflows/deploy.yml`, método `actions/deploy-pages`), no "Deploy from branch".
- Cada cambio de HTML/CSS/JS **requiere subir la versión del cache** en `service-worker.js`
  (`const CACHE = CACHE_PREFIX + 'vN'` → `'vN+1'`), si no el cambio no llega a los dispositivos.
- `git push` a veces falla una vez con "Deployment failed, try again later" (fallo transitorio de GitHub
  Pages, no del código) — reintentar con `git commit --allow-empty -m "retry" && git push`.
- Los mensajes de commit en PowerShell: evitar comillas/paréntesis raros en `-m`; usar texto plano simple
  o pasar el mensaje como variable `$msg` para no romper el parser.
- Tras cada deploy, verificar en vivo con `Invoke-WebRequest` a los archivos `.js`/`.html` (no confiar
  solo en que el workflow diga "success").

## Convenciones visuales
- Fondo oscuro, tarjetas con bordes sutiles/punteados, tipografía monoespaciada para todos los montos.
- Sistema de temas en `THEMES` (app.js): cada tema define `bg, card, line, bone, muted, accent,
  accentDim, chip, swatch`. Actualmente 13 temas: negro, azul, celeste, morado, rojo, rosado, verde,
  turquesa, naranja, amarillo, gris, marino (Azul Marino), blanco.
- **Regla del acento neutro**: Negro y Blanco (`NEUTRAL_THEMES`) NUNCA fijan su propio `accent` — conservan
  el último acento de un tema no-neutro elegido (`lastAccentTheme`, persistido en `ACCENT_THEME_KEY`).
- **Color por categoría es independiente del tema general**: cada categoría puede tener su propio color
  (`categoryColors`, clave `CAT_COLOR_KEY`), que tiñe SOLO su vista de detalle (nombre, barras del
  gráfico, engranaje ⚙️ de ajustes) y el punto/porción que la representa en el donut y su leyenda. Si
  una categoría no tiene color propio, hereda el acento general del tema.
- En el detalle de categoría, el disparador de "color + presupuesto" es un **ícono de engranaje ⚙️
  (SVG)** teñido con el color de esa categoría — ya NO es un círculo de color.

## Estructura de datos en localStorage (todas bajo el prefijo `timeless_`)
- `timeless_expenses_log` — array de gastos: `{id, amount, category, note, date (ISO), group? }`.
  `group` es **opcional**: etiqueta manual de grupo en un gasto individual, independiente de a qué
  grupo pertenezca su categoría (ver sección Grupos abajo).
- `timeless_expenses_theme` — tema activo. `timeless_accent_theme` — último acento no-neutro.
- `timeless_custom_categories` — categorías creadas por el usuario (además de las 8 base:
  inversión, pasajes, ads, salidas, comida, servicios, ropa, otros).
- `timeless_category_colors` — `{catId: themeKey}`. `timeless_category_budgets` — `{catId: montoLimite}`.
- `timeless_cat_groups` — `[{id, name, cats:[catId,...]}]`. `timeless_recurring` — `[{id, name, amount,
  day, category, paid:{'YYYY-MM': expenseId|true}}]`. `timeless_eyebrow_text` — título editable del header.
- `timeless_sheets_pending` — cola de envíos a Sheets pendientes (solo repo personal).
- El **respaldo (exportar/importar)** usa `BACKUP_KEYS` — **cualquier clave nueva de localStorage que se
  agregue debe sumarse a ese array**, si no, no se incluye en el export/import.

## Grupos de categorías (feature #1) — cómo filtran
- Un grupo (`catGroups`) tiene una lista de categorías (`cats`). Al activar un grupo, se muestran los
  gastos de **(a)** categorías que pertenecen al grupo **+ (b)** gastos individuales etiquetados
  manualmente con `gasto.group === grupoId`, aunque su categoría no pertenezca al grupo. Ver
  `applyGroupFilter()` en app.js.
- Solo en el repo personal: `PRECREATE_GROUPS = true` crea automáticamente "Timeless" (Ads, Inversión) y
  "Personal" (el resto) la primera vez. En amigos este flag debe ser `false`.

## Reglas de proceso (pedidas explícitamente por el usuario)
1. Cambios grandes se implementan **por fases/funcionalidades**, avisando al completar cada una — no
   todo junto sin feedback intermedio.
2. **Nunca modificar funcionalidad que no fue pedida explícitamente** en el mensaje actual.
3. Antes de dar algo por terminado: **probar en el navegador** (Browser pane / preview_start), no solo
   revisar el código. Verificar con datos de prueba realistas (incluye pruebas de escala si el usuario
   lo pide — se validó hasta 1000 gastos con sumas exactas).
4. Subir versión de caché del service worker en cada cambio y verificar el deploy en vivo antes de
   reportar éxito.
5. Nunca usar `git push --force`, nunca tocar el repo de amigos sin permiso explícito, nunca commitear
   si no se pidió.
6. iOS cachea agresivamente las PWA instaladas — el `index.html` ya tiene lógica de auto-actualización
   (`visibilitychange`/`pageshow` disparan `reg.update()`), pero aun así a veces un ícono instalado queda
   "pegado" en una versión vieja; la solución sin riesgo de perder datos es abrir la URL en Safari normal
   (no el ícono) para forzar una carga fresca, usar Exportar/Importar para migrar datos entre íconos si
   hace falta, y NUNCA borrar un ícono con datos sin haber exportado antes.
7. Recordar: todas las URLs de GitHub Pages para el mismo usuario (`albertoherrera19.github.io/*`)
   comparten origen; el localStorage de una pestaña normal de Safari es un "cajón" distinto al de una
   PWA instalada standalone en iOS — no asumir que comparten datos automáticamente.

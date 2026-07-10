# Mis Gastos — Personal

PWA (Progressive Web App) instalable para control personal de gastos, con estética recibo/streetwear.
Esta es la versión **personal** (con sincronización opcional a Google Sheets). La versión que usan
otras personas, 100% local y sin Sheets, está en el repo `mis-gastos-timeless`.

**App en vivo:** https://albertoherrera19.github.io/mis-gastos-personal/

## Funciones
- Registro de gastos (monto, nota opcional, categoría) — guardado en `localStorage`.
- 8 categorías base + categorías personalizadas con emoji.
- Temas de color, donut por categoría, comparativo por mes, detalle por día.
- Instalable y con soporte offline (service worker).
- **Sincronización a Google Sheets**: cada gasto se agrega a la pestaña "Gastos".

## Sincronización con Google Sheets
1. El backend está en `google-apps-script.gs` (se pega en Extensiones → Apps Script de la hoja).
2. Tras desplegarlo como "Aplicación web", se obtiene una URL que termina en `/exec`.
3. Esa URL se pega en `app.js`, en la constante `SHEETS_WEBHOOK_URL`.
   Mientras diga `PEGA_AQUI_TU_URL_DE_APPS_SCRIPT`, la app funciona igual pero solo con `localStorage`.

## Archivos
- `index.html`, `style.css`, `app.js` — la app.
- `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png` — PWA.
- `google-apps-script.gs` — backend de Google Sheets (Apps Script).

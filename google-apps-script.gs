/**
 * BACKEND para "Mis Gastos - Personal" (Google Apps Script)
 * ---------------------------------------------------------
 * Recibe cada gasto que envía la app y lo agrega como una fila nueva
 * en la pestaña "Gastos" de tu hoja "Timeless - Ventas e Inventario".
 *
 * CÓMO USARLO (resumen — los pasos detallados están en el chat):
 *  1. Abre tu hoja "Timeless - Ventas e Inventario" en Google Sheets.
 *  2. Menú: Extensiones -> Apps Script.
 *  3. Borra el código de ejemplo y pega TODO este archivo.
 *  4. Guarda (icono de disquete).
 *  5. Implementar -> Nueva implementación -> tipo "Aplicación web".
 *     - Ejecutar como: Yo
 *     - Quién tiene acceso: Cualquier usuario
 *  6. Implementar -> Autoriza los permisos que te pida.
 *  7. Copia la "URL de la aplicación web" (termina en /exec).
 *  8. Pega esa URL en app.js (constante SHEETS_WEBHOOK_URL).
 *
 * Como el script está creado DESDE la hoja, usa getActiveSpreadsheet()
 * y no necesita ningún ID.
 */

var SHEET_NAME = 'Gastos';

// Recibe cada gasto (POST) y lo agrega como fila nueva.
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // evita filas duplicadas si llegan dos a la vez

    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet_();

    // Encabezados la primera vez.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'Fecha', 'Categoría', 'Monto', 'Nota', 'Registrado en']);
    }

    // Evita duplicar si el mismo gasto se reintenta (misma ID en la columna A).
    if (data.id && idYaExiste_(sheet, data.id)) {
      return json_({ ok: true, duplicated: true });
    }

    var fecha = data.date ? new Date(data.date) : new Date();
    sheet.appendRow([
      data.id || '',
      fecha,
      data.category || '',
      Number(data.amount) || 0,
      data.note || '',
      new Date()
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// Permite abrir la URL en el navegador para comprobar que está viva.
function doGet() {
  return json_({ ok: true, service: 'Mis Gastos - Personal', sheet: SHEET_NAME });
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function idYaExiste_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return true;
  }
  return false;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

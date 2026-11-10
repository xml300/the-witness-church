// Google Apps Script for the pastor's prayer-request sheet.
// Paste this into the Sheet's Extensions > Apps Script editor.
// See supabase/SETUP.md, "Prayer wall", for the full steps.

// 1. Replace this with a long random string. Use the SAME value for
//    GOOGLE_SHEET_SECRET in the website's .env file.
const SECRET = "CHANGE-ME-TO-A-LONG-RANDOM-STRING";

const HEADERS = ["Received", "Category", "Prayer request", "Name (optional)"];

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad request" });
  }
  if (data.secret !== SECRET) return reply({ ok: false, error: "secret" });

  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getRange(1, 4).isBlank()) {
    // A sheet made with the earlier version of this script has no Name column.
    sheet.getRange(1, 4).setValue(HEADERS[3]);
  }
  sheet.appendRow([
    new Date(data.submittedAt),
    data.category,
    data.text,
    data.name || "",
  ]);
  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

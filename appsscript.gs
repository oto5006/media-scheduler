/**
 * appsscript.gs — RCCG Media Department Scheduling Portal
 *
 * Deploy as a Google Apps Script Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Handles:
 *   GET  ?action=checkTab&tabName=…      → { exists: bool }
 *   GET  ?action=loadSchedules            → { schedules: { "2026-Q1": {…}, … } }
 *   POST { action:"saveSchedule", tabName, data }     → creates/overwrites a human-readable tab
 *   POST { action:"saveAllSchedules", schedules:{…} } → persists full JSON for shared loading
 *   POST { action:"deleteSchedule", key:"2026-Q1" }   → removes that schedule from shared storage
 *
 * The "saveAllSchedules" / "loadSchedules" pair is what makes schedules
 * visible to all users — the admin saves once, everyone else loads on boot.
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const SCHEDULE_JSON_TAB = "_schedules_json"; // hidden tab storing the JSON blob
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// ── Entry points ──────────────────────────────────────────────────────────────
function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || "";

  try {
    if (action === "checkTab") {
      const tabName = params.tabName || "";
      const sheet   = SPREADSHEET.getSheetByName(tabName);
      return jsonResponse({ exists: !!sheet });
    }

    if (action === "loadSchedules") {
      const schedules = loadAllSchedulesFromSheet();
      return jsonResponse({ schedules });
    }

    return jsonResponse({ error: "Unknown GET action: " + action });
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action || "";

    if (action === "saveSchedule") {
      writeScheduleTab(body.tabName, body.data);
      return jsonResponse({ success: true });
    }

    if (action === "saveAllSchedules") {
      saveAllSchedulesToSheet(body.schedules);
      return jsonResponse({ success: true });
    }

    if (action === "deleteSchedule") {
      deleteScheduleFromStorage(body.key);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, message: "Unknown action: " + action });
  } catch(err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

// ── Shared schedule JSON storage ─────────────────────────────────────────────
// Stores a single JSON blob in a hidden tab so all users can load schedules.

function getOrCreateJsonTab() {
  let sheet = SPREADSHEET.getSheetByName(SCHEDULE_JSON_TAB);
  if (!sheet) {
    sheet = SPREADSHEET.insertSheet(SCHEDULE_JSON_TAB);
    sheet.hideSheet();
  }
  return sheet;
}

function saveAllSchedulesToSheet(schedules) {
  const sheet = getOrCreateJsonTab();
  sheet.clearContents();
  sheet.getRange(1, 1).setValue(JSON.stringify(schedules));
}

function loadAllSchedulesFromSheet() {
  const sheet = getOrCreateJsonTab();
  const val   = sheet.getRange(1, 1).getValue();
  if (!val) return {};
  try { return JSON.parse(val); } catch(e) { return {}; }
}

function deleteScheduleFromStorage(key) {
  const schedules = loadAllSchedulesFromSheet();
  delete schedules[key];
  saveAllSchedulesToSheet(schedules);
  // Also delete the human-readable tab if it exists
  const tab = SPREADSHEET.getSheetByName(key);
  if (tab) SPREADSHEET.deleteSheet(tab);
}

// ── Human-readable schedule tab writer ───────────────────────────────────────
function writeScheduleTab(tabName, data) {
  // Delete existing tab if present
  const existing = SPREADSHEET.getSheetByName(tabName);
  if (existing) SPREADSHEET.deleteSheet(existing);

  const sheet = SPREADSHEET.insertSheet(tabName);

  const members  = data.members  || [];
  const schedule = data.schedule || [];
  const roles    = data.roles    || [];

  function memberName(id) {
    if (!id) return "—";
    const m = members.find(x => x.id === id);
    return m ? m.name : "—";
  }

  // Header row
  const headers = ["Date", "Service", "Week Services"].concat(roles.map(r => r.label)).concat(["Notes"]);
  sheet.appendRow(headers);

  // Style header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1c2030");
  headerRange.setFontColor("#c9a84c");
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(10);

  // Data rows
  schedule.forEach((entry, i) => {
    const weekSvcText = (entry.weekServices || []).map(ws => ws.label + " (" + ws.dayName + ")").join("; ");
    const row = [
      entry.date,
      entry.serviceName || "Celebration Service",
      weekSvcText || "No mid-week services",
    ].concat(
      roles.map(r => memberName(entry.assignments ? entry.assignments[r.key] : null))
    ).concat([entry.notes || ""]);

    sheet.appendRow(row);

    // Alternate row shading
    if (i % 2 === 0) {
      sheet.getRange(i + 2, 1, 1, headers.length).setBackground("#141720");
    }
  });

  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);

  // Freeze header row
  sheet.setFrozenRows(1);
}

// ── Utility ───────────────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

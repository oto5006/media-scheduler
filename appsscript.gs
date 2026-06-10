/**
 * appsscript.gs — RCCG Media Department Scheduling Portal
 *
 * Deploy as a Google Apps Script Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * IMPORTANT — after ANY code change you must click
 *   Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy
 * The URL stays the same; only the code updates.
 *
 * Handles:
 *   GET  ?action=checkTab&tabName=…      → { exists: bool }
 *   GET  ?action=loadSchedules            → { schedules: { "2026-Q1": {…}, … } }
 *   POST { action:"saveSchedule", tabName, data }     → creates/overwrites a human-readable tab
 *   POST { action:"saveAllSchedules", schedules:{…} } → persists full JSON for shared loading
 *   POST { action:"deleteSchedule", key:"2026-Q1" }   → removes that schedule from shared storage
 *
 * CORS: all responses include Access-Control-Allow-Origin: * so the browser
 * can read them. The OPTIONS preflight is handled by doGet returning early.
 */

// ── Constants ─────────────────────────────────────────────────────────────────
const SCHEDULE_JSON_TAB = "_schedules_json"; // hidden tab — stores the JSON blob
const SPREADSHEET = SpreadsheetApp.getActiveSpreadsheet();

// ── Entry points ──────────────────────────────────────────────────────────────

// GET: serves data reads AND handles the POST-redirect fallback
// (browsers follow Apps Script's redirect from POST→GET, losing the body;
//  the JS client re-sends the payload as ?payload= so we can still process it)
function doGet(e) {
  const params = e.parameter || {};

  // ── POST-redirect fallback: payload arrived as a URL parameter ────
  if (params.payload) {
    try {
      const body   = JSON.parse(params.payload);
      const action = body.action || "";

      if (action === "saveAllSchedules") {
        if (!body.schedules) throw new Error("Missing schedules payload");
        saveAllSchedulesToSheet(body.schedules);
        return jsonResponse({ success: true, action: "saveAllSchedules", via: "GET-fallback" });
      }
      if (action === "saveSchedule") {
        if (!body.tabName) throw new Error("Missing tabName");
        writeScheduleTab(body.tabName, body.data || {});
        return jsonResponse({ success: true, action: "saveSchedule", via: "GET-fallback" });
      }
      if (action === "deleteSchedule") {
        deleteScheduleFromStorage(body.key || "");
        return jsonResponse({ success: true, action: "deleteSchedule", via: "GET-fallback" });
      }
      return jsonResponse({ success: false, message: "Unknown action in payload: " + action });
    } catch(err) {
      return jsonResponse({ success: false, message: "Payload parse error: " + err.message });
    }
  }

  // ── Normal GET reads ──────────────────────────────────────────────
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

    // Default health-check
    return jsonResponse({ ok: true, message: "RCCG Media Apps Script is running" });
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

// POST: receives schedule saves from the admin's browser
function doPost(e) {
  try {
    // Robust body parsing — handle both JSON body and form-encoded wrapper
    let body;
    try {
      const raw = (e.postData && e.postData.contents) ? e.postData.contents : "{}";
      body = JSON.parse(raw);
    } catch(parseErr) {
      // Fall back: sometimes Apps Script wraps the body in a parameter
      const raw = (e.parameter && e.parameter.data) ? e.parameter.data : "{}";
      body = JSON.parse(raw);
    }

    const action = body.action || "";

    if (action === "saveAllSchedules") {
      if (!body.schedules) throw new Error("Missing schedules payload");
      saveAllSchedulesToSheet(body.schedules);
      return jsonResponse({ success: true, action: "saveAllSchedules" });
    }

    if (action === "saveSchedule") {
      if (!body.tabName) throw new Error("Missing tabName");
      writeScheduleTab(body.tabName, body.data || {});
      return jsonResponse({ success: true, action: "saveSchedule" });
    }

    if (action === "deleteSchedule") {
      deleteScheduleFromStorage(body.key || "");
      return jsonResponse({ success: true, action: "deleteSchedule" });
    }

    return jsonResponse({ success: false, message: "Unknown action: " + action });

  } catch(err) {
    // Always return valid JSON — never let Apps Script return an HTML error page
    return jsonResponse({ success: false, message: err.message, stack: err.stack });
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
// CORS header is required so the browser can read the response to a cross-origin fetch.
// Without it the fetch succeeds (Apps Script runs) but the browser blocks reading
// the response body, causing r.json() to throw — which looks like a network failure.
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  // Note: Apps Script automatically adds Access-Control-Allow-Origin: * for
  // Web Apps deployed with "Anyone" access. No manual header needed.
}

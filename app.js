/**
 * js/app.js
 * RCCG Media Department – Scheduling Portal
 * Main application controller
 */

// ── State ──────────────────────────────────────────────────
let state = {
  activeSection: "dashboard",
  schedules: {},          // key: "2026-Q1" → { year, quarter, schedule[] }
  activeScheduleKey: null,
  memberFilter: "",
  memberRoleFilter: "all",
};

// ── DOM helpers ────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, children = []) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => typeof c === "string" ? e.append(c) : e.appendChild(c));
  return e;
};

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type = "info") {
  const icons = { success: "✅", error: "❌", info: "✦" };
  const t = el("div", { class: `toast ${type}` });
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  $("toastContainer").appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Navigation ─────────────────────────────────────────────
function navigate(section) {
  state.activeSection = section;
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const sec = document.querySelector(`[data-section="${section}"]`);
  if (sec) sec.classList.add("active");
  const nav = document.querySelector(`.nav-item[data-nav="${section}"]`);
  if (nav) nav.classList.add("active");
  $("topbarTitle").textContent = {
    dashboard: "Dashboard",
    members:   "Member Roster",
    schedule:  "Schedule",
    workload:  "Workload Analysis",
    settings:  "Settings",
  }[section] || section;
  if (section === "dashboard") renderDashboard();
  if (section === "members")   renderMembers();
  if (section === "schedule")  renderScheduleSection();
  if (section === "workload")  renderWorkload();
}

document.querySelectorAll(".nav-item").forEach(n => {
  n.addEventListener("click", () => navigate(n.dataset.nav));
});

// ── Dashboard ──────────────────────────────────────────────
function renderDashboard() {
  $("statMembers").textContent  = MEMBERS.length;
  $("statSchedules").textContent = Object.keys(state.schedules).length;

  // Upcoming Sundays
  const today = new Date();
  const upcoming = getSundaysForQuarter(today.getFullYear(), Math.ceil((today.getMonth()+1)/3))
    .filter(d => d >= today).slice(0, 5);

  // Find schedules covering upcoming dates
  const upcomingBody = $("upcomingBody");
  upcomingBody.innerHTML = "";
  if (upcoming.length === 0) {
    upcomingBody.innerHTML = `<tr><td colspan="4" class="unassigned" style="padding:20px;text-align:center">No upcoming dates found</td></tr>`;
    return;
  }

  upcoming.forEach(sunday => {
    const iso = sunday.toISOString().slice(0,10);
    // Find if any schedule covers this date
    let found = null;
    for (const key of Object.keys(state.schedules)) {
      const entry = state.schedules[key].schedule.find(e => e.date === iso);
      if (entry) { found = entry; break; }
    }
    const tr = document.createElement("tr");
    const presenter = found ? getMemberById(found.assignments.presenter) : null;
    const sound     = found ? getMemberById(found.assignments.sound)     : null;
    const camera    = found ? getMemberById(found.assignments.camera)    : null;

    tr.innerHTML = `
      <td class="date-cell">${formatDate(iso)}</td>
      <td>${presenter ? `<div class="assignee"><div class="assignee-dot" style="background:#6366f1"></div>${presenter.name}</div>` : '<span class="unassigned">Not assigned</span>'}</td>
      <td>${sound     ? `<div class="assignee"><div class="assignee-dot" style="background:#10b981"></div>${sound.name}</div>`     : '<span class="unassigned">Not assigned</span>'}</td>
      <td>${camera    ? `<div class="assignee"><div class="assignee-dot" style="background:#ef4444"></div>${camera.name}</div>`    : '<span class="unassigned">Not assigned</span>'}</td>
    `;
    upcomingBody.appendChild(tr);
  });

  // Birthday reminder (this month)
  const thisMonth = today.toLocaleString("en-US", { month: "short" });
  const bdays = MEMBERS.filter(m => m.dob && m.dob.toLowerCase().includes(thisMonth.toLowerCase()));
  $("birthdayCount").textContent = bdays.length;
  const bdayList = $("birthdayList");
  bdayList.innerHTML = bdays.length === 0
    ? `<p style="color:var(--text-muted);font-size:13px;padding:10px 0">No birthdays this month</p>`
    : bdays.map(m => `<div style="padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;display:flex;justify-content:space-between"><span>${m.name}</span><span style="color:var(--gold)">${m.dob}</span></div>`).join("");
}

// ── Members ────────────────────────────────────────────────
function renderMembers() {
  const q   = state.memberFilter.toLowerCase();
  const rf  = state.memberRoleFilter;
  const filtered = MEMBERS.filter(m =>
    m.name.toLowerCase().includes(q) &&
    (rf === "all" || m.roles.includes(rf))
  );

  const tbody = $("membersBody");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No members found</td></tr>`;
    return;
  }

  filtered.forEach(m => {
    const initials = m.name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
    const tr = document.createElement("tr");
    if (m.highlight) tr.classList.add("highlight-row");
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar">${initials}</div>
          <span>${m.name}</span>
        </div>
      </td>
      <td style="color:var(--text-muted)">${m.phone || "—"}</td>
      <td style="color:var(--text-muted)">${m.dob || "—"}</td>
      <td>${m.roles.map(r => {
        const role = ROLES.find(x => x.key === r);
        return role ? `<span class="role-badge" style="color:${role.color};background:${role.color}18">${role.label}</span>` : "";
      }).join("")}</td>
      <td style="color:var(--text-muted)">${m.servicePreference || "—"}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editMember(${m.id})">Edit</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $("memberCount").textContent = `${filtered.length} of ${MEMBERS.length} members`;
}

// ── Schedule Section ────────────────────────────────────────
function renderScheduleSection() {
  const container = $("scheduleContent");
  const keys = Object.keys(state.schedules).sort();

  if (keys.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No schedules yet</h3>
        <p>Click "Generate Schedule" to create your first quarterly schedule</p>
      </div>`;
    return;
  }

  // Quarter tabs
  const tabs = el("div", { class: "quarter-tabs" });
  if (!state.activeScheduleKey || !state.schedules[state.activeScheduleKey]) {
    state.activeScheduleKey = keys[keys.length - 1];
  }
  keys.forEach(key => {
    const { year, quarter } = state.schedules[key];
    const tab = el("div", { class: `q-tab${key === state.activeScheduleKey ? " active" : ""}` });
    tab.textContent = `${year} ${quarterLabel(quarter)}`;
    tab.onclick = () => { state.activeScheduleKey = key; renderScheduleSection(); };
    tabs.appendChild(tab);
  });

  // Schedule table
  const { schedule } = state.schedules[state.activeScheduleKey];
  const tableWrap = el("div", { class: "card" });

  const header = el("div", { class: "card-header" });
  header.innerHTML = `
    <span class="card-title">📋 Service Schedule</span>
    <div style="display:flex;gap:8px">
      <button class="btn btn-sm btn-secondary" onclick="printSchedule()">🖨 Print</button>
      <button class="btn btn-sm btn-danger" onclick="deleteSchedule('${state.activeScheduleKey}')">🗑 Delete</button>
    </div>`;
  tableWrap.appendChild(header);

  const wrap = el("div", { class: "table-wrap" });
  const table = document.createElement("table");
  table.className = "schedule-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        ${ROLES.map(r => `<th class="role-col" style="border-left:2px solid ${r.color}20">${r.label}</th>`).join("")}
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${schedule.map((entry, i) => `
        <tr>
          <td class="date-cell">${formatDate(entry.date)}</td>
          ${ROLES.map(r => {
            const m = getMemberById(entry.assignments[r.key]);
            return m
              ? `<td><div class="assignee"><div class="assignee-dot" style="background:${r.color}"></div>${m.name}</div></td>`
              : `<td><span class="unassigned">—</span></td>`;
          }).join("")}
          <td>
            <input type="text" value="${entry.notes || ""}"
              style="background:transparent;border:none;color:var(--text-muted);font-size:12px;width:100%;outline:none;font-family:inherit"
              placeholder="Add note..."
              onchange="updateNote('${state.activeScheduleKey}', ${i}, this.value)">
          </td>
        </tr>`).join("")}
    </tbody>`;
  wrap.appendChild(table);
  tableWrap.appendChild(wrap);

  container.innerHTML = "";
  container.appendChild(tabs);
  container.appendChild(tableWrap);
}

function updateNote(key, idx, value) {
  state.schedules[key].schedule[idx].notes = value;
  saveSchedules(state.schedules);
}

function deleteSchedule(key) {
  if (!confirm(`Delete this schedule? This cannot be undone.`)) return;
  delete state.schedules[key];
  saveSchedules(state.schedules);
  state.activeScheduleKey = null;
  toast("Schedule deleted", "success");
  renderScheduleSection();
}

function printSchedule() {
  window.print();
}

// ── Workload Analysis ───────────────────────────────────────
function renderWorkload() {
  const container = $("workloadContent");
  // Count assignments per member across all schedules
  const counts = {};
  MEMBERS.forEach(m => counts[m.id] = 0);

  for (const key of Object.keys(state.schedules)) {
    for (const entry of state.schedules[key].schedule) {
      for (const role of ROLES) {
        const mid = entry.assignments[role.key];
        if (mid && counts[mid] !== undefined) counts[mid]++;
      }
    }
  }

  const sorted = MEMBERS
    .map(m => ({ ...m, count: counts[m.id] }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...sorted.map(m => m.count), 1);

  container.innerHTML = `
    <div class="card" style="margin-bottom:24px">
      <div class="card-header"><span class="card-title">📊 Assignment Frequency (All Schedules)</span></div>
      <div class="card-body">
        ${sorted.map(m => `
          <div class="workload-bar-wrap">
            <div class="workload-name" title="${m.name}">${m.name}</div>
            <div class="workload-bar-track">
              <div class="workload-bar" style="width:${(m.count/maxCount*100).toFixed(1)}%"></div>
            </div>
            <div class="workload-count">${m.count}</div>
          </div>`).join("")}
        ${sorted.every(m => m.count === 0) ? '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:20px">Generate schedules to see workload data</p>' : ""}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">🎯 Role Coverage</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
          ${ROLES.map(r => {
            const eligible = MEMBERS.filter(m => m.roles.includes(r.key));
            return `
              <div style="background:var(--surface2);border-radius:var(--radius);padding:14px;border-left:3px solid ${r.color}">
                <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${r.label}</div>
                <div style="font-size:24px;font-weight:700;color:${r.color}">${eligible.length}</div>
                <div style="font-size:11px;color:var(--text-muted)">eligible members</div>
              </div>`;
          }).join("")}
        </div>
      </div>
    </div>`;
}

// ── Generate Schedule Modal ─────────────────────────────────
function openGenerateModal() {
  $("genYear").value = new Date().getFullYear();
  $("generateModal").classList.add("open");
}
function closeGenerateModal() {
  $("generateModal").classList.remove("open");
}

function submitGenerate() {
  const year    = parseInt($("genYear").value);
  const quarter = parseInt($("genQuarter").value);

  if (isNaN(year) || year < 2020 || year > 2040) {
    toast("Please enter a valid year (2020–2040)", "error"); return;
  }

  const key = `${year}-Q${quarter}`;
  if (state.schedules[key]) {
    if (!confirm(`A schedule for ${year} Q${quarter} already exists. Overwrite it?`)) return;
  }

  const result = generateSchedule(year, quarter, MEMBERS, ROLES);
  state.schedules[key] = result;
  state.activeScheduleKey = key;
  saveSchedules(state.schedules);

  closeGenerateModal();
  toast(`Schedule generated: ${year} ${quarterLabel(quarter)}`, "success");
  navigate("schedule");
}

// ── Edit Member (stub — expand as needed) ──────────────────
function editMember(id) {
  const m = getMemberById(id);
  if (!m) return;
  toast(`Editing ${m.name} — Full editor coming soon`, "info");
}

// ── Persistence ─────────────────────────────────────────────
function loadPersistedSchedules() {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (raw) state.schedules = JSON.parse(raw);
  } catch { state.schedules = {}; }
}

function saveSchedules(schedules) {
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
}

// ── Member filters ──────────────────────────────────────────
$("memberSearch").addEventListener("input", e => {
  state.memberFilter = e.target.value;
  renderMembers();
});
$("roleFilter").addEventListener("change", e => {
  state.memberRoleFilter = e.target.value;
  renderMembers();
});

// ── Mobile sidebar toggle ───────────────────────────────────
$("mobileMenuBtn")?.addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

// ── Boot ────────────────────────────────────────────────────
loadPersistedSchedules();
navigate("dashboard");

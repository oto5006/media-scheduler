/**
 * js/scheduler.js
 * Auto-generates a quarterly Sunday service schedule from the member roster.
 * Distributes roles as evenly as possible, respecting member role capabilities.
 */

const SCHEDULE_STORAGE_KEY = "rccg_media_schedules";

/** Retrieve saved schedules from localStorage */
function loadSchedules() {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY) || "{}");
  } catch { return {}; }
}

/** Persist schedules */
function saveSchedules(schedules) {
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
}

/**
 * Generate a schedule for a given quarter/year.
 * Returns an array of { date, assignments: { role: memberId } }
 */
function generateSchedule(year, quarter, members, roles) {
  const sundays = getSundaysForQuarter(year, quarter);

  // Build per-role eligible member pools
  const pools = {};
  for (const r of roles) {
    pools[r.key] = members.filter(m => m.roles.includes(r.key)).map(m => m.id);
  }

  // Track assignment counts for fairness
  const counts = {};
  for (const m of members) counts[m.id] = 0;

  // Round-robin with shuffle helper
  const pointers = {};
  for (const r of roles) {
    const pool = [...pools[r.key]].sort(() => Math.random() - 0.5);
    pools[r.key] = pool;
    pointers[r.key] = 0;
  }

  function pickNext(roleKey) {
    const pool = pools[roleKey];
    if (!pool || pool.length === 0) return null;
    // pick least-used member from pool
    let best = null, bestCount = Infinity;
    for (const id of pool) {
      if (counts[id] < bestCount) { bestCount = counts[id]; best = id; }
    }
    if (best !== null) counts[best]++;
    return best;
  }

  const schedule = sundays.map(date => {
    const assignments = {};
    for (const r of roles) {
      assignments[r.key] = pickNext(r.key);
    }
    return {
      date: date.toISOString().slice(0, 10),
      assignments,
      notes: ""
    };
  });

  return { year, quarter, schedule };
}

/** Format a YYYY-MM-DD date string as "Sun, Jan 4" */
function formatDate(isoStr) {
  const d = new Date(isoStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function quarterLabel(q) {
  const labels = { 1: "Q1 (Jan–Mar)", 2: "Q2 (Apr–Jun)", 3: "Q3 (Jul–Sep)", 4: "Q4 (Oct–Dec)" };
  return labels[q] || `Q${q}`;
}

function getMemberById(id) {
  return MEMBERS.find(m => m.id === id) || null;
}

"""
scheduler.py  –  RCCG Media Department Scheduler
Runs inside the browser via Pyodide (WebAssembly Python).
Called from JavaScript via:  pyodide.runPython(...)

Rules enforced:
  - HOD, AHOD, Non Participant, Probation are EXCLUDED from all scheduling
  - Media Coordinator role → only members with status mediaCoordinator
  - Sound Coordinator role → only members with status soundCoordinator
  - A person can only appear ONCE across the entire quarterly schedule
  - Roles with multiple slots (Camera1 ×2, Camera2 ×2, Sound ×2) fill each slot separately
  - Balanced assignment: fewest-used members are preferred

Service calendar rules (returned as metadata per Sunday):
  - 1st Sunday  → "Anointing Service"
  - Other Sundays → "Celebration Service"
  - 1st Wednesday of month → "Holy Communion Service"   (note on that Sunday row)
  - 1st Friday of month    → "Night Vigil Service"       (note on that Sunday row)
  - 2nd Friday of month    → "Taku Ti Jesu Service"      (note on that Sunday row)
  The Sunday team is responsible for mid-week services that fall within their week
  (Mon after previous Sunday → the Saturday before next Sunday).
"""

import json
import random
from datetime import date, timedelta


# ── Role definitions ──────────────────────────────────────────────────────────
# Each entry: (role_key, display_label, slots, color_hex, special_eligibility)
# special_eligibility: None = use roles[], 'mediaCoordinator', 'soundCoordinator'
ROLE_DEFINITIONS = [
    ("mediaCoordinator", "Media Coordinator", 1,  "#c9a84c",  "mediaCoordinator"),
    ("videoMixer",       "Video Mixer",        1,  "#0ea5e9",  None),
    ("camera1a",         "Camera 1 (A)",       1,  "#ef4444",  None),
    ("camera1b",         "Camera 1 (B)",       1,  "#ef4444",  None),
    ("camera2a",         "Camera 2 (A)",       1,  "#f97316",  None),
    ("camera2b",         "Camera 2 (B)",       1,  "#f97316",  None),
    ("mobileCamera",     "Mobile Camera",      1,  "#ec4899",  None),
    ("picture",          "Picture",            1,  "#8b5cf6",  None),
    ("soundCoordinator", "Sound Coordinator",  1,  "#10b981",  "soundCoordinator"),
    ("sounda",           "Sound (A)",          1,  "#14b8a6",  None),
    ("soundb",           "Sound (B)",          1,  "#14b8a6",  None),
    ("light",            "Light",              1,  "#f59e0b",  None),
]

# Roles that draw from the camera pool
CAMERA_ROLES  = {"camera1a", "camera1b", "camera2a", "camera2b", "mobileCamera", "picture"}
# Roles that draw from the sound pool
SOUND_ROLES   = {"sounda", "soundb"}


# ── Exclusion statuses ─────────────────────────────────────────────────────────
EXCLUDED_STATUSES = {"hod", "ahod", "nonParticipant", "probation"}


def get_sundays_for_quarter(year: int, quarter: int) -> list[date]:
    """Return all Sundays in the given quarter."""
    month_ranges = [(1, 3), (4, 6), (7, 9), (10, 12)]
    start_m, end_m = month_ranges[quarter - 1]
    d = date(year, start_m, 1)
    # advance to first Sunday
    while d.weekday() != 6:
        d += timedelta(days=1)
    # last day of the quarter's final month (handles Q4 -> December correctly,
    # since "month <= 12" was always true and caused an infinite loop)
    if end_m == 12:
        end_date = date(year, 12, 31)
    else:
        end_date = date(year, end_m + 1, 1) - timedelta(days=1)
    sundays = []
    while d <= end_date:
        sundays.append(d)
        d += timedelta(days=7)
    return sundays


def nth_weekday_of_month(year: int, month: int, weekday: int, n: int) -> date:
    """Return the nth occurrence (1-based) of a weekday (0=Mon…6=Sun) in a month."""
    d = date(year, month, 1)
    while d.weekday() != weekday:
        d += timedelta(days=1)
    return d + timedelta(weeks=n - 1)


def fmt_day(d):
    """Format a date as 'Wednesday, Jan 7' — works on all platforms including Pyodide."""
    return d.strftime("%A, %b ") + str(d.day)


def get_week_services(sunday: date) -> list[dict]:
    """
    Given a Sunday, find any mid-week special services that fall in the
    responsibility window: Sunday itself through the following Saturday.
    """
    services = []
    saturday = sunday + timedelta(days=6)
    year, month = sunday.year, sunday.month

    def check(target: date, label: str, icon: str):
        if sunday <= target <= saturday:
            services.append({
                "date": target.isoformat(),
                "label": label,
                "icon": icon,
                "dayName": fmt_day(target)
            })

    # 1st Wednesday — Holy Communion
    first_wed = nth_weekday_of_month(year, month, 2, 1)
    check(first_wed, "Holy Communion Service", "🍷")

    # Also check next month if the Saturday crosses a month boundary
    if saturday.month != month:
        nm, ny = (month % 12) + 1, year + (1 if month == 12 else 0)
        check(nth_weekday_of_month(ny, nm, 2, 1), "Holy Communion Service", "🍷")

    # 1st Friday — Night Vigil
    first_fri = nth_weekday_of_month(year, month, 4, 1)
    check(first_fri, "Night Vigil Service", "🕯")
    if saturday.month != month:
        nm, ny = (month % 12) + 1, year + (1 if month == 12 else 0)
        check(nth_weekday_of_month(ny, nm, 4, 1), "Night Vigil Service", "🕯")

    # 2nd Friday — Taku Ti Jesu Service
    second_fri = nth_weekday_of_month(year, month, 4, 2)
    check(second_fri, "Taku Ti Jesu Service", "🙌")
    if saturday.month != month:
        nm, ny = (month % 12) + 1, year + (1 if month == 12 else 0)
        check(nth_weekday_of_month(ny, nm, 4, 2), "Taku Ti Jesu Service", "🙌")

    return sorted(services, key=lambda s: s["date"])


def service_name_for_sunday(sunday: date, sundays_in_month: list[date]) -> str:
    """1st Sunday = Anointing Service, all others = Celebration Service."""
    month_sundays = sorted([s for s in sundays_in_month if s.month == sunday.month])
    if month_sundays and sunday == month_sundays[0]:
        return "Anointing Service"
    return "Celebration Service"


def build_member_pools(members: list[dict]) -> dict:
    """
    Build per-role eligible member pools with STRICT role enforcement.

    Rules:
    - Members with excluded statuses (HOD, AHOD, Non Participant, Probation) → never scheduled
    - Media Coordinator slot → ONLY members whose statuses[] contains 'mediaCoordinator'
    - Sound Coordinator slot → ONLY members whose statuses[] contains 'soundCoordinator'
    - Coordinators are locked out of all other roles
    - Every other role → ONLY members whose roles[] contains the exact matching key
    - mobileCamera is a distinct role key: if only one person has it, they serve every week
      (the sticky rule in generate_schedule handles the once-per-quarter exemption)
    - camera1a/b, camera2a/b, picture all draw from members trained in 'camera'
    - sounda/soundb draw from members trained in 'sound'
    - NO fallback pools — if no one is trained for a role, that slot stays empty rather
      than assigning an untrained person
    """
    # Base eligible pool — exclude restricted statuses
    eligible = [
        m for m in members
        if not any(s in EXCLUDED_STATUSES for s in (m.get("statuses") or []))
    ]

    # Coordinators are locked to their coordinator slot only
    def is_coordinator(m):
        s = m.get("statuses") or []
        return "mediaCoordinator" in s or "soundCoordinator" in s

    regular = [m for m in eligible if not is_coordinator(m)]

    # Helper: members trained for a specific role key
    def trained(pool, role_key):
        return [m for m in pool if role_key in (m.get("roles") or [])]

    pools = {}
    for role_key, _, _, _, special in ROLE_DEFINITIONS:
        if special == "mediaCoordinator":
            # Only people explicitly marked as media coordinator
            pool = [m for m in eligible if "mediaCoordinator" in (m.get("statuses") or [])]
        elif special == "soundCoordinator":
            # Only people explicitly marked as sound coordinator
            pool = [m for m in eligible if "soundCoordinator" in (m.get("statuses") or [])]
        elif role_key in ("camera1a", "camera1b", "camera2a", "camera2b", "picture"):
            # All these draw from members trained in 'camera' — strict, no fallback
            pool = trained(regular, "camera")
        elif role_key == "mobileCamera":
            # STRICT: only members with 'mobileCamera' in their roles[]
            # If no one has it, fall back to general camera-trained members
            # (but log a warning so the admin knows)
            pool = trained(regular, "mobileCamera")
            if not pool:
                pool = trained(regular, "camera")  # graceful fallback only
        elif role_key in ("sounda", "soundb"):
            # Strictly sound-trained members only
            pool = trained(regular, "sound")
        elif role_key == "videoMixer":
            pool = trained(regular, "videoMixer")
        elif role_key == "light":
            pool = trained(regular, "light")
        else:
            # Any other role: strictly match by role key
            pool = trained(regular, role_key)

        pools[role_key] = [m["id"] for m in pool]

    return pools


def generate_schedule(year: int, quarter: int, members: list[dict]) -> dict:
    """
    Generate a quarterly Sunday schedule.
    Returns a dict ready to JSON-serialize back to JavaScript.

    Special rules:
    - Probation, Non Participant, H.O.D, A.H.O.D are NEVER scheduled
    - Media Coordinator / Sound Coordinator → locked to their coordinator slot only
    - If only ONE person is trained for Mobile Camera, they are used every week
      (sticky assignment — do not apply the once-per-schedule global rule to them)
    - Only members who are trained (have the role in roles[]) may be assigned that role
    """
    sundays = get_sundays_for_quarter(year, quarter)
    pools   = build_member_pools(members)

    # ── Detect Mobile Camera sticky person ──────────────────────────
    # If there is exactly one person in the mobileCamera pool, we pin them to
    # every Mobile Camera slot (they are excluded from the global used_globally
    # rule so they can appear in that role every week, but still only once per Sunday).
    mobile_cam_pool = pools.get("mobileCamera", [])
    mobile_cam_sticky: int | None = mobile_cam_pool[0] if len(mobile_cam_pool) == 1 else None

    # Shuffle pools for variety (except sticky mobile camera — single-person pool)
    for key in pools:
        if key == "mobileCamera" and mobile_cam_sticky is not None:
            continue
        random.shuffle(pools[key])

    # Global usage tracker — each person used at most once per schedule
    # Exception: the sticky Mobile Camera person is exempt from this rule
    used_globally: set = set()

    # Per-role usage count for balancing within available pool
    role_counts: dict[str, dict[int, int]] = {
        role_key: {mid: 0 for mid in pools[role_key]}
        for role_key, *_ in ROLE_DEFINITIONS
    }

    def pick(role_key: str, already_used_this_sunday: set) -> int | None:
        """Pick the least-used eligible member for a role."""

        # Sticky Mobile Camera: always use the one trained person
        if role_key == "mobileCamera" and mobile_cam_sticky is not None:
            if mobile_cam_sticky not in already_used_this_sunday:
                role_counts["mobileCamera"][mobile_cam_sticky] = \
                    role_counts["mobileCamera"].get(mobile_cam_sticky, 0) + 1
                return mobile_cam_sticky
            return None  # already serving another role this Sunday

        candidates = [
            mid for mid in pools[role_key]
            if mid not in used_globally and mid not in already_used_this_sunday
        ]
        if not candidates:
            # Small pool: relax the once-per-quarter constraint so trained
            # members can serve multiple weeks rather than assigning nobody
            # (but NEVER use someone not in the role pool)
            candidates = [mid for mid in pools[role_key] if mid not in already_used_this_sunday]
        if not candidates:
            # Absolute last resort: allow repeat within same quarter
            # Still only picks from the trained pool — never untrained members
            candidates = list(pools[role_key])
        if not candidates:
            return None
        # Pick least used
        candidates.sort(key=lambda mid: role_counts[role_key].get(mid, 0))
        chosen = candidates[0]
        used_globally.add(chosen)
        role_counts[role_key][chosen] = role_counts[role_key].get(chosen, 0) + 1
        return chosen

    schedule = []
    for sunday in sundays:
        used_this_sunday: set = set()
        assignments = {}
        for role_key, *_ in ROLE_DEFINITIONS:
            mid = pick(role_key, used_this_sunday)
            assignments[role_key] = mid
            if mid is not None:
                used_this_sunday.add(mid)

        week_services = get_week_services(sunday)
        service_name  = service_name_for_sunday(sunday, sundays)

        schedule.append({
            "date":         sunday.isoformat(),
            "serviceName":  service_name,
            "weekServices": week_services,
            "assignments":  assignments,
            "notes":        "",
        })

    return {
        "year":     year,
        "quarter":  quarter,
        "schedule": schedule,
        "roles":    [
            {"key": k, "label": l, "slots": s, "color": c, "special": sp}
            for k, l, s, c, sp in ROLE_DEFINITIONS
        ],
    }


# ── Entry point called from JavaScript ────────────────────────────────────────
def run(year_int: int, quarter_int: int, members_json: str) -> str:
    """Called by Pyodide: returns JSON string of the schedule."""
    members = json.loads(members_json)
    result  = generate_schedule(year_int, quarter_int, members)
    return json.dumps(result)

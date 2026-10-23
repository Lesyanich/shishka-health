/*
  "● Open till 18:30" — the status the header carries (SPEC.md §3.1, §4.1).

  The hours themselves are content, not code: `site_content.cta.hoursTime`,
  edited in the database like the rest of the copy, with DEFAULT_CONTENT's
  "9:30 – 18:30" as the fallback. This file only parses that string and answers
  "open right now?". Whole days off (Wednesday) are a venue fact, not copy:
  VENUE.closedDays in lib/venue.js, passed in by the caller.

  The clock that matters is the KITCHEN's. A guest reading the menu from Moscow
  at 16:00 their time must be told the Phuket kitchen is shut, not that it is
  open — so the comparison runs in Asia/Bangkok rather than in whatever zone the
  phone is set to. That is the whole reason this is not two lines inline.
*/

const KITCHEN_TZ = "Asia/Bangkok";

// "9:30 – 18:30" / "09:30-18:30" / "9.30 — 18.30" — one shape in the DB today,
// but it is hand-edited copy, so accept the obvious variants and give up
// cleanly (null) rather than rendering "Open till NaN:undefined".
const RANGE_RE = /(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})/;

export function parseHours(hoursTime) {
  const m = RANGE_RE.exec(String(hoursTime ?? ""));
  if (!m) return null;
  const [oh, om, ch, cm] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (oh > 23 || ch > 23 || om > 59 || cm > 59) return null;
  return {
    open: { h: oh, m: om, label: `${oh}:${String(om).padStart(2, "0")}` },
    close: { h: ch, m: cm, label: `${ch}:${String(cm).padStart(2, "0")}` },
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 24 * 60 * 60 * 1000;

// Minutes since midnight and weekday (0 = Sunday) in the kitchen's own
// timezone. Intl is doing the DST/offset work; if it is unavailable or throws,
// fall back to the device clock — a status an hour out is better than no
// header at all.
function kitchenClock(now) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: KITCHEN_TZ,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    const m = Number(parts.find((p) => p.type === "minute")?.value);
    const day = WEEKDAYS.indexOf(parts.find((p) => p.type === "weekday")?.value);
    if (Number.isFinite(h) && Number.isFinite(m) && day >= 0) {
      return { mins: (h % 24) * 60 + m, day };
    }
  } catch {
    /* no Intl timezone support — device clock below */
  }
  return { mins: now.getHours() * 60 + now.getMinutes(), day: now.getDay() };
}

/*
  The kitchen's weekday name for a date, in the page language — "Wednesday",
  "среда", "วันพุธ", "الأربعاء". From Intl, so no translator has to keep seven
  day names in four dictionaries.
*/
export function weekdayName(date, lang, style = "long") {
  try {
    return new Intl.DateTimeFormat(lang, { timeZone: KITCHEN_TZ, weekday: style }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", { weekday: style }).format(date);
  }
}

// Any date that falls on `day` (0 = Sunday), for weekdayName.
export function dateForWeekday(day) {
  // 2026-01-04 was a Sunday; noon UTC is the same date in Bangkok.
  return new Date(Date.UTC(2026, 0, 4 + day, 12));
}

/*
  { open, hours, opensOn } — or null when the copy carries no parseable range,
  in which case the caller renders no status rather than guessing one.

  `closedDays` are whole weekdays off (VENUE.closedDays). `opensOn` is null
  when the next opening reads naturally from the time alone — later today, or
  tomorrow morning after an ordinary close — and otherwise the Date of the
  next opening day, so the header can say "opens Thu 9:30" instead of a bare
  "opens 9:30" that, on a day off, a guest would read as "today".
*/
export function openStatus(hoursTime, now = new Date(), closedDays = []) {
  const hours = parseHours(hoursTime);
  if (!hours) return null;
  const { mins, day } = kitchenClock(now);
  const from = hours.open.h * 60 + hours.open.m;
  const to = hours.close.h * 60 + hours.close.m;
  const closedToday = closedDays.includes(day);
  // A range that wraps past midnight ("18:00 – 02:00") is not what this kitchen
  // does, but the copy could say it, so read it as two intervals rather than as
  // "never open".
  const inRange = from <= to ? mins >= from && mins < to : mins >= from || mins < to;
  const open = inRange && !closedToday;
  if (open) return { open, hours, opensOn: null };

  // Later today: nothing to add.
  if (!closedToday && mins < from) return { open, hours, opensOn: null };
  // Otherwise the first day after today that is not a day off.
  let offset = 1;
  while (offset < 7 && closedDays.includes((day + offset) % 7)) offset++;
  const opensOn = closedToday || offset > 1 ? new Date(now.getTime() + offset * DAY_MS) : null;
  return { open, hours, opensOn };
}

/*
  "● Open till 18:30" — the status the header carries (SPEC.md §3.1, §4.1).

  The hours themselves are content, not code: `site_content.cta.hoursTime`,
  edited in the database like the rest of the copy, with DEFAULT_CONTENT's
  "9:30 – 18:30" as the fallback. This file only parses that string and answers
  "open right now?".

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

// Minutes since midnight in the kitchen's own timezone. Intl is doing the
// DST/offset work; if it is unavailable or throws, fall back to the device
// clock — a status an hour out is better than no header at all.
function kitchenMinutes(now) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: KITCHEN_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    const m = Number(parts.find((p) => p.type === "minute")?.value);
    if (Number.isFinite(h) && Number.isFinite(m)) return (h % 24) * 60 + m;
  } catch {
    /* no Intl timezone support — device clock below */
  }
  return now.getHours() * 60 + now.getMinutes();
}

/*
  { open, hours } — or null when the copy carries no parseable range, in which
  case the caller renders no status rather than guessing one.
*/
export function openStatus(hoursTime, now = new Date()) {
  const hours = parseHours(hoursTime);
  if (!hours) return null;
  const mins = kitchenMinutes(now);
  const from = hours.open.h * 60 + hours.open.m;
  const to = hours.close.h * 60 + hours.close.m;
  // A range that wraps past midnight ("18:00 – 02:00") is not what this kitchen
  // does, but the copy could say it, so read it as two intervals rather than as
  // "never open".
  const open = from <= to ? mins >= from && mins < to : mins >= from || mins < to;
  return { open, hours };
}

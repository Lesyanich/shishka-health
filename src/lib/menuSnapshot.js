/*
  Menu snapshot — shape + validation, shared by the build script
  (scripts/snapshot-menu.mjs), the CI check (scripts/snapshot-check.mjs) and the
  browser (src/hooks/useMenu.js). Plain ESM with no Vite or DOM dependency so
  Node can import it too: ONE definition of "valid menu data" for all three.

  The snapshot is the RAW rows of every resource in contracts/menu-contract.json,
  fetched at build time and shipped as /menu-snapshot.json. The browser paints
  from it immediately and revalidates against Supabase in the background; the
  build refuses to produce a deployment without a valid one. See
  docs/static-menu-snapshot.md.

  {
    version: 1,
    generatedAt: ISO string,
    raw: {
      dishes:        menu_public rows (ordered by display_order),
      tags:          nomenclature_tags rows,
      content:       site_content rows,
      modifiers:     menu_modifiers rows,
      tiers:         price_tiers rows (may be empty — no bundle offer today),
      translations:  { ru: [...], th: [...], ar: [...] }   menu_translations rows per lang
    }
  }
*/

export const SNAPSHOT_VERSION = 1;
export const SNAPSHOT_FILE = "menu-snapshot.json";
export const SNAPSHOT_LANGS = ["ru", "th", "ar"];

const arr = (v) => Array.isArray(v);

/** Returns a list of problems; an empty list means the raw rows are safe to render. */
export function validateRaw(raw) {
  const problems = [];
  if (!raw || typeof raw !== "object") return ["raw payload missing"];

  for (const k of ["dishes", "tags", "content", "modifiers", "tiers"]) {
    if (!arr(raw[k])) problems.push(`${k} is not an array`);
  }
  if (problems.length) return problems;

  if (raw.dishes.length < 1) problems.push("menu_public is empty");
  // The view exposes only sellable dishes; a dish without id/name/price would
  // reach the guest as a blank card.
  const bad = raw.dishes.filter((d) => !d || !d.id || !(d.customer_short_name || d.name) || d.price == null);
  if (bad.length) problems.push(`${bad.length} dish row(s) without id, name or price`);
  // Ids are the join key for tags and modifiers; a duplicate means a broken view.
  const ids = new Set(raw.dishes.map((d) => d?.id));
  if (ids.size !== raw.dishes.length) problems.push("duplicate dish ids");
  return problems;
}

export function validateSnapshot(snap) {
  if (!snap || typeof snap !== "object") return ["snapshot is not an object"];
  const problems = [];
  if (snap.version !== SNAPSHOT_VERSION) problems.push(`snapshot version ${snap.version}, expected ${SNAPSHOT_VERSION}`);
  if (!snap.generatedAt || Number.isNaN(Date.parse(snap.generatedAt))) problems.push("generatedAt missing");
  problems.push(...validateRaw(snap.raw));
  if (!snap.raw?.translations || typeof snap.raw.translations !== "object") {
    problems.push("translations missing");
  }
  return problems;
}

/** Browser: load the shipped snapshot. Resolves null (never rejects) when absent or invalid. */
export async function loadSnapshot(baseUrl = "/") {
  try {
    const res = await fetch(`${baseUrl}${SNAPSHOT_FILE}`, { cache: "no-cache" });
    if (!res.ok) return null;
    const snap = await res.json();
    const problems = validateSnapshot(snap);
    if (problems.length) {
      console.warn("menu snapshot ignored:", problems.join("; "));
      return null;
    }
    return snap;
  } catch {
    // vite dev has no snapshot and answers with index.html -> JSON parse error.
    return null;
  }
}

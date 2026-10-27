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

// PostgREST's default max-rows. A response of exactly this many rows is almost
// certainly TRUNCATED, so live data of that length is never trusted over a snapshot.
export const MAX_ROWS = 1000;

// Contract minRows per snapshot key — scripts/snapshot-check.mjs asserts these equal
// contracts/menu-contract.json, so the browser, the build and CI share one number.
export const MIN_ROWS = { dishes: 1, tags: 1, content: 1, modifiers: 1, tiers: 0 };
// Translations: every shipped language must have rows (aeo-prerender requires the same).
export const MIN_TRANSLATIONS = 1;
// Live dishes below this share of the snapshot's are a broken view, not a menu change.
export const MIN_DISH_SHARE = 0.5;

const arr = (v) => Array.isArray(v);

/** Dish rows only: the view exposes sellable dishes, so a dish without id/name/price is a broken row. */
export function validateDishes(dishes) {
  if (!arr(dishes)) return ["dishes is not an array"];
  const problems = [];
  if (dishes.length < MIN_ROWS.dishes) problems.push("menu_public is empty");
  const bad = dishes.filter((d) => !d || !d.id || !(d.customer_short_name || d.name) || d.price == null);
  if (bad.length) problems.push(`${bad.length} dish row(s) without id, name or price`);
  // Ids are the join key for tags and modifiers; a duplicate means a broken view.
  if (new Set(dishes.map((d) => d?.id)).size !== dishes.length) problems.push("duplicate dish ids");
  return problems;
}

/** Returns a list of problems; an empty list means the raw rows are safe to ship/render. */
export function validateRaw(raw) {
  if (!raw || typeof raw !== "object") return ["raw payload missing"];
  const problems = [];
  for (const k of Object.keys(MIN_ROWS)) {
    if (!arr(raw[k])) problems.push(`${k} is not an array`);
    else if (raw[k].length < MIN_ROWS[k]) problems.push(`${k}: ${raw[k].length} rows, contract requires at least ${MIN_ROWS[k]}`);
  }
  if (arr(raw.dishes)) problems.push(...validateDishes(raw.dishes));
  return problems;
}

export function validateSnapshot(snap) {
  if (!snap || typeof snap !== "object") return ["snapshot is not an object"];
  const problems = [];
  if (snap.version !== SNAPSHOT_VERSION) problems.push(`snapshot version ${snap.version}, expected ${SNAPSHOT_VERSION}`);
  if (!snap.generatedAt || Number.isNaN(Date.parse(snap.generatedAt))) problems.push("generatedAt missing");
  problems.push(...validateRaw(snap.raw));
  const tr = snap.raw?.translations;
  if (!tr || typeof tr !== "object") problems.push("translations missing");
  else for (const l of SNAPSHOT_LANGS) {
    if (!Array.isArray(tr[l]) || tr[l].length < MIN_TRANSLATIONS) problems.push(`translations.${l}: fewer than ${MIN_TRANSLATIONS} rows`);
  }
  // Tags and modifiers are filtered to menu_public dishes at build time.
  if (!problems.length) {
    const ids = new Set(snap.raw.dishes.map((d) => d.id));
    const strayTags = snap.raw.tags.filter((t) => !ids.has(t.nomenclature_id)).length;
    const strayMods = snap.raw.modifiers.filter((m) => !ids.has(m.dish_id)).length;
    if (strayTags) problems.push(`${strayTags} tag row(s) for dishes not in menu_public`);
    if (strayMods) problems.push(`${strayMods} modifier row(s) for dishes not in menu_public`);
  }
  return problems;
}

/** Browser: load the shipped snapshot. Resolves null (never rejects) when absent or invalid. */
export async function loadSnapshot(baseUrl = "/") {
  try {
    // Default cache mode on purpose: index.html preloads this URL, and a no-cache fetch
    // would bypass the preload. Vercel serves public files max-age=0, must-revalidate.
    const res = await fetch(`${baseUrl}${SNAPSHOT_FILE}`);
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

/** Keep only rows belonging to the given dish ids (data minimisation + size). */
export function filterToDishes(raw) {
  const ids = new Set(raw.dishes.map((d) => d.id));
  return {
    ...raw,
    tags: raw.tags.filter((t) => ids.has(t.nomenclature_id)),
    modifiers: raw.modifiers.filter((m) => ids.has(m.dish_id)),
  };
}

/*
  Merge a LIVE answer over the snapshot.

  The MENU is one atomic unit: dishes + tags + modifiers + (non-English) translations.
  Tags carry allergens, modifiers carry the "From X" floor prices, translations name the
  dishes — mixing live dishes with snapshot tags would show a new dish with no allergens
  ("allergen-free") or a wrong price. So live replaces the snapshot menu only if EVERY
  part is valid: not errored (null), at least the contract minimum, not exactly max-rows
  (probably truncated), and dishes at least MIN_DISH_SHARE of the snapshot's. If any part
  fails, the WHOLE snapshot menu stays. site_content and price_tiers are independent
  (each keeps its snapshot rows on failure).

  live: { dishes, tags, content, modifiers, tiers, translations } — an errored resource is
        null/undefined. `lang` is the page language.
  snap: snapshot.raw with translations narrowed to `lang`, or null (no snapshot).
  Returns { raw, kept, live, problems }; `kept` names what stayed from the snapshot
  ("menu" = the whole atomic unit), `live` is true when the live menu was used.
*/
export function mergeLive(snap, live, lang) {
  const kept = [];
  const out = {};
  const ok = (k, rows) => Array.isArray(rows) && rows.length >= MIN_ROWS[k] && rows.length < MAX_ROWS;

  const liveTr = live?.translations;
  const trOk = lang === "en" || (Array.isArray(liveTr) && liveTr.length >= MIN_TRANSLATIONS && liveTr.length < MAX_ROWS);
  let menuOk =
    ok("dishes", live?.dishes) && validateDishes(live.dishes).length === 0 &&
    ok("tags", live?.tags) && ok("modifiers", live?.modifiers) && trOk;
  if (menuOk && snap && live.dishes.length < snap.dishes.length * MIN_DISH_SHARE) menuOk = false;

  if (menuOk) {
    Object.assign(out, { dishes: live.dishes, tags: live.tags, modifiers: live.modifiers });
    out.translations = lang === "en" ? [] : liveTr;
  } else {
    Object.assign(out, {
      dishes: snap?.dishes, tags: snap?.tags ?? [], modifiers: snap?.modifiers ?? [],
      translations: lang === "en" ? [] : snap?.translations ?? [],
    });
    kept.push("menu");
  }

  for (const k of ["content", "tiers"]) {
    if (ok(k, live?.[k])) out[k] = live[k];
    else { out[k] = snap?.[k] ?? []; kept.push(k); }
  }

  const problems = [];
  if (!Array.isArray(out.dishes)) problems.push("live menu invalid and no snapshot");
  else problems.push(...validateDishes(out.dishes));
  return { raw: out, kept, live: menuOk, problems };
}

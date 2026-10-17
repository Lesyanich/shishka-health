/*
  EAT / DRINK / SWEET — the three groups the menu page renders its sections under
  (see docs/redesign/SPEC.md §2).

  A group is NOT a database object. It is an editorial ordering of real sections,
  and it lives in `site_content` under the key `menu_groups`, written by
  shishka-os migration 500. The site only reads it. The shape is an ordered ARRAY,
  because key order in a JSON object is not guaranteed and EAT → DRINK → SWEET is
  the one thing this key exists to preserve:

    { "groups": [ { "key": "EAT",   "sections": ["<section_id>", "…"] },
                  { "key": "DRINK", "sections": ["…"] },
                  { "key": "SWEET", "sections": ["…"] } ] }

  MENU_GROUPS_FALLBACK below has exactly that shape — deliberately, so the two
  paths cannot disagree about group order. It is the default in DEFAULT_CONTENT,
  so a `menu_groups` row in the database simply replaces it (lib/content.js).

  Section order inside a group is the array's own order. Do NOT sort by
  `section_sort_order`: that orders sections within the page, not the groups, and
  sorting the array would throw away the only thing it carries.

  Why the fallback keys on section ids and not names: `menu_public` exposes no
  section_code, and `section_name` is both emoji-decorated and translated per
  language — an id is the only stable handle the site can hold. The cost is that
  a section created later is unknown to this file; `buildMenuGroups` answers that
  with a trailing ungrouped bucket (key `null`) so a new section can never
  silently vanish from the menu.
*/

// The 12 live sections as of 2026-10-17, in the order §2 asks for, as closely as
// pre-migration data allows: Salads and Bowls are still two sections (migration
// 500 merges them), and Extras is still its own section (500 folds it into the
// dips section as "Sides"). Once 500 is applied, the database carries the real
// `menu_groups` row and this constant stops being read at all.
export const MENU_GROUPS_FALLBACK = {
  groups: [
    {
      key: "EAT",
      sections: [
        "f8fc367e-f8da-4aa9-a2a5-c19f991a31ca", // Salads
        "e187f37e-3b17-451a-baa2-c73fe1b35d48", // Bowls
        "cda9f4a1-e6a6-493b-bc9d-6da30565cca0", // Whole Wheat Wraps
        "e79b447c-ec23-4eb6-b17d-a5183ddb815c", // Protein Meals
        "f8e8aa0d-e549-42d7-bf5b-de70c2f9cbbb", // All-Day Breakfast
        "ce2f9959-92af-4985-a2c1-270626fd02ad", // Sauce, Dressing and Dips
        "1675790d-6198-425d-8bbe-0051a3347c6e", // Extras → becomes "Sides" inside the dips section
      ],
    },
    {
      key: "DRINK",
      sections: [
        "4017ae91-baad-468d-8667-75e74467fd28", // Coffee
        "53412569-b9ad-46fa-9b96-8ad02a074980", // Matcha
        "e1820bb8-7c12-457f-9cd1-7c42ae97e7a1", // Smoothies
        "7ed1ef53-f781-43da-ba37-684009a16fed", // Juices
      ],
    },
    {
      key: "SWEET",
      sections: [
        "3cd6c1cf-89d4-45c7-a4c0-92cf47676f2f", // Chocolate
      ],
    },
  ],
};

// Accept only the documented shape. A malformed row (hand-edited in the Supabase
// dashboard, say) must not blank the menu — it falls back to the code default.
function readGroups(configured) {
  const groups = configured?.groups;
  if (!Array.isArray(groups) || groups.length === 0) return MENU_GROUPS_FALLBACK.groups;
  const clean = groups
    .filter((g) => g && typeof g.key === "string" && Array.isArray(g.sections))
    .map((g) => ({ key: g.key, sections: g.sections.filter((id) => typeof id === "string") }));
  return clean.length > 0 ? clean : MENU_GROUPS_FALLBACK.groups;
}

/*
  Lay the live sections out under their groups.

  sections  — the section list assembled by useMenu.js (only sections that have
              at least one dish ever reach it, so an empty group cannot appear)
  configured — `content.menu_groups`, i.e. the database row if there is one and
              MENU_GROUPS_FALLBACK if there is not

  Returns [{ key, sections: [<section_id>, …] }] in group order, each group's
  sections in the configured order, groups with nothing live dropped, and any
  section no group claims appended as a final { key: null } bucket in
  `section_sort_order`. The result is ids, not section objects: the caller
  already holds `categories` and keying off it keeps one source of truth for a
  section's name, sort and dishes.
*/
export function buildMenuGroups(sections, configured) {
  const live = new Map((sections ?? []).filter((s) => s?.id).map((s) => [s.id, s]));
  const claimed = new Set();

  const groups = [];
  for (const g of readGroups(configured)) {
    const ids = g.sections.filter((id) => live.has(id));
    for (const id of ids) claimed.add(id);
    if (ids.length > 0) groups.push({ key: g.key, sections: ids });
  }

  // Sections the configuration does not mention: a section added after this file
  // was written, or — once migration 500 lands — every section, if the
  // `site_content` read failed and the stale fallback ids no longer resolve.
  // Either way the dishes still render; they just carry no group eyebrow.
  const rest = Array.from(live.values())
    .filter((s) => !claimed.has(s.id))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((s) => s.id);
  if (rest.length > 0) groups.push({ key: null, sections: rest });

  return groups;
}

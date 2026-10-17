import { allComingSoon } from "./dishFacts.js";

/*
  Turning the menu payload into the page's sections (SPEC.md §2).

  What this file owns: the DOM id a section answers to, whether it renders as a
  grid or a list, and how its dishes split into subcategory tabs. What it does
  NOT own: which sections exist, their order, or their group — that is
  `site_content.menu_groups`, read by lib/menuGroups.js. Nothing here invents a
  grouping the database does not have; that mistake already cost this site the
  spring-rolls section nobody could find in the admin.
*/

/*
  The slug is taken from the ENGLISH section name (`category.key`, set by
  i18n/localize.js) and never from the displayed name.

  Two reasons. A section's display name is translated, so slugging it would make
  `#wraps` on /en and `#обертки` on /ru — the same shareable anchor would differ
  per language. And `section_id` is a UUID: `#4017ae91-…` is a URL nobody can
  read or type, which defeats §4.2's point in asking for a hash at all.
*/
export function sectionSlug(name) {
  return (
    String(name ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

/*
  Unique DOM ids, in page order. Two sections can slug the same (two
  translations of one word, or a name that is all emoji and strips to nothing),
  and a duplicate id would send every pill for it to whichever came first.
*/
export function assignSectionIds(sections) {
  const used = new Map();
  const out = new Map();
  for (const s of sections) {
    const base = sectionSlug(s.key ?? s.name);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    out.set(s.id, seen === 0 ? base : `${base}-${seen + 1}`);
  }
  return out;
}

/*
  Sauces, dressings, dips and the bread/extras shelf, by `category_code`.

  A code prefix rather than a section name: the name is translated and
  emoji-decorated, and it is about to change — migration 500 folds "🍽️ Extras"
  into "🥫 Sauce, Dressing and Dips" and renames it "Sides", so a name match
  would ship broken on exactly the day the data lands. The codes outlive the
  rename. `KP-FIN-SDR` is the same handle contracts/menu-contract.json already
  keys the free-sauce pool on.
*/
const DIP_CODES = /^KP-FIN-(SDR|BRC)/;

/*
  grid (2 up on mobile, 3 up on desktop) or list (one row per dish)?

  SPEC §3.5: drinks and dips are picked by name and price, not by picture, so
  they read as a list. Everything you eat off a plate is picked by the
  photograph, so it reads as a grid.

  Decided from the group and the dishes' own codes — never a list of section
  names in code. DRINK comes from `menu_groups`, which the CEO edits in the
  database; the dips rule keys off `category_code`. Both survive migration 500:
  before it the dips and extras shelves are two sections and each resolves to a
  list on its own; after it they are one mixed section and still do.
*/
export function sectionLayout(groupKey, items) {
  if (groupKey === "DRINK") return "list";
  const dips = (items ?? []).filter((d) => DIP_CODES.test(d?.category_code ?? ""));
  return dips.length > 0 && dips.length * 2 >= (items ?? []).length ? "list" : "grid";
}

/*
  Subcategory tabs inside a section (§2: tabs only when a section has ≥ 2
  categories, "All" first and selected by default).

  Subcategories come from the dish's own `category_*` fields — the leaf the
  admin panel owns — with Coffee's Hot/Cold as the one synthesized exception,
  already quarantined in lib/coffeeSplit.js and applied in useMenu.js. A flat
  section resolves to a single subcategory whose id IS the section id, which is
  how `hasSubcategories` tells the two apart.
*/
export function subcategoriesOf(items, sectionId) {
  const map = new Map();
  for (const d of items ?? []) {
    const id = d.subcategory_id ?? sectionId;
    if (!map.has(id)) {
      map.set(id, { id, name: d.subcategory_name ?? "", sort: d.subcategory_sort ?? 0, items: [] });
    }
    map.get(id).items.push(d);
  }
  return Array.from(map.values()).sort((a, b) => a.sort - b.sort);
}

export function hasSubcategories(subs, sectionId) {
  return subs.length > 1 || (subs.length === 1 && subs[0].id !== sectionId);
}

/*
  The sections of the page, in order, each with its group, its dishes and its
  layout. `groups` is what lib/menuGroups.js returned (ids only), `categories`
  carries name/key/sort, `dishes` are already filtered to what renders.

  A group with no live section is already dropped upstream; a section no group
  claims arrives in a trailing `key: null` bucket and renders WITHOUT an
  eyebrow rather than vanishing. That matters on the day migration 500 lands:
  the fallback ids in lib/menuGroups.js stop resolving, every section falls into
  that bucket, and the menu must still be a menu.
*/
export function buildSections(groups, categories, dishes) {
  const byId = new Map((categories ?? []).map((c) => [c.id, c]));
  const out = [];
  for (const g of groups ?? []) {
    for (const id of g.sections) {
      const cat = byId.get(id);
      if (!cat) continue;
      const items = (dishes ?? []).filter((d) => (d.section_id ?? d.category_id) === id);
      if (items.length === 0) continue;
      out.push({
        id,
        name: cat.name,
        key: cat.key ?? cat.name,
        group: g.key,
        items,
        layout: sectionLayout(g.key, items),
        // §2: a category whose items are ALL coming soon reads "<name> · soon"
        // in the rail and "Coming soon" in place of "from ฿…". Its dishes still
        // render — the guest is being shown what is next, not an empty hole.
        allSoon: allComingSoon(items),
      });
    }
  }
  return out;
}

/*
  The handle a dish answers to in the URL — `?dish=<slug>` (SPEC §3, the dish
  sheet "has its own URL so a dish can be shared").

  Slugged from the ENGLISH name for the same reason sections are: a shared link
  must mean the same dish whatever language the sender was reading. `name_en` is
  set for every language by i18n/localize.js.

  Collisions are real, not theoretical: §8 records "Chicken ShishTawook Wrap"
  sitting on TWO product codes today, and a link that silently opens the other
  dish is worse than an ugly link. A second claimant therefore carries its
  product code, and a dish whose name strips to nothing (an all-emoji name) is
  identified by its code alone.
*/
export function assignDishSlugs(dishes) {
  const taken = new Set();
  const out = new Map();
  for (const d of dishes ?? []) {
    const base = sectionSlug(d.name_en ?? d.name);
    const code = sectionSlug(d.product_code ?? "");
    let slug = base === "section" ? code || String(d.id) : base;
    if (taken.has(slug)) slug = code ? `${slug}-${code}` : String(d.id);
    // Still taken (two rows, one code — impossible today, cheap to survive).
    if (taken.has(slug)) slug = String(d.id);
    taken.add(slug);
    out.set(d.id, slug);
  }
  return out;
}

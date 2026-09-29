/*
  Overlay translations onto the assembled (English, emoji-stripped, title-cased)
  menu payload. Runs for every language, English included, because it also adds
  the stable English keys the rest of the app relies on:

    dish.name_en              — what the cashier reads on the order (Cart)
    category.key              — EN section name; App.jsx keys tints/art/intros on it
    dish.section_key          — same, per dish
    dish.subcategory_key      — EN subgroup name (ManakishTiers keys tiers on it)
    group.name_en / option.name_en — carried into the order for the counter

  Display fields (name, description, …) are replaced only when a FRESH translation
  exists (the menu_translations view already drops stale ones) — anything missing
  stays English. English display strings are never touched, so the English site
  renders exactly as before.

  rows: [{ entity, entity_key, field, value }] from menu_translations for LANG.
*/
import { LANG, DEFAULT_LANG, t } from "./index.js";
import { stripEmoji, deepStripEmoji } from "../lib/text.js";

const EN = LANG === DEFAULT_LANG;

function indexRows(rows) {
  const map = new Map();
  for (const r of rows ?? []) {
    map.set(`${r.entity}|${r.entity_key}|${r.field}`, r.value);
  }
  return map;
}

// Dictionary lookup that reports a miss (t() echoes the key back).
function dict(key, vars) {
  const s = t(key, vars);
  return s === key ? null : s;
}

// Subgroups that are built in useMenu.js rather than read from the DB.
function syntheticSubName(id) {
  if (id === "sec-spring-rolls") return dict("sub.springRolls");
  if (id === "grp-sides") return dict("sub.sides");
  if (typeof id === "string" && id.endsWith(":cold")) return dict("sub.coldCoffee");
  if (typeof id === "string" && id.endsWith(":hot")) return dict("sub.hotCoffee");
  return null;
}

const BADGE_KEYS = {
  "Coming Soon": "badge.comingSoon",
  "Coming soon": "badge.comingSoon",
  "Out of Stock": "badge.outOfStock",
  "Out of stock": "badge.outOfStock",
  Featured: "badge.featured",
};

// What the page shows before the menu has loaded. Only the hero renders that
// early; without this a Russian page flashes the English banner first.
export function initialContent(defaults) {
  if (EN) return defaults;
  return { ...defaults, hero: { ...defaults.hero, banner: t("hero.banner"), sub: t("hero.sub") } };
}

export function localizeMenu(data, rows) {
  if (!data) return data;
  const tr = indexRows(rows);
  const text = (entity, key, field) => {
    const v = tr.get(`${entity}|${key}|${field}`);
    return typeof v === "string" && v ? stripEmoji(v) : null;
  };

  const categoryName = (id, fallback) =>
    EN ? fallback : (text("category", id, "name") ?? syntheticSubName(id) ?? fallback);

  const modName = (name) => {
    if (EN || !name) return name;
    const direct = text("modifier_option", name, "name") ?? dict(`mod.${name}`);
    if (direct) return direct;
    // Website-side spring roll removals: "No Mango" → "Без: Манго".
    const m = /^No (.+)$/.exec(name);
    if (m) {
      const inner = text("modifier_option", m[1], "name") ?? dict(`mod.${m[1]}`) ?? m[1];
      return t("build.no", { name: inner });
    }
    return name;
  };
  const groupName = (name) =>
    EN || !name ? name : (text("modifier_group", name, "name") ?? dict(`modgroup.${name}`) ?? name);

  const benefitLabel = (b) => {
    if (EN) return b.label;
    if (b.slug === "protein") return t(b.label === "High Protein" ? "benefit.highProtein" : "benefit.protein");
    return dict(`benefit.${b.slug}`) ?? b.label;
  };

  const dishes = (data.dishes ?? []).map((d) => ({
    ...d,
    name_en: d.name,
    name: EN ? d.name : (text("dish", d.id, "name") ?? d.name),
    description: EN ? d.description : (text("dish", d.id, "description") ?? d.description),
    ingredients: EN ? d.ingredients : (text("dish", d.id, "ingredients") ?? d.ingredients),
    section_key: d.section_name,
    section_name: categoryName(d.section_id, d.section_name),
    subcategory_key: d.subcategory_name,
    subcategory_name: categoryName(d.subcategory_id, d.subcategory_name),
    category_name: categoryName(d.category_id, d.category_name),
    tags: (d.tags ?? []).map((tag) => ({
      ...tag,
      name: EN ? tag.name : (text("tag", tag.slug, "name") ?? tag.name),
    })),
    badges: (d.badges ?? []).map((b) => ({
      ...b,
      label: EN || !BADGE_KEYS[b.label] ? b.label : t(BADGE_KEYS[b.label]),
    })),
    benefits: (d.benefits ?? []).map((b) => ({
      ...b,
      label: benefitLabel(b),
      // "14 g" → "14 г"; the grams are formatted in lib/benefits.js.
      value: EN || !b.value ? b.value : b.value.replace(/ g$/, ` ${t("unit.g")}`),
    })),
    modifierGroups: (d.modifierGroups ?? []).map((g) => ({
      ...g,
      name_en: g.name,
      name: groupName(g.name),
      options: g.options.map((o) => ({ ...o, name_en: o.name, name: modName(o.name) })),
    })),
  }));

  const categories = (data.categories ?? []).map((c) => ({
    ...c,
    key: c.name,
    name: categoryName(c.id, c.name),
  }));

  const bundles = (data.bundles ?? []).map((b) => ({
    ...b,
    label_en: b.label,
    label: EN ? b.label : (text("price_tier", b.tierCode, "label") ?? b.label),
  }));

  // site_content translations are partial objects merged over the English row.
  // sectionIntros keeps English section names as keys (matched on category.key).
  let content = data.content;
  if (!EN && content) {
    content = { ...content };
    for (const key of Object.keys(content)) {
      const v = tr.get(`site_content|${key}|data`);
      if (v && typeof v === "object") content[key] = { ...content[key], ...deepStripEmoji(v) };
    }
    // The hero banner is a code default, not a DB field.
    if (content.hero && !tr.get("site_content|hero|data")?.banner) {
      content.hero = { ...content.hero, banner: t("hero.banner") };
    }
  }

  return { ...data, dishes, categories, bundles, content };
}

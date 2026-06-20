/*
  Text sanitisation for the public customer site.

  The Supabase source data (nomenclature names, product_categories,
  tags, menu_modifiers.option_emoji, site_content) intentionally keeps
  emojis — they are used by the admin panel and the Loyverse POS. The
  customer site at shishka.health shows clean, emoji-free text only.

  This is the single sanitisation chokepoint: useMenu.js runs the whole
  assembled menu payload through `deepStripEmoji` before returning it, so
  every string the site renders is cleaned regardless of its source.
*/

// Pictographic emoji + skin-tone modifiers + regional-indicator flags +
// variation selectors + keycap combiner + zero-width joiner. Plain
// punctuation/symbols used in copy (·, –, —, ฿) are NOT matched.
const EMOJI_RE =
  /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{20E3}\u{200D}]/gu;

// Strip emojis from a single string and tidy the whitespace they leave
// behind (e.g. "🍫 Chocolate" → "Chocolate"). Non-strings pass through.
export function stripEmoji(value) {
  if (typeof value !== "string") return value;
  return value.replace(EMOJI_RE, "").replace(/\s{2,}/g, " ").trim();
}

// Recursively strip emojis from every string inside a value
// (strings, arrays, plain objects). Numbers/booleans/null pass through.
export function deepStripEmoji(value) {
  if (typeof value === "string") return stripEmoji(value);
  if (Array.isArray(value)) return value.map(deepStripEmoji);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) out[key] = deepStripEmoji(val);
    return out;
  }
  return value;
}

/*
  Title Case for the public site's display copy.

  Proper headline-style title casing: capitalise the principal words, keep
  minor connector words (a, the, of, to, …) lowercase unless they are the
  first or last word. The casing is applied to the menu + content payload at
  the single chokepoint in useMenu.js (see `titleCaseMenu`).

  Intentionally preserved untouched:
    • URLs / emails / @handles / paths            → never mangled
    • ALL-CAPS acronyms & brand caps (DNA, SHiSHKA) → kept verbatim
    • numbers, prices, symbols (·, –, —, %, ฿)      → kept verbatim
    • the hero headline                            → keeps its own styling
*/
const MINOR_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "en", "for", "from", "if", "in",
  "into", "nor", "of", "off", "on", "onto", "or", "over", "per", "the", "to",
  "up", "via", "vs", "with", "yet",
]);

// Capitalise one whitespace-free token, preserving acronyms / stylised caps.
function capWord(word, force) {
  const letters = word.replace(/[^A-Za-z]/g, "");
  if (!letters) return word;                                   // pure symbol/number
  if (letters.length >= 2 && letters === letters.toUpperCase()) return word; // ACRONYM
  if (/[A-Z]/.test(word.slice(1))) return word;                // stylised (SHiSHKA, McX)
  const lower = word.toLowerCase();
  const bare = lower.replace(/[^a-z]/g, "");
  if (!force && MINOR_WORDS.has(bare)) return lower;            // minor word stays lower
  return lower
    .replace(/^([^a-z]*)([a-z])/, (_m, p, ch) => p + ch.toUpperCase()) // first letter
    .replace(/([-/])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase()); // hyphen/slash
}

// Title-case a single string. Non-strings and URL-ish strings pass through.
export function titleCase(value) {
  if (typeof value !== "string") return value;
  if (!value) return value;
  if (/(^https?:|:\/\/|@|^\/|^www\.)/i.test(value.trim())) return value; // url/handle/path
  const tokens = value.split(/(\s+)/); // keep the whitespace tokens for a faithful rejoin
  const wordIdx = tokens
    .map((t, i) => (/\S/.test(t) && /[A-Za-z]/.test(t) ? i : -1))
    .filter((i) => i >= 0);
  const first = wordIdx[0];
  const last = wordIdx[wordIdx.length - 1];
  return tokens
    .map((tok, i) => {
      if (!/[A-Za-z]/.test(tok)) return tok; // whitespace / punctuation / numbers
      return capWord(tok, i === first || i === last);
    })
    .join("");
}

// Title-case the display fields of one dish (leaves slugs/ids/urls/nutrition).
function titleCaseDish(d) {
  if (!d || typeof d !== "object") return d;
  return {
    ...d,
    name: titleCase(d.name),
    description: titleCase(d.description),
    ingredients: titleCase(d.ingredients),
    category_name: titleCase(d.category_name),
    section_name: titleCase(d.section_name),
    subcategory_name: titleCase(d.subcategory_name),
    tags: Array.isArray(d.tags)
      ? d.tags.map((t) => (t && typeof t === "object" ? { ...t, name: titleCase(t.name) } : t))
      : d.tags,
    badges: Array.isArray(d.badges)
      ? d.badges.map((b) => (b && typeof b === "object" ? { ...b, label: titleCase(b.label) } : b))
      : d.badges,
  };
}

// Title-case the editable marketing content. The hero is kept verbatim so its
// bespoke "from the SOIL to the SOUL." styling (and the NO SEED OIL banner)
// stay exactly as authored. URLs / hours time are left untouched by titleCase.
function titleCaseContent(c) {
  if (!c || typeof c !== "object") return c;
  const out = { ...c };
  if (c.rule) {
    out.rule = {
      ...c.rule,
      eyebrow: titleCase(c.rule.eyebrow),
      title: titleCase(c.rule.title),
      lead: titleCase(c.rule.lead),
      items: Array.isArray(c.rule.items) ? c.rule.items.map(titleCase) : c.rule.items,
    };
  }
  if (c.cta) {
    out.cta = {
      ...c.cta,
      eyebrow: titleCase(c.cta.eyebrow),
      title: titleCase(c.cta.title),
      sub: titleCase(c.cta.sub),
      hoursLabel: titleCase(c.cta.hoursLabel),
    };
  }
  if (c.bundles) {
    out.bundles = {
      ...c.bundles,
      title: titleCase(c.bundles.title),
      badge: titleCase(c.bundles.badge),
      sub: titleCase(c.bundles.sub),
    };
  }
  if (c.sectionIntros && typeof c.sectionIntros === "object") {
    out.sectionIntros = Object.fromEntries(
      Object.entries(c.sectionIntros).map(([k, v]) => [k, titleCase(v)])
    );
  }
  return out;
}

// Single chokepoint: title-case every display string in the assembled menu
// payload ({ dishes, categories, content, bundles }), used by useMenu.js for
// both the Supabase and the mock/offline data paths.
export function titleCaseMenu(data) {
  if (!data || typeof data !== "object") return data;
  return {
    ...data,
    dishes: Array.isArray(data.dishes) ? data.dishes.map(titleCaseDish) : data.dishes,
    categories: Array.isArray(data.categories)
      ? data.categories.map((c) => (c ? { ...c, name: titleCase(c.name) } : c))
      : data.categories,
    bundles: Array.isArray(data.bundles)
      ? data.bundles.map((b) => (b ? { ...b, label: titleCase(b.label) } : b))
      : data.bundles,
    content: titleCaseContent(data.content),
  };
}

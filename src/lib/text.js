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

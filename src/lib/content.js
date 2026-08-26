/*
  Editable marketing content for the public site.

  Source of truth at runtime: the Supabase table `site_content`
  (one row per key, content in the `data` jsonb). Edit it from the
  Supabase dashboard and the site updates live.

  The values below are the defaults used as a fallback when a row or a
  field is missing, and when running without Supabase (mock mode).
  Keep them in sync with the seeded rows.
*/
export const DEFAULT_CONTENT = {
  hero: {
    eyebrow: "SHiSHKA · Healthy Kitchen",
    // The headline. Kept verbatim (not title-cased).
    banner: "NO SEED OIL",
    // Optional second line under the banner; ALL-CAPS words auto-accent.
    title: "",
    sub: "fresh, unprocessed, real food, made daily.",
  },
  rule: {
    eyebrow: "the rule",
    lead: "eat clean feel good",
    // A string renders as "no <thing>"; an object with deny:false is a positive
    // claim, rendered without the "no". The list is red throughout.
    items: [
      "seed oils",
      { label: "Gluten FREE options", deny: false, icon: "industrial gluten" },
      "fake food",
      "fried food",
      "preservatives",
      "monosodium glutamate (MSG)",
    ],
    afterCategory: 2, // render the block after the Nth category (1-based)
  },
  // Build Your Own. Only the framing lines live here — the four step names and
  // their counts are read from src/data/byoCatalog.js, the same file the wall
  // board reads, so the TV and the site cannot disagree about what is on offer.
  // Set enabled:false to pull the section without a deploy.
  byo: {
    enabled: true,
    eyebrow: "build your own",
    lead: "four steps, one price",
    sub: "Salad, bowl, wrap or all-day breakfast — built in front of you at the counter.",
    // Kept out of the headline because the price is the fact most likely to
    // change, and a stale price on a menu is the one error guests remember.
    price: 219,
    priceNote: "any style, 11 toppings included",
  },
  cta: {
    eyebrow: "visit us in phuket",
    title: "come hungry.",
    sub: "Real food, made fresh every day — drop by our Phuket kitchen.",
    instagramUrl: "https://www.instagram.com/shishka_healthy_kitchen",
    whatsappUrl: "", // button hidden while empty
    hoursLabel: "open daily",
    hoursTime: "9:30 – 18:30",
  },
  // Short intro paragraph rendered under a section title. Keyed by section
  // (umbrella) name as it appears in the menu. Omit a key → no intro.
  sectionIntros: {
    "Potato Tacos":
      "Our healthy take on tacos — a gluten-free potato dough instead of a tortilla, piled high with fresh veggies and bold flavors. Protein options like shish tawook and shrimp coming soon.",
  },
};

// Merge fetched rows ([{ key, data }]) over the defaults, per field.
export function mergeContent(rows) {
  const out = {
    hero: { ...DEFAULT_CONTENT.hero },
    rule: { ...DEFAULT_CONTENT.rule },
    byo: { ...DEFAULT_CONTENT.byo },
    cta: { ...DEFAULT_CONTENT.cta },
    sectionIntros: { ...DEFAULT_CONTENT.sectionIntros },
  };
  for (const row of rows ?? []) {
    if (out[row?.key] && row.data && typeof row.data === "object") {
      out[row.key] = { ...out[row.key], ...row.data };
    }
  }
  return out;
}

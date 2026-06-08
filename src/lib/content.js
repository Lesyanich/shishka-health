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
    // ALL-CAPS words in the title are auto-accented in honey.
    title: "from the SOIL to the SOUL.",
    sub: "fresh, unprocessed, scientifically balanced — real food, made daily.",
  },
  rule: {
    eyebrow: "the rule",
    title: "no compromises.",
    lead: "we eliminate the noise that harms the human machine, and replace it with powerful nutrition that resonates with your DNA.",
    items: ["seed oils", "industrial gluten", "fake food", "fried food", "preservatives", "toxic"],
    afterCategory: 1, // render the block after the Nth category (1-based)
  },
  cta: {
    eyebrow: "visit us in phuket",
    title: "come hungry.",
    sub: "Real food, made fresh every day — drop by our Phuket kitchen.",
    instagramUrl: "https://www.instagram.com/shishka_phuket",
    whatsappUrl: "", // button hidden while empty
    hoursLabel: "open daily",
    hoursTime: "9:00 – 18:00",
  },
  // Short intro paragraph rendered under a section title. Keyed by section
  // (umbrella) name as it appears in the menu. Omit a key → no intro.
  sectionIntros: {
    Manakish:
      "Manakish is a traditional Middle-Eastern flatbread — the region's mini pizza. We reimagined it gluten-free, on our own potato-based dough.",
  },
  // Promo header for the build-your-own bundle cards (rendered after the
  // Manakish dishes). `badge` is optional; omit to hide it.
  bundles: {
    title: "Buy more, save more",
    badge: "up to −20%",
    sub: "Build your own set — bigger sets, bigger savings, with free sauces on us.",
  },
};

// Merge fetched rows ([{ key, data }]) over the defaults, per field.
export function mergeContent(rows) {
  const out = {
    hero: { ...DEFAULT_CONTENT.hero },
    rule: { ...DEFAULT_CONTENT.rule },
    cta: { ...DEFAULT_CONTENT.cta },
    sectionIntros: { ...DEFAULT_CONTENT.sectionIntros },
    bundles: { ...DEFAULT_CONTENT.bundles },
  };
  for (const row of rows ?? []) {
    if (out[row?.key] && row.data && typeof row.data === "object") {
      out[row.key] = { ...out[row.key], ...row.data };
    }
  }
  return out;
}

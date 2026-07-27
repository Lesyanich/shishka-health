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
    // Big claim shown above the headline. Kept verbatim (not title-cased).
    banner: "NO SEED OIL",
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
  // Promo header for the build-your-own bundle cards (rendered after the
  // Potato Tacos dishes). `badge` is optional; omit to hide it.
  // Single tier since 2026-07-27 (CEO): sets of 4 only. Keep these in step with
  // the live `bundles` row in site_content — if the fetch fails we fall back to
  // this, and a stale discount here would re-advertise an offer we don't have.
  bundles: {
    title: "Build your own set",
    badge: "up to −10%",
    sub: "Pick any 4 potato tacos — cheaper than à la carte, with a free sauce on us.",
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

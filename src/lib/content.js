/*
  Editable marketing content for the public site.

  Source of truth at runtime: the Supabase table `site_content`
  (one row per key, content in the `data` jsonb). Edit it from the
  Supabase dashboard and the site updates live.

  The values below are the defaults used as a fallback when a row or a
  field is missing, and when running without Supabase (mock mode). They are
  ALSO what the hero paints in the moment before the fetch returns, so when
  they drift from the DB the guest watches the headline change under them —
  which is exactly what happened after the copy was rewritten in the DB on
  2026-09-21 and these were left behind ("NO SEED OIL" → "CLEAN FOOD").
  Keep them in sync with the seeded rows. `lastContent` below removes most of
  the risk for returning guests, but the first visit still renders these.
*/
export const DEFAULT_CONTENT = {
  hero: {
    eyebrow: "SHiSHKA · Healthy Kitchen",
    // The headline. Kept verbatim (not title-cased).
    banner: "CLEAN FOOD",
    // Optional second line under the banner; ALL-CAPS words auto-accent.
    title: "Honest. Delicious. No junk",
    sub: "No seed oils · no MSG · nothing ultra-processed.\nOnly fresh ingredients",
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
      "preservatives",
      "monosodium glutamate (MSG)",
    ],
    afterCategory: 999, // render the block after the Nth category (1-based)
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

/*
  Last content the site actually received, per language, kept in localStorage.

  The hero has to paint before the network answers. Painting DEFAULT_CONTENT
  means painting whatever the code shipped with; painting the copy this browser
  saw last time means painting the live copy in all but the first visit and the
  visit right after an edit. Per-viewer, disposable, and safe to lose: every
  accessor is wrapped, and a miss simply falls back to the defaults.
*/
const CONTENT_CACHE_KEY = "shk-content";

export function readCachedContent(lang) {
  try {
    const raw = localStorage.getItem(`${CONTENT_CACHE_KEY}:${lang}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedContent(lang, content) {
  try {
    if (content && typeof content === "object") {
      localStorage.setItem(`${CONTENT_CACHE_KEY}:${lang}`, JSON.stringify(content));
    }
  } catch {
    /* private mode / quota — the site just falls back to DEFAULT_CONTENT */
  }
}

// Merge fetched rows ([{ key, data }]) over the defaults, per field.
export function mergeContent(rows) {
  const out = {
    hero: { ...DEFAULT_CONTENT.hero },
    rule: { ...DEFAULT_CONTENT.rule },
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

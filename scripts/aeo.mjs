/*
  AEO (Answer Engine Optimization) build helper.

  Injects a live `Menu` JSON-LD block into index.html at build time, generated
  from the same public Supabase read the site already uses at runtime
  (menu_public + nomenclature_tags). This keeps the machine-readable menu — with
  every dish's price, macros and diet flags — in sync with the real menu on
  every deploy, so AI answer engines (ChatGPT, Perplexity, Google AI Overviews,
  Claude) can read and cite accurate dishes and prices.

  Fail-safe by design: if the fetch fails (network, RLS, schema drift) the build
  still succeeds — the static Restaurant + FAQ structured data in index.html
  always ships; only the item-level menu block is skipped.

  Run standalone to preview the generated block without a full build:
    npm run aeo   ->   writes _aeo/menu.jsonld
*/

import { pathToFileURL } from "node:url";

const SITE = "https://shishka.health";

// Same public, read-only anon key the site ships in its bundle (see
// src/lib/supabase.js). Env vars win when present (Vercel build).
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://qcqgtcsjoacuktcewpvo.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWd0Y3Nqb2FjdWt0Y2V3cHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwMjUsImV4cCI6MjA4ODE5MjAyNX0.XI08SHEUG6_DQHyrZIUOtgCtEPW8E7tRTtH2Sc0dqzA";

// Menu diet tags → schema.org RestrictedDiet values (only the ones with a
// canonical schema.org URL; others are conveyed via the FAQ + llms.txt).
const DIET_SCHEMA = {
  "gluten-free": "https://schema.org/GlutenFreeDiet",
  vegan: "https://schema.org/VeganDiet",
  vegetarian: "https://schema.org/VegetarianDiet",
  halal: "https://schema.org/HalalDiet",
};

// The customer site renders emoji-free text; source rows keep emojis for the
// admin panel + POS. Strip them here so structured data stays clean.
function clean(s) {
  return (s || "")
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${path.split("?")[0]} -> ${res.status}`);
  return res.json();
}

export async function fetchMenu() {
  const dishes = await sb(
    "menu_public?select=id,name,customer_short_name,customer_description," +
      "price,calories,protein,carbs,fat,portion_size,portion_unit," +
      "section_name,section_sort_order,category_name,category_sort_order,display_order,is_web_visible" +
      "&is_web_visible=eq.true" +
      "&order=section_sort_order,category_sort_order,display_order",
  );

  const tagMap = new Map();
  try {
    const rows = await sb("nomenclature_tags?select=nomenclature_id,tags(slug,tag_group)");
    for (const row of rows) {
      const t = row.tags;
      if (!t) continue;
      if (!tagMap.has(row.nomenclature_id)) tagMap.set(row.nomenclature_id, []);
      tagMap.get(row.nomenclature_id).push(t);
    }
  } catch {
    // diets are optional — carry on with prices + nutrition only
  }

  return { dishes, tagMap };
}

export function buildMenuJsonLd({ dishes, tagMap }) {
  const sections = new Map();
  for (const d of dishes) {
    const sectionName = clean(d.section_name) || "Menu";
    if (!sections.has(sectionName)) sections.set(sectionName, []);

    const item = { "@type": "MenuItem", name: clean(d.customer_short_name || d.name) };

    const description = clean(d.customer_description);
    if (description) item.description = description;

    if (d.price != null) {
      item.offers = { "@type": "Offer", price: String(d.price), priceCurrency: "THB" };
    }

    const nutrition = {};
    if (d.calories != null) nutrition.calories = `${d.calories} calories`;
    if (d.protein != null) nutrition.proteinContent = `${d.protein} g`;
    if (d.carbs != null) nutrition.carbohydrateContent = `${d.carbs} g`;
    if (d.fat != null) nutrition.fatContent = `${d.fat} g`;
    if (d.portion_size != null && d.portion_unit) {
      nutrition.servingSize = `${d.portion_size} ${d.portion_unit}`;
    }
    if (Object.keys(nutrition).length) {
      item.nutrition = { "@type": "NutritionInformation", ...nutrition };
    }

    const diets = (tagMap.get(d.id) || [])
      .filter((t) => t.tag_group === "dietary")
      .map((t) => DIET_SCHEMA[t.slug])
      .filter(Boolean);
    if (diets.length) item.suitableForDiet = diets.length === 1 ? diets[0] : diets;

    sections.get(sectionName).push(item);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${SITE}/#menu`,
    name: "SHiSHKA Healthy Kitchen Menu",
    inLanguage: "en",
    hasMenuSection: [...sections].map(([name, hasMenuItem]) => ({
      "@type": "MenuSection",
      name,
      hasMenuItem,
    })),
  };
}

// Vite plugin: inject the Menu JSON-LD at build time.
export function aeoPlugin() {
  let cache;
  async function menu() {
    if (cache !== undefined) return cache;
    try {
      cache = buildMenuJsonLd(await fetchMenu());
    } catch (e) {
      console.warn(`[aeo] menu schema skipped: ${e.message}`);
      cache = null;
    }
    return cache;
  }
  return {
    name: "shishka-aeo",
    apply: "build",
    async transformIndexHtml(html) {
      const data = await menu();
      if (!data) return html;
      const block = `    <!-- Structured data: Menu (generated at build from live menu_public) -->\n    <script type="application/ld+json">\n${JSON.stringify(
        data,
        null,
        2,
      )}\n    </script>\n  `;
      return html.replace("</head>", `${block}</head>`);
    },
  };
}

// Standalone preview: `npm run aeo`
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const fs = await import("node:fs");
  try {
    const data = buildMenuJsonLd(await fetchMenu());
    fs.mkdirSync("_aeo", { recursive: true });
    fs.writeFileSync("_aeo/menu.jsonld", JSON.stringify(data, null, 2));
    const items = data.hasMenuSection.reduce((n, s) => n + s.hasMenuItem.length, 0);
    console.log(
      `[aeo] wrote _aeo/menu.jsonld — ${data.hasMenuSection.length} sections, ${items} items`,
    );
  } catch (e) {
    console.error(`[aeo] failed: ${e.message}`);
    process.exit(1);
  }
}

/*
  AEO/GEO prerender — WP-4 (MC 47b6ef32, epic 9ced1036).

  WHY THIS EXISTS
  shishka.health is a Vite CSR SPA: the shipped index.html is ~677 bytes whose
  body is exactly `<div id="root"></div>`. Every AI crawler reaches us (GPTBot,
  ClaudeBot, PerplexityBot, OAI-SearchBot and Google-Extended all get HTTP 200,
  verified on prod 2026-07-27) and learns nothing, because none of them run our
  JavaScript. So the menu cannot be quoted, and we cannot be recommended.

  WHAT IT DOES
  Runs AFTER `vite build` and writes real, text-bearing HTML into dist/ for a
  handful of search-intent pages, plus robots.txt and sitemap.xml. Vercel serves
  static files BEFORE the `/(.*) -> /index.html` rewrite in vercel.json, so these
  files win over the SPA catch-all without touching the rewrite.

  WHAT IT DELIBERATELY DOES NOT DO
  - No framework migration. The app stays a CSR SPA (MINIMAL-CORRECT-CHANGE).
  - No cloaking. These pages show visitors exactly what they show crawlers.
  - No per-dish dietary or allergen assertions. Allergen data is not trustworthy
    yet — 25 of 60 sellable dishes have none from either source, and the two
    sources disagree (MC 572c53b1 is the gate). Prose claims signed off by the
    CEO are fine; machine-readable per-dish diet claims are not, because answer
    engines repeat them verbatim and durably. When 572c53b1 closes, add
    suitableForDiet per MenuItem here — never on the Restaurant entity.

  DATA SOURCE
  menu_public via the public anon key, same view the SPA reads. Only
  stock_state = 'in_stock' is published: coming_soon is not orderable, and the
  menu we hand to an answer engine has to be the menu a guest can actually buy
  (CEO decision D1, MC cfd30575).
*/

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deepStripEmoji, titleCase } from "../src/lib/text.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SITE = "https://shishka.health";

/* ---------------------------------------------------------------- identity --

   Canonical NAP. Sourced from 00_Legal, NOT from a directory listing: the
   Wongnai address ("46 3 ...") points at a different building, and Google shows
   a Plus Code for our pin precisely because it has no street address on file.
   Authority = the Tabian Baan (building 8392-013844-9, Rawai Subdistrict
   Municipality) plus the Tops Daily Soi Naya 2 lease LOI (unit R01).

   L2 ONLY. L1 is the prep kitchen in Saiyuan and must never be published as a
   customer-facing address. Confirmed by the CEO 2026-07-29 (MC cfd30575).

   No `geo` block: we have no verified lat/long, and inventing coordinates for a
   machine-readable local-business record is worse than omitting them.
*/
const NAP = {
  name: "SHiSHKA Healthy Kitchen",
  street: "31/33 Moo 1, Tops Daily Soi Naya 2, Unit R01",
  locality: "Rawai",
  region: "Phuket",
  postal: "83130",
  country: "TH",
  phone: "+66956969059",
  phoneDisplay: "095 696 9059",
  instagram: "https://www.instagram.com/shishka_healthy_kitchen",
  hoursOpen: "09:30",
  hoursClose: "18:30",
  hoursHuman: "every day, 9:30 – 18:30",
};

/* ------------------------------------------------------------------ claims --

   Every claim below is CEO-signed (MC cfd30575, D3 + D3b) and must stay
   literally true, because an answer engine will repeat it verbatim for a long
   time and we cannot retract it once quoted.

   The gluten wording is the load-bearing one. We bake real wheat sourdough, so
   "gluten-free restaurant" would be false. "Everything except the sourdough" is
   both true and a stronger citation target than a vague "options available",
   because it names its own exception.
*/
const CLAIM_NO_SEED_OILS =
  "We cook with no seed oils at all — not in the kitchen, not in our sauces, and nothing is deep-fried.";
const CLAIM_GLUTEN =
  "Everything on our menu is gluten-free except our sourdough bread.";
const CLAIM_CELIAC =
  "No. We bake wheat sourdough in the same kitchen, so we cannot promise a celiac-safe environment. Every other dish is made without gluten-containing ingredients.";

/* --------------------------------------------------------------- utilities */

const escHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const baht = (n) => `฿${Number(n).toLocaleString("en-US")}`;

/* ------------------------------------------------------------------- fetch */

async function fetchMenu() {
  const url = process.env.VITE_SUPABASE_URL || "https://qcqgtcsjoacuktcewpvo.supabase.co";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWd0Y3Nqb2FjdWt0Y2V3cHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwMjUsImV4cCI6MjA4ODE5MjAyNX0.XI08SHEUG6_DQHyrZIUOtgCtEPW8E7tRTtH2Sc0dqzA";

  /*
    Plain PostgREST over fetch, deliberately NOT @supabase/supabase-js. Creating
    a supabase client also constructs a RealtimeClient, which throws on Node < 22
    for want of a native WebSocket — so the library builds fine on a Node 22 dev
    machine and dies in CI on Node 20. A build script needs one authenticated GET
    and no realtime, so the dependency buys nothing and costs a Node-version
    coupling. The SPA keeps using the client; it runs in a browser.
  */
  const select = [
    "name", "customer_short_name", "customer_description", "price", "stock_state",
    "calories", "protein", "image_url", "customer_photo_url",
    "section_name", "section_sort_order", "category_name", "display_order",
  ].join(",");

  const endpoint =
    `${url}/rest/v1/menu_public?select=${select}` +
    "&order=section_sort_order.asc.nullslast,display_order.asc.nullslast";

  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    throw new Error(`menu_public fetch failed: HTTP ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  // Publish only what a guest can actually order today (CEO decision D1).
  const sellable = (data ?? []).filter((d) => (d.stock_state ?? "in_stock") === "in_stock");

  // Same sanitisation chokepoint the SPA uses, so the static pages and the app
  // never disagree on how a dish is spelled: emoji stripped, display copy in
  // Title Case (see src/lib/text.js).
  return deepStripEmoji(sellable).map((d) => ({
    name: titleCase(d.customer_short_name || d.name),
    description: titleCase(d.customer_description),
    price: d.price != null ? Number(d.price) : null,
    calories: d.calories != null ? Number(d.calories) : null,
    protein: d.protein != null ? Number(d.protein) : null,
    image: d.image_url || d.customer_photo_url || null,
    section: titleCase(d.section_name || d.category_name || "Menu"),
  }));
}

function groupBySection(dishes) {
  const out = [];
  for (const d of dishes) {
    let g = out.find((x) => x.section === d.section);
    if (!g) out.push((g = { section: d.section, dishes: [] }));
    g.dishes.push(d);
  }
  return out;
}

/* -------------------------------------------------------------- structured */

function restaurantLd(extra = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: NAP.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: NAP.street,
      addressLocality: NAP.locality,
      addressRegion: NAP.region,
      postalCode: NAP.postal,
      addressCountry: NAP.country,
    },
    telephone: NAP.phone,
    url: SITE,
    sameAs: [NAP.instagram],
    servesCuisine: ["Middle Eastern", "Healthy", "Mediterranean"],
    priceRange: "฿฿",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday", "Tuesday", "Wednesday", "Thursday",
          "Friday", "Saturday", "Sunday",
        ],
        opens: NAP.hoursOpen,
        closes: NAP.hoursClose,
      },
    ],
    ...extra,
  };
}

/*
  The visible FAQ and the FAQPage JSON-LD are rendered from ONE array, so the
  text is byte-identical in both. Structured data that says something the page
  does not is what got PR #33 closed as a spam risk — do not split these.
*/
function faqLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function menuLd(groups) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${NAP.name} Menu`,
    url: `${SITE}/menu`,
    hasMenuSection: groups.map((g) => ({
      "@type": "MenuSection",
      name: g.section,
      hasMenuItem: g.dishes.map((d) => ({
        "@type": "MenuItem",
        name: d.name,
        ...(d.description ? { description: d.description } : {}),
        ...(d.price != null
          ? { offers: { "@type": "Offer", price: d.price, priceCurrency: "THB" } }
          : {}),
        // No suitableForDiet until MC 572c53b1 closes — see header note.
        ...(d.calories != null
          ? {
              nutrition: {
                "@type": "NutritionInformation",
                calories: `${d.calories} cal`,
                ...(d.protein != null ? { proteinContent: `${d.protein} g` } : {}),
              },
            }
          : {}),
      })),
    })),
  };
}

/* ----------------------------------------------------------------- styling */

/*
  Self-contained brand CSS. These pages cannot import the app stylesheet: Vite
  emits it under a content-hashed filename that changes every build, and a
  static page pointing at a stale hash would render unstyled.

  Values are the brand constants from shishka-health/design-system/MASTER.md
  (royal-green canvas, cream text, gold prices) rather than invented ones. If a
  brand token changes, it changes in MASTER.md first, then here.
*/
const CSS = `
:root{--bg:#1E3903;--surface:#3C481A;--cream:#FBF8F0;--body:rgba(251,248,240,.86);
--muted:rgba(251,248,240,.62);--gold:#F0CE83;--mint:#CCDAAE;--red:#B62A23;
--line:rgba(255,255,255,.14)}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--body);
font-family:"SF Pro Text","Albert Sans",system-ui,-apple-system,sans-serif;
line-height:1.65;font-size:16px;-webkit-font-smoothing:antialiased}
.wrap{max-width:840px;margin:0 auto;padding:32px 20px 64px}
a{color:var(--gold)}
header.top{display:flex;align-items:center;gap:12px;margin-bottom:32px}
header.top img{height:40px;width:auto}
h1{font-size:36px;line-height:1.15;color:var(--cream);margin:0 0 16px;letter-spacing:-.01em}
h2{font-size:24px;color:var(--cream);margin:40px 0 12px;letter-spacing:-.01em}
h3{font-size:18px;color:var(--cream);margin:28px 0 8px}
.lede{font-size:18px;color:var(--cream);margin:0 0 24px}
.claim{border-left:3px solid var(--gold);padding:8px 0 8px 16px;margin:24px 0;color:var(--cream)}
.meta{color:var(--muted);font-size:14px}
ul.dishes{list-style:none;padding:0;margin:0}
ul.dishes li{display:flex;justify-content:space-between;gap:16px;align-items:baseline;
padding:10px 0;border-bottom:1px solid var(--line)}
.dish-name{color:var(--cream)}
.dish-desc{display:block;color:var(--muted);font-size:14px}
.price{color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap}
.kcal{color:var(--mint);font-size:13px;font-variant-numeric:tabular-nums}
.cta{display:inline-block;background:var(--red);color:#fff;text-decoration:none;
padding:12px 22px;border-radius:999px;margin:8px 12px 8px 0}
.faq dt{color:var(--cream);margin-top:20px;font-weight:600}
.faq dd{margin:6px 0 0}
footer{margin-top:56px;padding-top:24px;border-top:1px solid var(--line);
color:var(--muted);font-size:14px}
@media(max-width:600px){h1{font-size:28px}.wrap{padding:24px 16px 48px}}
`.trim();

/* ---------------------------------------------------------------- template */

function page({ slug, title, description, h1, answer, body, faqs = [], extraLd = [] }) {
  const canonical = `${SITE}/${slug}`.replace(/\/$/, "") || SITE;
  const lds = [restaurantLd(), ...extraLd];
  if (faqs.length) lds.push(faqLd(faqs));

  const faqHtml = faqs.length
    ? `<h2>Common questions</h2>
    <dl class="faq">
${faqs.map((f) => `      <dt>${escHtml(f.q)}</dt>\n      <dd>${escHtml(f.a)}</dd>`).join("\n")}
    </dl>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#1E3903">
<link rel="icon" type="image/png" href="/assets/logo-mark-color.png">
<meta property="og:type" content="website">
<meta property="og:title" content="${escHtml(title)}">
<meta property="og:description" content="${escHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/logo-full-color.png">
<meta name="twitter:card" content="summary_large_image">
<style>${CSS}</style>
${lds.map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n")}
</head>
<body>
<div class="wrap">
<header class="top">
  <img src="/assets/logo-full-white.png" alt="SHiSHKA Healthy Kitchen">
</header>
<h1>${escHtml(h1)}</h1>
<p class="lede">${escHtml(answer)}</p>
${body}
${faqHtml}
<h2>Visit us</h2>
<p>${escHtml(NAP.street)}, ${escHtml(NAP.locality)}, ${escHtml(NAP.region)} ${escHtml(NAP.postal)}, Thailand<br>
Open ${escHtml(NAP.hoursHuman)} · <a href="tel:${NAP.phone}">${escHtml(NAP.phoneDisplay)}</a></p>
<p>
  <a class="cta" href="/">See the full interactive menu</a>
  <a class="cta" href="${NAP.instagram}" rel="noopener">Instagram</a>
</p>
<footer>
  <p>${escHtml(NAP.name)} — Rawai, Phuket. From the SOIL to the SOUL.</p>
  <p class="meta">Prices in Thai baht and may change. Menu updated automatically from our kitchen system.</p>
</footer>
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------- pages */

function dishList(dishes, { withDesc = true } = {}) {
  return `<ul class="dishes">
${dishes
  .map(
    (d) => `  <li><span class="dish-name">${escHtml(d.name)}${
      withDesc && d.description ? `<span class="dish-desc">${escHtml(d.description)}</span>` : ""
    }${d.calories != null ? `<span class="kcal">${d.calories} kcal${d.protein != null ? ` · ${d.protein}g protein` : ""}</span>` : ""}</span>${
      d.price != null ? `<span class="price">${escHtml(baht(d.price))}</span>` : ""
    }</li>`
  )
  .join("\n")}
</ul>`;
}

function buildPages(dishes) {
  const groups = groupBySection(dishes);
  const count = dishes.length;
  const cheapest = dishes.filter((d) => d.price != null).sort((a, b) => a.price - b.price)[0];
  const priceLine = cheapest ? ` Dishes start at ${baht(cheapest.price)}.` : "";

  const menuBody = groups
    .map((g) => `<h2>${escHtml(g.section)}</h2>\n${dishList(g.dishes)}`)
    .join("\n");

  // Derived, not hand-written, so the protein page cannot quote a dish we have
  // stopped selling or a figure the kitchen has since revised.
  const topProtein = dishes
    .filter((d) => d.protein != null && d.protein > 0)
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 10);

  const sharedFaq = [
    { q: "Where is SHiSHKA Healthy Kitchen?", a: `Inside Tops Daily on Soi Naya 2 in Rawai, Phuket — ${NAP.street}, ${NAP.locality}, ${NAP.region} ${NAP.postal}.` },
    { q: "What are your opening hours?", a: `We are open ${NAP.hoursHuman}.` },
    { q: "Do you use seed oils?", a: CLAIM_NO_SEED_OILS },
    { q: "Is your kitchen celiac-safe?", a: CLAIM_CELIAC },
    { q: "How do I order?", a: `Come to the counter, or call us on ${NAP.phoneDisplay}. The full menu with photos is on shishka.health.` },
  ];

  return [
    {
      slug: "menu",
      title: `Menu — ${NAP.name}, Rawai Phuket`,
      description: `The full ${NAP.name} menu: ${count} dishes and drinks with prices, made fresh daily in Rawai, Phuket. No seed oils, no MSG, nothing deep-fried.`,
      h1: "Our Menu",
      answer: `${NAP.name} in Rawai, Phuket serves ${count} freshly made dishes and drinks — potato tacos, salads, fresh spring rolls, smoothies, juices, matcha and coffee.${priceLine} We cook with no seed oils, no MSG and no deep-frying.`,
      body: menuBody,
      faqs: sharedFaq,
      extraLd: [menuLd(groups)],
    },
    {
      slug: "gluten-free-restaurant-phuket",
      title: `Gluten-Free Options in Phuket — ${NAP.name}, Rawai`,
      description: `${CLAIM_GLUTEN} Potato tacos on potato-and-rice dough, fresh spring rolls on rice paper, salads and smoothies — in Rawai, Phuket.`,
      h1: "Gluten-Free Options in Rawai, Phuket",
      answer: `${CLAIM_GLUTEN} Our potato tacos use a potato-and-rice dough instead of wheat flour, our fresh spring rolls are wrapped in rice paper, and the salads, smoothies, juices and coffee contain no gluten ingredients.`,
      body: `<p>The one exception is deliberate, and we would rather name it than hide it: we bake real wheat sourdough on site. That makes us a kitchen with gluten in it, not a dedicated gluten-free facility.</p>
<h2>What to order</h2>
${dishList(dishes.filter((d) => /taco|spring roll|salad|smoothie|juice/i.test(d.section) || /taco|roll/i.test(d.name)).slice(0, 20))}
<p class="meta">Ask us at the counter if you need anything checked — we know what goes into every dish.</p>`,
      faqs: [
        { q: "Is your kitchen celiac-safe?", a: CLAIM_CELIAC },
        { q: "Are the potato tacos gluten-free?", a: "Yes. They are built on our own potato-and-rice dough, with no wheat flour at any stage." },
        { q: "What contains gluten on your menu?", a: "Only our sourdough bread, which is made with wheat flour. Everything else is made without gluten-containing ingredients." },
        ...sharedFaq.slice(0, 3),
      ],
    },
    {
      slug: "no-seed-oil-restaurant-phuket",
      title: `Seed-Oil-Free Restaurant in Phuket — ${NAP.name}`,
      description: `${CLAIM_NO_SEED_OILS} Real food cooked without sunflower, canola, soybean or palm oil, in Rawai, Phuket.`,
      h1: "A Kitchen With No Seed Oils, in Rawai",
      answer: `${CLAIM_NO_SEED_OILS} That covers sunflower, canola, rapeseed, soybean, corn and palm oil — in the cooking, in the dressings and in the sauces we make ourselves.`,
      body: `<p>Most kitchens in Phuket cook in seed oil because it is the cheapest fat on the shelf. We do not, and we do not deep-fry anything. We also use no MSG and no preservatives.</p>
<h2>What we cook instead</h2>
<p>Olive oil, butter and the fat that is already in the food. Our beef and lamb are grass-fed.</p>
<h2>On the menu</h2>
${dishList(dishes.slice(0, 24), { withDesc: false })}`,
      faqs: [
        { q: "Do you use seed oils?", a: CLAIM_NO_SEED_OILS },
        { q: "Do you deep-fry anything?", a: "No. Nothing on our menu is deep-fried." },
        { q: "Is your beef grass-fed?", a: "Yes — our beef and lamb are grass-fed." },
        ...sharedFaq.slice(0, 2),
      ],
    },
    {
      slug: "healthy-food-rawai",
      title: `Healthy Food in Rawai, Phuket — ${NAP.name}`,
      description: `Fresh, unprocessed food made daily in Rawai, Phuket: salads, potato tacos, fresh spring rolls, smoothies and specialty coffee. No seed oils, no MSG.`,
      h1: "Healthy Food in Rawai, Phuket",
      answer: `${NAP.name} is a healthy kitchen in Rawai, Phuket, inside Tops Daily on Soi Naya 2. We make ${count} dishes and drinks fresh every day — salads, potato tacos, fresh spring rolls, smoothies, juices and coffee — with no seed oils, no MSG and nothing deep-fried.`,
      body: `<h2>What we serve</h2>
${menuBody}`,
      faqs: sharedFaq,
      extraLd: [menuLd(groups)],
    },
    {
      slug: "clean-eating-phuket",
      title: `Clean Eating in Phuket — ${NAP.name}, Rawai`,
      description: `Real, unprocessed food in Phuket: no seed oils, no MSG, no preservatives, nothing deep-fried. Macros on every dish. Rawai, open daily.`,
      h1: "Clean Eating in Phuket",
      answer: `If clean eating means real ingredients and nothing hidden, that is the whole point of ${NAP.name} in Rawai, Phuket. No seed oils, no MSG, no preservatives, nothing deep-fried — and calories and protein printed on every dish so you can see what you are eating.`,
      body: `<h2>Our rule</h2>
<p>No seed oils. No fake food. No fried food. No preservatives. No MSG. Gluten-free options.</p>
<p class="claim">${escHtml(CLAIM_NO_SEED_OILS)}</p>
<h2>Every dish comes with its numbers</h2>
${dishList(dishes.filter((d) => d.calories != null).slice(0, 24))}`,
      faqs: sharedFaq,
    },
    {
      /*
        Our differentiated position, and the one query in this set where the
        competition is thin: clean eating in Phuket is overwhelmingly plant-based,
        so "clean AND high protein" is close to unclaimed.

        This page is ours to win, so it is written to sell. The numbers do the
        selling — they come straight from menu_public and every one is checkable
        at the counter, which is what makes confident copy hold up instead of
        reading as noise.
      */
      slug: "high-protein-healthy-food-phuket",
      title: `High-Protein Healthy Food in Phuket — ${NAP.name}`,
      description: `Clean food with real protein in Phuket: grass-fed beef and lamb, chicken, shrimp and tuna, up to ${topProtein[0] ? Math.round(topProtein[0].protein) : 39}g of protein a dish. No seed oils, no MSG, nothing deep-fried. Rawai, open daily.`,
      h1: "High-Protein Healthy Food in Phuket",
      answer: `Eating clean in Phuket usually means giving up protein. At ${NAP.name} in Rawai it does not: we cook grass-fed beef and lamb, chicken, shrimp and tuna, with up to ${topProtein[0] ? Math.round(topProtein[0].protein) : 39}g of protein in a single dish — and no seed oils, no MSG and nothing deep-fried anywhere on the menu.`,
      body: `<h2>Protein you can count</h2>
<p>Calories and protein are printed on every single dish we sell, because a number you can check is worth more than a word like "healthy". Here is what the counter actually holds:</p>
${dishList(topProtein)}

<h2>The standard behind the numbers</h2>
<p>Grass-fed beef and lamb. Chicken and shrimp cooked sous-vide so they stay tender without a drop of frying oil. Fresh spring rolls rolled the same morning. Bread on a real sourdough starter.</p>
<p class="claim">${escHtml(CLAIM_NO_SEED_OILS)}</p>
<p>And nothing we refuse to use: no MSG, no preservatives, no fake food, nothing deep-fried. That rule is the whole reason this kitchen exists.</p>

<h2>Built for how you actually eat</h2>
<p>Training in the morning and want protein without a plate of oil. Working through lunch and want something real in ten minutes. Eating clean for a month and tired of choosing between a salad and a smoothie bowl. All of that is on one counter in Rawai, ${escHtml(NAP.hoursHuman)}.</p>`,
      faqs: [
        {
          q: "Where can I get high-protein healthy food in Phuket?",
          a: `${NAP.name} in Rawai, inside Tops Daily on Soi Naya 2. Every dish carries its calories and protein, and the highest-protein items reach ${topProtein[0] ? Math.round(topProtein[0].protein) : 39}g in a single serving.`,
        },
        {
          q: "Is your beef grass-fed?",
          a: "Yes — our beef and lamb are grass-fed.",
        },
        {
          q: "Do you use seed oils?",
          a: CLAIM_NO_SEED_OILS,
        },
        {
          q: "Do you show calories and protein?",
          a: "Yes, on every dish we sell — on the menu, on the website and at the counter.",
        },
        ...sharedFaq.slice(0, 2),
      ],
    },
  ];
}

/* ------------------------------------------------------------------ writers */

/*
  The slug list also lives in vercel.json's rewrite. Two copies drift, and the
  drift is invisible: a page missing from the rewrite still builds, still passes
  every check here, and only fails in production by serving the empty SPA shell
  to a crawler with a 200. So assert the two agree at build time instead.
*/
function assertRoutesPinned(slugs) {
  const conf = readFileSync(join(ROOT, "vercel.json"), "utf8");
  const missing = slugs.filter((s) => !conf.includes(s));
  if (missing.length) {
    console.error(
      `[aeo] vercel.json has no rewrite for: ${missing.join(", ")}\n` +
        "[aeo] add them to the AEO rewrite or these pages will serve the SPA shell in production."
    );
    process.exit(1);
  }
}

function writePage(slug, html) {
  const dir = join(DIST, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html, "utf8");
}

/*
  robots.txt and sitemap.xml did not exist at all: public/ holds only assets/, so
  the catch-all rewrite answered /robots.txt with SPA HTML as a text/html
  soft-200. An unparseable answer to a well-formed question is worse than a 404,
  which is why these are written here rather than left to the rewrite.
*/
function writeRobots(slugs) {
  const bots = [
    "GPTBot", "OAI-SearchBot", "ChatGPT-User",
    "ClaudeBot", "Claude-User", "anthropic-ai",
    "PerplexityBot", "Perplexity-User",
    "Google-Extended", "Googlebot", "Bingbot", "Applebot", "Applebot-Extended",
    "DuckDuckBot", "YandexBot",
  ];
  const body = [
    ...bots.map((b) => `User-agent: ${b}\nAllow: /\n`),
    "User-agent: *\nAllow: /\n",
    `Sitemap: ${SITE}/sitemap.xml\n`,
  ].join("\n");
  writeFileSync(join(DIST, "robots.txt"), body, "utf8");
  return slugs;
}

function writeSitemap(slugs) {
  const urls = ["", ...slugs]
    .map((s) => `  <url><loc>${SITE}${s ? `/${s}` : "/"}</loc></url>`)
    .join("\n");
  writeFileSync(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    "utf8"
  );
}

/*
  The SPA shell keeps its empty <div id="root"> — we are not prerendering the app
  itself, because React mounts with createRoot(), which discards existing markup
  rather than hydrating it. What the root page CAN carry losslessly is head
  metadata: real title/description, canonical, Open Graph, and the Restaurant +
  FAQPage records. That is zero visual risk and turns "/" from 677 empty bytes
  into an identifiable business.
*/
function patchIndex(faqs) {
  const file = join(DIST, "index.html");
  if (!existsSync(file)) throw new Error("dist/index.html missing — did vite build run?");
  let html = readFileSync(file, "utf8");

  const title = `${NAP.name} — Healthy Food in Rawai, Phuket`;
  const desc =
    "Fresh, unprocessed food made daily in Rawai, Phuket: potato tacos, salads, fresh spring rolls, smoothies, juices and coffee. No seed oils, no MSG, nothing deep-fried.";

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escHtml(desc)}">`
    );

  const head = [
    `<link rel="canonical" href="${SITE}/">`,
    `<meta property="og:type" content="restaurant">`,
    `<meta property="og:title" content="${escHtml(title)}">`,
    `<meta property="og:description" content="${escHtml(desc)}">`,
    `<meta property="og:url" content="${SITE}/">`,
    `<meta property="og:image" content="${SITE}/assets/logo-full-color.png">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(
      restaurantLd({ hasMenu: `${SITE}/menu` })
    )}</script>`,
    `<script type="application/ld+json">${JSON.stringify(faqLd(faqs))}</script>`,
  ].join("\n    ");

  writeFileSync(file, html.replace("</head>", `    ${head}\n  </head>`), "utf8");
}

/* -------------------------------------------------------------------- main */

async function main() {
  if (process.env.AEO_SKIP === "1") {
    console.warn("[aeo] AEO_SKIP=1 — skipping prerender. The site ships without AEO pages.");
    return;
  }

  // Russian ISPs throttle the CDN in front of Supabase and a throttled socket
  // hangs rather than rejecting, so one failure is noise. Three are a problem.
  let dishes, lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      dishes = await fetchMenu();
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }

  /*
    Hard failure on purpose. The quiet alternative — ship the SPA and silently
    drop the AEO pages — produces a deploy that looks green while the entire
    point of this work package is missing, and a sitemap advertising pages that
    are not there. AEO_SKIP=1 is the deliberate escape hatch.
  */
  if (!dishes) {
    console.error(`[aeo] menu fetch failed after 3 attempts: ${lastErr?.message}`);
    console.error("[aeo] refusing to emit pages from no data. Set AEO_SKIP=1 to ship without them.");
    process.exit(1);
  }

  if (!dishes.length) {
    console.error("[aeo] menu_public returned zero sellable dishes — refusing to publish an empty menu.");
    process.exit(1);
  }

  const pages = buildPages(dishes);
  const slugs = pages.map((p) => p.slug);
  assertRoutesPinned(slugs);

  for (const p of pages) writePage(p.slug, page(p));
  writeRobots(slugs);
  writeSitemap(slugs);
  patchIndex(pages[0].faqs);

  console.log(
    `[aeo] ${dishes.length} sellable dishes -> ${slugs.length} pages (${slugs.join(", ")}), ` +
      "robots.txt, sitemap.xml, and head metadata on /."
  );
}

main().catch((err) => {
  console.error("[aeo] prerender failed:", err);
  process.exit(1);
});

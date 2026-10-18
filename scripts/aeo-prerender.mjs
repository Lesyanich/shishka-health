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

   The gluten wording is the load-bearing one. A guest with coeliac disease may
   act on it, so it names only what the allergen data actually backs and never
   implies the whole menu is safe.
*/
const CLAIM_NO_SEED_OILS =
  "We cook with no seed oils at all — not in the kitchen, not in our sauces, and nothing is deep-fried.";
/*
  CLAIM_GLUTEN — MC 98e1ef8d, 2026-10-18. History: "Everything on our menu is
  gluten-free except our sourdough bread" was removed on 2026-10-16 because it
  had become false (wheat wraps, 19-grain toast, croutons). Its replacement,
  "most of our salads and bowls, our dips, and every drink", still overclaimed:
  5 of the 13 salads and bowls carry the gluten allergen, and most of the rest
  have unreviewed ingredients, so "most" could not be backed.

  The rule now: name a group only when every live item in it has a CONFIRMED
  allergen status (fn_dish_allergen_status confident = true, no gluten) — an
  empty allergen list on an unreviewed dish means unknown, not safe. On
  2026-10-18 that held for the three dips, every coffee, smoothie and fresh
  juice, and the tabbouleh (quinoa, not bulgur). Matcha is left out because one
  matcha drink still has an unreviewed ingredient. Re-check before widening it.

  CEO RULE: we do not publish our own weaknesses on our own site, so this states
  what we DO have without gluten. The celiac question is a direct safety
  question and gets a direct answer, which is the one place a limitation belongs.
  CLAIM_GLUTEN_MARK points guests at the per-dish gluten tag the menu renders
  (allergen-gluten, set on all 28 live dishes that contain it).

  No dish is tagged "gluten-free" on the menu, so none is called that here.
  "Made without gluten ingredients" is deliberate: it is not a cross-contact
  promise.
*/
const CLAIM_GLUTEN =
  "Our three dips (hummus, beetroot hummus and smoked eggplant), our coffee, smoothies and fresh juices, and our tabbouleh salad are made without gluten ingredients.";
const CLAIM_GLUTEN_MARK =
  "Dishes made with gluten ingredients carry a gluten mark on our menu.";
// The toast is a bought-in 19-grain loaf, so the kitchen handles wheat but does
// not bake it — the earlier "we bake wheat sourdough" was not true either.
const CLAIM_CELIAC =
  "No. We prepare wheat wraps and bread in the same kitchen, so we cannot promise a celiac-safe environment. Tell us before you order and we will go through the dish with you.";

/*
  Russian, Thai and Arabic carry the same three gluten statements, translated
  offline here (never per view). Keep all four languages in step: change the
  English claim, change these in the same commit.
*/
const CLAIM_NO_SEED_OILS_RU =
  "Мы вообще не используем масла из семян — ни на кухне, ни в соусах, и ничего не жарим во фритюре.";
const CLAIM_GLUTEN_RU =
  "Три наших дипа (хумус, свекольный хумус и дип из копчёного баклажана), кофе, смузи и свежевыжатые соки, а также салат табуле готовятся без ингредиентов, содержащих глютен.";
const CLAIM_GLUTEN_MARK_RU =
  "Блюда с ингредиентами, содержащими глютен, отмечены в нашем меню значком глютена.";
const CLAIM_CELIAC_RU =
  "Нет. На нашей кухне готовят пшеничные лепёшки и хлеб, поэтому мы не можем гарантировать безопасность при целиакии. Предупредите нас до заказа, и мы вместе разберём блюдо.";

const CLAIM_GLUTEN_TH =
  "ดิปทั้งสามของเรา (ฮัมมัส ฮัมมัสบีทรูท และดิปมะเขือยาวรมควัน) กาแฟ สมูทตี้ น้ำผลไม้สด และสลัดทาบูเล่ ทำโดยไม่ใช้วัตถุดิบที่มีกลูเตน";
const CLAIM_GLUTEN_MARK_TH =
  "เมนูที่ใช้วัตถุดิบที่มีกลูเตนจะมีสัญลักษณ์กลูเตนกำกับไว้ในเมนูของเรา";
const CLAIM_CELIAC_TH =
  "ไม่ใช่ เราเตรียมแผ่นแรปและขนมปังจากข้าวสาลีในครัวเดียวกัน จึงไม่สามารถรับรองความปลอดภัยสำหรับผู้เป็นโรคเซลิแอคได้ กรุณาแจ้งเราก่อนสั่ง แล้วเราจะช่วยตรวจสอบเมนูกับคุณ";

const CLAIM_GLUTEN_AR =
  "أطباق التغميس الثلاثة لدينا (الحمص، وحمص الشمندر، ومتبّل الباذنجان المدخّن)، والقهوة والسموذي والعصائر الطازجة، وسلطة التبولة، تُحضَّر كلها بدون مكوّنات تحتوي على الغلوتين.";
const CLAIM_GLUTEN_MARK_AR =
  "الأطباق المحضّرة بمكوّنات تحتوي على الغلوتين تحمل علامة الغلوتين في قائمتنا.";
const CLAIM_CELIAC_AR =
  "لا. نحضّر خبز الراب والخبز المصنوعين من القمح في المطبخ نفسه، لذلك لا يمكننا ضمان بيئة آمنة لمرضى السيلياك. أخبرنا قبل الطلب وسنراجع الطبق معك.";
const CLAIM_NO_SEED_OILS_AR =
  "نحن لا نستخدم زيوت البذور على الإطلاق — لا في المطبخ ولا في صوصاتنا، ولا نقلي أي شيء بالزيت الغزير.";

/* --------------------------------------------------------------- utilities */

const escHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const baht = (n) => `฿${Number(n).toLocaleString("en-US")}`;

// Russian plural: ruPlural(5, ["позиция", "позиции", "позиций"]) → "позиций".
const ruPlural = (n, [one, few, many]) =>
  ({ one, few, many, other: few })[new Intl.PluralRules("ru").select(n)];

/*
  Arabic has six CLDR plural categories and the noun case changes with the
  count: 3–10 takes the plural ("5 أطباق"), 11–99 the accusative singular
  ("77 طبقًا"). Getting this wrong is the single most obvious tell that a page
  was machine-translated, so the counted noun goes through here.
*/
const arPlural = (n, forms) => forms[new Intl.PluralRules("ar").select(n)] ?? forms.other;
const arDishes = (n) =>
  `${n} ${arPlural(n, {
    zero: "طبق",
    one: "طبق واحد",
    two: "طبقان",
    few: "أطباق",
    many: "طبقًا",
    other: "طبق",
  })}`;

// Languages written right-to-left: drives dir="rtl" on the prerendered <html>.
const RTL = new Set(["ar"]);

// Page chrome per language. Dish copy comes from the DB (menu_translations).
const TEXT = {
  en: {
    faqTitle: "Common questions",
    visit: "Visit us",
    country: "Thailand",
    open: `Open ${NAP.hoursHuman}`,
    fullMenu: "See the full interactive menu",
    home: "/",
    tagline: "— Rawai, Phuket. From the SOIL to the SOUL.",
    pricesNote: "Prices in Thai baht and may change. Menu updated automatically from our kitchen system.",
    kcal: "kcal",
    protein: "g protein",
    logoAlt: "SHiSHKA Healthy Kitchen",
  },
  ru: {
    faqTitle: "Частые вопросы",
    visit: "Как нас найти",
    country: "Thailand",
    open: "Открыто ежедневно, 9:30 – 18:30",
    fullMenu: "Интерактивное меню с фото",
    home: "/ru",
    tagline: "— Раваи, Пхукет. From the SOIL to the SOUL.",
    pricesNote: "Цены в тайских батах и могут меняться. Меню обновляется автоматически из нашей кухонной системы.",
    kcal: "ккал",
    protein: "г белка",
    logoAlt: "SHiSHKA Healthy Kitchen",
  },
  ar: {
    faqTitle: "أسئلة شائعة",
    visit: "زورونا",
    country: "Thailand",
    open: "مفتوح يوميًا 9:30 – 18:30",
    fullMenu: "شاهد القائمة الكاملة بالصور",
    home: "/ar",
    tagline: "— راواي، فوكيت. From the SOIL to the SOUL.",
    pricesNote: "الأسعار بالبات التايلندي وقابلة للتغيير. القائمة تُحدَّث تلقائيًا من نظام مطبخنا.",
    kcal: "سعرة",
    protein: "غ بروتين",
    logoAlt: "SHiSHKA Healthy Kitchen",
  },
  th: {
    faqTitle: "คำถามที่พบบ่อย",
    visit: "แวะมาหาเรา",
    country: "Thailand",
    open: "เปิดทุกวัน 9:30 – 18:30 น.",
    fullMenu: "ดูเมนูเต็มพร้อมรูป",
    home: "/th",
    tagline: "— ราไวย์ ภูเก็ต From the SOIL to the SOUL.",
    pricesNote: "ราคาเป็นเงินบาทและอาจเปลี่ยนแปลงได้ เมนูอัปเดตอัตโนมัติจากระบบครัวของเรา",
    kcal: "แคล",
    protein: "ก. โปรตีน",
    logoAlt: "SHiSHKA Healthy Kitchen",
  },
};

// <link rel="alternate" hreflang> set for a page that exists in several
// languages. x-default points at English, the language "/" serves to crawlers.
function hreflangLinks(alternates) {
  if (!alternates?.length) return "";
  const en = alternates.find((a) => a.lang === "en");
  return [
    ...alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`),
    ...(en ? [`<link rel="alternate" hreflang="x-default" href="${en.href}">`] : []),
  ].join("\n");
}

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
    "id", "section_id", "category_id",
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
    id: d.id,
    sectionId: d.section_id ?? d.category_id ?? null,
    name: titleCase(d.customer_short_name || d.name),
    description: titleCase(d.customer_description),
    price: d.price != null ? Number(d.price) : null,
    calories: d.calories != null ? Number(d.calories) : null,
    protein: d.protein != null ? Number(d.protein) : null,
    image: d.image_url || d.customer_photo_url || null,
    section: titleCase(d.section_name || d.category_name || "Menu"),
  }));
}

/*
  Fresh translations for one language (shishka-os mig 446). The view withholds a
  translation whose English source changed after it was written, so a stale one
  can never reach a static page — the English is used for that field instead.
*/
async function fetchTranslations(lang) {
  const url = process.env.VITE_SUPABASE_URL || "https://qcqgtcsjoacuktcewpvo.supabase.co";
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWd0Y3Nqb2FjdWt0Y2V3cHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwMjUsImV4cCI6MjA4ODE5MjAyNX0.XI08SHEUG6_DQHyrZIUOtgCtEPW8E7tRTtH2Sc0dqzA";
  const res = await fetch(
    `${url}/rest/v1/menu_translations?select=entity,entity_key,field,value&lang=eq.${lang}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) {
    throw new Error(`menu_translations fetch failed: HTTP ${res.status} ${await res.text()}`);
  }
  const map = new Map();
  for (const r of await res.json()) map.set(`${r.entity}|${r.entity_key}|${r.field}`, r.value);
  return map;
}

// The English dish list with names, descriptions and sections swapped for
// their translations where one exists. No Title Case: that is an English rule.
function localizeDishes(dishes, tr) {
  const text = (entity, key, field) => {
    const v = tr.get(`${entity}|${key}|${field}`);
    return typeof v === "string" && v ? deepStripEmoji(v) : null;
  };
  return dishes.map((d) => ({
    ...d,
    name: text("dish", d.id, "name") ?? d.name,
    description: text("dish", d.id, "description") ?? d.description,
    section: (d.sectionId && text("category", d.sectionId, "name")) ?? d.section,
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

function menuLd(groups, { lang = "en" } = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: lang === "ru" ? `Меню ${NAP.name}` : `${NAP.name} Menu`,
    url: lang === "ru" ? `${SITE}/ru/menu` : `${SITE}/menu`,
    ...(lang === "en" ? {} : { inLanguage: lang }),
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
.claim{border-inline-start:3px solid var(--gold);padding-block:8px;padding-inline:16px 0;margin:24px 0;color:var(--cream)}
.meta{color:var(--muted);font-size:14px}
ul.dishes{list-style:none;padding:0;margin:0}
ul.dishes li{display:flex;justify-content:space-between;gap:16px;align-items:baseline;
padding:10px 0;border-bottom:1px solid var(--line)}
.dish-name{color:var(--cream)}
.dish-desc{display:block;color:var(--muted);font-size:14px}
.price{color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap}
.kcal{color:var(--mint);font-size:13px;font-variant-numeric:tabular-nums}
.cta{display:inline-block;background:var(--red);color:#fff;text-decoration:none;
padding:12px 22px;border-radius:999px;margin-block:8px;margin-inline:0 12px}
.faq dt{color:var(--cream);margin-top:20px;font-weight:600}
.faq dd{margin:6px 0 0}
footer{margin-top:56px;padding-top:24px;border-top:1px solid var(--line);
color:var(--muted);font-size:14px}
@media(max-width:600px){h1{font-size:28px}.wrap{padding:24px 16px 48px}}
/* RTL (/ar): the layout mirrors off <html dir>, but baht prices, kcal/protein
figures and the never-translated Latin dish names must each stay an LTR island
or the bidi algorithm moves the ฿ and the trailing punctuation to the wrong
end. Mirrors the rule in src/styles/components.css. */
[dir=rtl] .price,[dir=rtl] .kcal,[dir=rtl] .dish-name{direction:ltr;unicode-bidi:isolate}
[dir=rtl] .dish-name{text-align:start}
`.trim();

/* ---------------------------------------------------------------- template */

function page({ slug, title, description, h1, answer, body, faqs = [], extraLd = [], lang = "en", alternates = [] }) {
  const T = TEXT[lang];
  const canonical = `${SITE}/${slug}`.replace(/\/$/, "") || SITE;
  const lds = [restaurantLd(), ...extraLd];
  if (faqs.length) lds.push(faqLd(faqs));

  const faqHtml = faqs.length
    ? `<h2>${escHtml(T.faqTitle)}</h2>
    <dl class="faq">
${faqs.map((f) => `      <dt>${escHtml(f.q)}</dt>\n      <dd>${escHtml(f.a)}</dd>`).join("\n")}
    </dl>`
    : "";

  return `<!DOCTYPE html>
<html lang="${lang}"${RTL.has(lang) ? ' dir="rtl"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(description)}">
<link rel="canonical" href="${canonical}">
${hreflangLinks(alternates)}
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
  <img src="/assets/logo-full-white.png" alt="${escHtml(T.logoAlt)}">
</header>
<h1>${escHtml(h1)}</h1>
<p class="lede">${escHtml(answer)}</p>
${body}
${faqHtml}
<h2>${escHtml(T.visit)}</h2>
<p>${escHtml(NAP.street)}, ${escHtml(NAP.locality)}, ${escHtml(NAP.region)} ${escHtml(NAP.postal)}, ${escHtml(T.country)}<br>
${escHtml(T.open)} · <a href="tel:${NAP.phone}">${escHtml(NAP.phoneDisplay)}</a></p>
<p>
  <a class="cta" href="${T.home}">${escHtml(T.fullMenu)}</a>
  <a class="cta" href="${NAP.instagram}" rel="noopener">Instagram</a>
</p>
<footer>
  <p>${escHtml(NAP.name)} ${escHtml(T.tagline)}</p>
  <p class="meta">${escHtml(T.pricesNote)}</p>
</footer>
</div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------- pages */

function dishList(dishes, { withDesc = true, lang = "en" } = {}) {
  const T = TEXT[lang];
  return `<ul class="dishes">
${dishes
  .map(
    (d) => `  <li><span class="dish-name">${escHtml(d.name)}${
      withDesc && d.description ? `<span class="dish-desc">${escHtml(d.description)}</span>` : ""
    }${d.calories != null ? `<span class="kcal">${d.calories} ${T.kcal}${d.protein != null ? ` · ${d.protein}${lang === "en" ? "" : " "}${T.protein}` : ""}</span>` : ""}</span>${
      d.price != null ? `<span class="price">${escHtml(baht(d.price))}</span>` : ""
    }</li>`
  )
  .join("\n")}
</ul>`;
}

// Every language that gets its own URL. Adding one is an entry here plus a TEXT
// block, a dictionary in src/i18n and two rewrites in vercel.json.
const TRANSLATED_LANGS = ["ru", "th", "ar"];

const MENU_ALTERNATES = [
  { lang: "en", href: `${SITE}/menu` },
  ...TRANSLATED_LANGS.map((l) => ({ lang: l, href: `${SITE}/${l}/menu` })),
];
const HOME_ALTERNATES = [
  { lang: "en", href: `${SITE}/` },
  ...TRANSLATED_LANGS.map((l) => ({ lang: l, href: `${SITE}/${l}` })),
];

function ruFaq() {
  return [
    { q: "Где находится SHiSHKA Healthy Kitchen?", a: `Внутри Tops Daily на Soi Naya 2 в Раваи, Пхукет — ${NAP.street}, ${NAP.locality}, ${NAP.region} ${NAP.postal}.` },
    { q: "Когда вы открыты?", a: "Мы открыты ежедневно, 9:30 – 18:30." },
    { q: "Вы используете масла из семян?", a: CLAIM_NO_SEED_OILS_RU },
    { q: "Вы что-нибудь жарите во фритюре?", a: "Нет. В нашем меню нет ничего, приготовленного во фритюре." },
    { q: "У вас есть блюда без глютена?", a: `${CLAIM_GLUTEN_RU} ${CLAIM_GLUTEN_MARK_RU}` },
    { q: "Ваша кухня безопасна при целиакии?", a: CLAIM_CELIAC_RU },
    { q: "Как сделать заказ?", a: `Подойдите к кассе или позвоните нам: ${NAP.phoneDisplay}. Полное меню с фото — на shishka.health/ru.` },
  ];
}

const THAI_CLAIM_NO_SEED_OILS =
  "เราไม่ใช้น้ำมันจากเมล็ดพืชเลย ทั้งในการปรุงและในซอสของเรา และไม่มีเมนูใดทอดน้ำมันท่วม";

function thFaq() {
  return [
    { q: "SHiSHKA Healthy Kitchen อยู่ที่ไหน", a: `อยู่ในท็อปส์ เดลี่ ซอยนาใน 2 ราไวย์ ภูเก็ต — ${NAP.street}, ${NAP.locality}, ${NAP.region} ${NAP.postal}` },
    { q: "เปิดกี่โมง", a: "เปิดทุกวัน 9:30 – 18:30 น." },
    { q: "ใช้น้ำมันจากเมล็ดพืชหรือไม่", a: THAI_CLAIM_NO_SEED_OILS },
    { q: "มีเมนูทอดน้ำมันท่วมไหม", a: "ไม่มี ไม่มีเมนูใดในร้านที่ทอดน้ำมันท่วม" },
    { q: "มีเมนูที่ไม่มีกลูเตนไหม", a: `${CLAIM_GLUTEN_TH} ${CLAIM_GLUTEN_MARK_TH}` },
    { q: "ครัวของร้านปลอดภัยสำหรับผู้เป็นโรคเซลิแอคไหม", a: CLAIM_CELIAC_TH },
    { q: "สั่งอาหารอย่างไร", a: `สั่งที่เคาน์เตอร์ได้เลย หรือโทร ${NAP.phoneDisplay} เมนูเต็มพร้อมรูปอยู่ที่ shishka.health/th` },
  ];
}

function arFaq() {
  return [
    { q: "أين يقع SHiSHKA Healthy Kitchen؟", a: `داخل Tops Daily في سوي نايا 2، راواي، فوكيت — ${NAP.street}, ${NAP.locality}, ${NAP.region} ${NAP.postal}` },
    { q: "ما هي ساعات العمل؟", a: "مفتوح يوميًا من 9:30 حتى 18:30." },
    { q: "هل تستخدمون زيوت البذور؟", a: CLAIM_NO_SEED_OILS_AR },
    { q: "هل تقدّمون أي طعام مقلي بالزيت الغزير؟", a: "لا. لا يوجد في قائمتنا أي طبق مقلي بالزيت الغزير." },
    { q: "هل لديكم أطباق بدون غلوتين؟", a: `${CLAIM_GLUTEN_AR} ${CLAIM_GLUTEN_MARK_AR}` },
    { q: "هل مطبخكم آمن لمرضى السيلياك؟", a: CLAIM_CELIAC_AR },
    { q: "كيف أطلب؟", a: `اطلب عند الكاشير أو اتصل بنا: ${NAP.phoneDisplay}. القائمة الكاملة بالصور على shishka.health/ar` },
  ];
}

/*
  The per-language counterpart of /menu. The four English search-intent landing
  pages have no translated twins yet.

  Dish NAMES are not translated in any language (shishka-os mig 466) — a guest
  orders by the name the till shows — so these pages carry English names with
  translated section headings, descriptions and prices.
*/
const LANG_PAGES = {
  ru: (dishes, groups, cheapest) => {
    const items = `${dishes.length} ${ruPlural(dishes.length, ["позиция", "позиции", "позиций"])}`;
    const priceLine = cheapest ? ` Цены от ${baht(cheapest.price)}.` : "";
    return {
      title: `Меню — ${NAP.name}, Раваи, Пхукет`,
      description: `Полное меню ${NAP.name}: ${items} с ценами — готовим каждый день в Раваи, Пхукет. Без масел из семян, без глутамата натрия и без фритюра.`,
      h1: "Наше меню",
      answer: `${NAP.name} в Раваи (Пхукет): ${items} — салаты, боулы, врапы, завтраки, смузи, соки, матча и кофе, всё готовим каждый день.${priceLine} Без масел из семян, без глутамата натрия и без фритюра.`,
      faqs: ruFaq(),
    };
  },
  th: (dishes, groups, cheapest) => {
    const items = `${dishes.length} รายการ`;
    const priceLine = cheapest ? ` เริ่มต้น ${baht(cheapest.price)}` : "";
    return {
      title: `เมนู — ${NAP.name} ราไวย์ ภูเก็ต`,
      description: `เมนูทั้งหมดของ ${NAP.name}: ${items} พร้อมราคา ทำสดใหม่ทุกวันที่ราไวย์ ภูเก็ต ไม่ใช้น้ำมันจากเมล็ดพืช ไม่ใส่ผงชูรส และไม่ทอดน้ำมันท่วม`,
      h1: "เมนูของเรา",
      answer: `${NAP.name} ที่ราไวย์ ภูเก็ต มี ${items} — สลัด โบว์ล แรป ปอเปี๊ยะสด สมูทตี้ น้ำผลไม้ มัทฉะ และกาแฟ ทำสดใหม่ทุกวัน${priceLine} ไม่ใช้น้ำมันจากเมล็ดพืช ไม่ใส่ผงชูรส และไม่ทอดน้ำมันท่วม`,
      faqs: thFaq(),
    };
  },
  ar: (dishes, groups, cheapest) => {
    const items = arDishes(dishes.length);
    const priceLine = cheapest ? ` الأسعار تبدأ من ${baht(cheapest.price)}.` : "";
    return {
      title: `القائمة — ${NAP.name}، راواي، فوكيت`,
      description: `قائمة ${NAP.name} الكاملة: ${items} مع الأسعار — تُحضَّر طازجة كل يوم في راواي، فوكيت. بلا زيوت بذور، بلا غلوتامات أحادية الصوديوم، وبلا قلي بالزيت الغزير.`,
      h1: "قائمتنا",
      answer: `${NAP.name} في راواي، فوكيت: ${items} — سلطات، سلطانيات، راب، لفائف طازجة، سموذي، عصائر، ماتشا وقهوة، تُحضَّر طازجة كل يوم.${priceLine} بلا زيوت بذور، بلا غلوتامات أحادية الصوديوم، وبلا قلي بالزيت الغزير.`,
      faqs: arFaq(),
    };
  },
};

function buildTranslatedPages(lang, dishes) {
  const groups = groupBySection(dishes);
  const cheapest = dishes.filter((d) => d.price != null).sort((a, b) => a.price - b.price)[0];
  const copy = LANG_PAGES[lang](dishes, groups, cheapest);
  return [
    {
      slug: `${lang}/menu`,
      lang,
      alternates: MENU_ALTERNATES,
      ...copy,
      body: groups
        .map((g) => `<h2>${escHtml(g.section)}</h2>\n${dishList(g.dishes, { lang })}`)
        .join("\n"),
      extraLd: [menuLd(groups, { lang })],
    },
  ];
}

function buildPages(dishes) {
  const groups = groupBySection(dishes);
  const count = dishes.length;
  const cheapest = dishes.filter((d) => d.price != null).sort((a, b) => a.price - b.price)[0];
  const priceLine = cheapest ? ` Dishes start at ${baht(cheapest.price)}.` : "";

  const menuBody = groups
    .map((g) => `<h2>${escHtml(g.section)}</h2>\n${dishList(g.dishes)}`)
    .join("\n");

  const sharedFaq = [
    { q: "Where is SHiSHKA Healthy Kitchen?", a: `Inside Tops Daily on Soi Naya 2 in Rawai, Phuket — ${NAP.street}, ${NAP.locality}, ${NAP.region} ${NAP.postal}.` },
    { q: "What are your opening hours?", a: `We are open ${NAP.hoursHuman}.` },
    { q: "Do you use seed oils?", a: CLAIM_NO_SEED_OILS },
    { q: "Do you have gluten-free options?", a: `${CLAIM_GLUTEN} ${CLAIM_GLUTEN_MARK}` },
    { q: "Is your kitchen celiac-safe?", a: CLAIM_CELIAC },
    { q: "How do I order?", a: `Come to the counter, or call us on ${NAP.phoneDisplay}. The full menu with photos is on shishka.health.` },
  ];

  return [
    {
      slug: "menu",
      title: `Menu — ${NAP.name}, Rawai Phuket`,
      description: `The full ${NAP.name} menu: ${count} dishes and drinks with prices, made fresh daily in Rawai, Phuket. No seed oils, no MSG, nothing deep-fried.`,
      h1: "Our Menu",
      answer: `${NAP.name} in Rawai, Phuket serves ${count} freshly made dishes and drinks — salads, bowls, wraps, breakfast, smoothies, juices, matcha and coffee.${priceLine} We cook with no seed oils, no MSG and no deep-frying.`,
      body: menuBody,
      faqs: sharedFaq,
      extraLd: [menuLd(groups)],
      alternates: MENU_ALTERNATES,
    },
    {
      slug: "gluten-free-restaurant-phuket",
      title: `Gluten-Free Options in Phuket — ${NAP.name}, Rawai`,
      description: `${CLAIM_GLUTEN} Fresh every day in Rawai, Phuket.`,
      h1: "Gluten-Free Options in Rawai, Phuket",
      answer: `${CLAIM_GLUTEN} ${CLAIM_GLUTEN_MARK} If you have coeliac disease or a gluten allergy, tell us before you order and we will go through the dish with you.`,
      body: `<h2>What to look at</h2>
<p>Our hummus, beetroot hummus and smoked-eggplant dip are made without gluten ingredients, and so is our tabbouleh, which we make with quinoa instead of bulgur wheat. So are our coffee, smoothies and fresh juices.</p>
<p>Our wraps, toasts and breakfast plates are made with wheat, and dishes made with gluten ingredients carry a gluten mark on the menu. Tell us what you are avoiding and we will point you to the right plate.</p>
<p class="meta">Recipes change, so for anything not named above, ask us at the counter: we know what goes into every dish and we will check yours with you.</p>`,
      faqs: [
        { q: "Is your kitchen celiac-safe?", a: CLAIM_CELIAC },
        { q: "What contains gluten on your menu?", a: "Our wraps, toasts and breakfast plates are made with wheat, and so are the protein meals, which come with a wrap. Some salads and bowls contain gluten too, such as the Caesars, the Thai Noodle bowl and the Hummus Protein Boost, and so does one of our chocolate squares. Each of these carries a gluten mark on the menu. Ask us about any dish and we will check it for you." },
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
      description: `Fresh, unprocessed food made daily in Rawai, Phuket: salads, bowls, wraps, smoothies and specialty coffee. No seed oils, no MSG.`,
      h1: "Healthy Food in Rawai, Phuket",
      answer: `${NAP.name} is a healthy kitchen in Rawai, Phuket, inside Tops Daily on Soi Naya 2. We make ${count} dishes and drinks fresh every day — salads, bowls, wraps, breakfast, smoothies, juices and coffee — with no seed oils, no MSG and nothing deep-fried.`,
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

// Language pairs are listed on both members (Google requires the set to be
// reciprocal) as xhtml:link alternates.
function writeSitemap(slugs) {
  const altFor = (loc) =>
    [HOME_ALTERNATES, MENU_ALTERNATES].find((set) => set.some((a) => a.href === loc));
  const urls = ["", "ru", ...slugs]
    .map((s) => {
      const loc = s === "" ? `${SITE}/` : `${SITE}/${s}`;
      const alts = altFor(loc);
      const links = alts
        ? "\n" +
          [...alts, { lang: "x-default", href: alts[0].href }]
            .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`)
            .join("\n") +
          "\n  "
        : "";
      return `  <url><loc>${loc}</loc>${links}</url>`;
    })
    .join("\n");
  writeFileSync(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
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
function patchIndex(faqs, shells) {
  const file = join(DIST, "index.html");
  if (!existsSync(file)) throw new Error("dist/index.html missing — did vite build run?");
  let html = readFileSync(file, "utf8");

  const title = `${NAP.name} — Healthy Food in Rawai, Phuket`;
  const desc =
    "Fresh, unprocessed food made daily in Rawai, Phuket: salads, bowls, wraps, breakfast, smoothies, juices and coffee. No seed oils, no MSG, nothing deep-fried.";

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
    .replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${escHtml(desc)}">`
    );

  const shell = html;
  const head = [
    `<link rel="canonical" href="${SITE}/">`,
    hreflangLinks(HOME_ALTERNATES),
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

  /*
    Each translated language gets the same SPA shell (the app reads the language
    from the URL) with its own head metadata, so a crawler that only reads
    <head> still gets a page in that language with the right canonical+hreflang.
  */
  for (const { lang, title, desc, locale, faqs: langFaqs } of shells) {
    const html = shell
      .replace(
        /<html lang="[^"]*">/,
        `<html lang="${lang}"${RTL.has(lang) ? ' dir="rtl"' : ""}>`
      )
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escHtml(title)}</title>`)
      .replace(
        /<meta name="description"[^>]*>/,
        `<meta name="description" content="${escHtml(desc)}">`
      );
    const langHead = [
      `<link rel="canonical" href="${SITE}/${lang}">`,
      hreflangLinks(HOME_ALTERNATES),
      `<meta property="og:type" content="restaurant">`,
      `<meta property="og:locale" content="${locale}">`,
      `<meta property="og:title" content="${escHtml(title)}">`,
      `<meta property="og:description" content="${escHtml(desc)}">`,
      `<meta property="og:url" content="${SITE}/${lang}">`,
      `<meta property="og:image" content="${SITE}/assets/logo-full-color.png">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<script type="application/ld+json">${JSON.stringify(
        restaurantLd({ hasMenu: `${SITE}/${lang}/menu` })
      )}</script>`,
      `<script type="application/ld+json">${JSON.stringify(faqLd(langFaqs))}</script>`,
    ].join("\n    ");
    mkdirSync(join(DIST, lang), { recursive: true });
    writeFileSync(
      join(DIST, lang, "index.html"),
      html.replace("</head>", `    ${langHead}\n  </head>`),
      "utf8"
    );
  }
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

  // Translations, one language at a time. Same hard-failure policy as the menu:
  // a /ru or /th page built from no translations would be an English page
  // wearing a foreign label.
  const translated = [];
  for (const lang of TRANSLATED_LANGS) {
    let tr;
    for (let attempt = 1; attempt <= 3 && !tr; attempt++) {
      try {
        tr = await fetchTranslations(lang);
      } catch (err) {
        lastErr = err;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
    if (!tr || tr.size === 0) {
      console.error(`[aeo] ${lang} translations unavailable: ${lastErr?.message ?? "0 rows"}`);
      console.error(`[aeo] refusing to emit /${lang} pages from no data. Set AEO_SKIP=1 to ship without them.`);
      process.exit(1);
    }
    translated.push({ lang, dishes: localizeDishes(dishes, tr) });
  }

  const pages = [
    ...buildPages(dishes),
    ...translated.flatMap(({ lang, dishes: d }) => buildTranslatedPages(lang, d)),
  ];
  const slugs = pages.map((p) => p.slug);
  assertRoutesPinned([...slugs, ...TRANSLATED_LANGS]);

  for (const p of pages) writePage(p.slug, page(p));
  writeRobots(slugs);
  writeSitemap(slugs);
  patchIndex(pages[0].faqs, [
    {
      lang: "ru",
      locale: "ru_RU",
      title: `${NAP.name} — здоровая еда в Раваи, Пхукет`,
      desc: "Свежая, необработанная еда каждый день в Раваи, Пхукет: салаты, боулы, врапы, завтраки, смузи, соки и кофе. Без масел из семян, без глутамата натрия, без фритюра.",
      faqs: ruFaq(),
    },
    {
      lang: "th",
      locale: "th_TH",
      title: `${NAP.name} — อาหารสุขภาพที่ราไวย์ ภูเก็ต`,
      desc: "อาหารสดใหม่ ไม่ผ่านการแปรรูป ทำทุกวันที่ราไวย์ ภูเก็ต: สลัด โบว์ล แรป ปอเปี๊ยะสด สมูทตี้ น้ำผลไม้ และกาแฟ ไม่ใช้น้ำมันจากเมล็ดพืช ไม่ใส่ผงชูรส ไม่ทอดน้ำมันท่วม",
      faqs: thFaq(),
    },
    {
      // ar_AE rather than ar_SA: the Gulf tourist market this is aimed at, and
      // the neutral MSA register the copy is written in.
      lang: "ar",
      locale: "ar_AE",
      title: `${NAP.name} — طعام صحي في راواي، فوكيت`,
      desc: "طعام طازج غير مُصنَّع يُحضَّر كل يوم في راواي، فوكيت: سلطات، سلطانيات، راب، لفائف طازجة، سموذي، عصائر وقهوة. بلا زيوت بذور، بلا غلوتامات أحادية الصوديوم، وبلا قلي بالزيت الغزير.",
      faqs: arFaq(),
    },
  ]);

  console.log(
    `[aeo] ${dishes.length} sellable dishes -> ${slugs.length} pages (${slugs.join(", ")}), ` +
      "robots.txt, sitemap.xml, and head metadata on /."
  );
}

main().catch((err) => {
  console.error("[aeo] prerender failed:", err);
  process.exit(1);
});

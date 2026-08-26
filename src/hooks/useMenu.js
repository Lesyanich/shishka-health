import { useState, useEffect, useCallback } from "react";
import { supabase, hasSupabase, canRealtime } from "../lib/supabase.js";
import { MOCK_DATA } from "../lib/mockData.js";
import { DEFAULT_CONTENT, mergeContent } from "../lib/content.js";
import { deepStripEmoji, titleCaseMenu } from "../lib/text.js";
import { dishFloor, dishDefaultPrice } from "../lib/modifiers.js";
import { benefitsForDish } from "../lib/benefits.js";

/*
  Schema reference: Lesyanich/shishka-os
    apps/admin-panel/src/hooks/useMenuDishes.ts
    apps/admin-panel/src/pages/menu/components/CustomerPreview.tsx

  View: menu_public  (customer-safe projection of nomenclature)
    The view already bakes in the row filter
      product_code LIKE 'SALE-%' AND pos_status = 'synced' AND is_available = true
      (pos_status = 'synced' means the item is live in Loyverse, the POS).
    It exposes ONLY public columns — no cost_per_unit / markup_pct / cost_source /
    internal ops fields are reachable by the anon key. Category fields are
    flattened onto each row (category_code, category_name, category_sort_order).
    Customer fields: customer_short_name (fallback name),
                     customer_photo_url → image_url (photo fallback),
                     customer_description, calories, protein, carbs, fat,
                     portion_size, portion_unit
    Tags: nomenclature_tags → tags(slug, name, tag_group, color)
      tag_group !== 'allergen' → diets
      tag_group === 'allergen' → allergens

  RLS: anon key needs SELECT on menu_public, nomenclature_tags, and tags.
       (menu_public is security_invoker, so the nomenclature row RLS still applies.)
*/

// Fresh Spring Roll customisation. The modifier system (menu_modifiers) is a
// Loyverse-backed view, so these add/remove options are defined website-side and
// injected as a modifier group — the cart carries the build to the counter.
// "Remove" chips are free (price 0); "Add extras" carry a price + rough per-
// portion nutrition for the live counter. Per-roll protein extra is matched to
// the roll (none for Veggie). Removing a chip doesn't recompute base macros.
function springRollModifiers(productCode) {
  const code = productCode || "";
  // The rolls are served with mango sauce. They were listed with a peanut-lime
  // sauce that the kitchen no longer makes — peanut is an anaphylaxis-grade
  // allergen, so a stale sauce here is not a copy bug. Do not reintroduce a
  // sauce name without confirming it against the kitchen (MC 3a11032b).
  const remove = [
    "Mango", "Carrot", "Cucumber", "Lettuce", "Mint", "Coriander", "Mango Sauce",
  ];
  if (code.includes("TUNA")) remove.splice(1, 0, "Sweet Corn"); // tuna roll has corn
  const removeOpts = remove.map((name, i) => ({
    name: `No ${name}`, emoji: null, priceDelta: 0, isDefault: false, sort: i,
    calories: 0, protein: 0, carbs: 0, fat: 0,
  }));

  const proteinExtra = code.includes("CHICKEN")
    ? { name: "Extra Chicken", priceDelta: 50, calories: 100, protein: 18, carbs: 0, fat: 2 }
    : code.includes("SHRIMP")
    ? { name: "Extra Shrimp", priceDelta: 50, calories: 55, protein: 12, carbs: 1, fat: 0.5 }
    : code.includes("TUNA")
    ? { name: "Extra Tuna & Corn", priceDelta: 50, calories: 100, protein: 14, carbs: 8, fat: 1 }
    : null; // Veggie roll: no protein extra

  const addRaw = [
    { name: "Avocado", priceDelta: 30, calories: 120, protein: 1.5, carbs: 6, fat: 11 },
    ...(proteinExtra ? [proteinExtra] : []),
    // Price and macros are the real SALE-SAUCE_MANGO cup (50 g, ฿39) rather than
    // the ฿15 the retired peanut sauce carried — the counter sells that exact cup
    // at ฿39, and a cheaper number here is an argument at the till.
    { name: "Extra Mango Sauce", priceDelta: 39, calories: 32, protein: 0.3, carbs: 8.2, fat: 0.1 },
    { name: "Extra Mango", priceDelta: 20, calories: 50, protein: 0.5, carbs: 13, fat: 0 },
  ];
  const addOpts = addRaw.map((o, i) => ({ emoji: null, isDefault: false, sort: i, ...o }));

  return [
    { name: "Remove", sort: 1, minSelect: 0, maxSelect: null, options: removeOpts },
    { name: "Add Extras", sort: 2, minSelect: 0, maxSelect: null, options: addOpts },
  ];
}

async function fetchFromSupabase() {
  const [dishResult, tagResult, contentResult, modResult, tierResult] = await Promise.all([
    supabase
      .from("menu_public")
      .select(`
        id, name, product_code,
        customer_short_name, customer_photo_url, image_url, customer_description,
        customer_ingredients,
        price, is_available, is_featured, pos_status, stock_state,
        calories, protein, carbs, fat,
        portion_size, portion_unit,
        category_id, display_order,
        category_code, category_name, category_sort_order,
        section_id, section_name, section_sort_order,
        bundle_min_price
      `)
      .order("display_order", { ascending: true, nullsFirst: false }),

    supabase
      .from("nomenclature_tags")
      .select("nomenclature_id, tags(slug, name, tag_group, color)"),

    supabase
      .from("site_content")
      .select("key, data"),

    supabase
      .from("menu_modifiers")
      .select("dish_id, group_name, group_sort, group_min_select, group_max_select, option_name, option_emoji, price_delta, is_default, sort_order, calories, protein, carbs, fat"),

    // Manakish bundle tiers (the "Manakish set of N" sets). Discount escalates
    // with size; the constructor + cards price entirely from this.
    supabase
      .from("price_tiers")
      .select("tier_code, label, discount_pct, bundle_manakish_count, bundle_sauce_count, sort_order")
      .not("bundle_dish_code", "is", null)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (dishResult.error) throw dishResult.error;

  // Build modifier map: dish_id → grouped builder options
  const modMap = new Map();
  for (const r of modResult.data ?? []) {
    if (!modMap.has(r.dish_id)) modMap.set(r.dish_id, new Map());
    const groups = modMap.get(r.dish_id);
    if (!groups.has(r.group_name)) {
      groups.set(r.group_name, {
        name: r.group_name,
        sort: r.group_sort ?? 0,
        minSelect: r.group_min_select ?? 0,
        maxSelect: r.group_max_select ?? null,
        options: [],
      });
    }
    groups.get(r.group_name).options.push({
      name: r.option_name,
      emoji: r.option_emoji || null,
      priceDelta: Number(r.price_delta) || 0,
      isDefault: !!r.is_default,
      sort: r.sort_order ?? 0,
      // Per-portion nutrition (menu_modifiers, scaled by quantity_per_unit) for
      // the live KBJU counter in the builder.
      calories: r.calories != null ? Number(r.calories) : 0,
      protein: r.protein != null ? Number(r.protein) : 0,
      carbs: r.carbs != null ? Number(r.carbs) : 0,
      fat: r.fat != null ? Number(r.fat) : 0,
    });
  }
  const modifiersFor = (dishId) => {
    const groups = modMap.get(dishId);
    if (!groups) return [];
    return Array.from(groups.values())
      .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
      .map((g) => ({ ...g, options: g.options.sort((x, y) => x.sort - y.sort) }));
  };

  // Build tag map: nomenclature_id → tags[]
  const tagMap = new Map();
  for (const row of tagResult.data ?? []) {
    const tag = row.tags;
    if (!tag) continue;
    const list = tagMap.get(row.nomenclature_id) ?? [];
    list.push(tag);
    tagMap.set(row.nomenclature_id, list);
  }

  // Collect unique SECTIONS (umbrellas) from dish rows. The menu groups by the
  // section a dish rolls up to (Manakish, Drinks, …); the dish's own category is
  // the SUBCATEGORY rendered as a subheader inside that section. menu_public
  // exposes both via the is_menu_section rollup (see shishka-os mig 257/258).
  // Falls back to the leaf category when a dish has no section ancestor.
  const catMap = new Map();
  const dishes = (dishResult.data ?? []).map((d) => {
    // Sections come straight from the view's rollup — no dish is promoted here
    // any more. Spring rolls used to be lifted out of Appetizers & Sides by
    // product_code into a synthetic "Fresh Spring Roll" section, sorted half a
    // step ahead of their parent, which since mig 409 landed them at 18.5, down
    // among the sides. The CEO's ruling — a spring roll is a wrap, the wrapper
    // is rice paper — is now in the database: mig 414 moved them to
    // KP-FIN-WRP-RPW "Rice Paper Wraps", a subsection of Wraps, so they arrive
    // in the third main category with a subheader of their own and this file
    // does not need to know they exist.
    //
    // isSpringRoll survives for ONE reason, below: menu_modifiers still has no
    // rows for these four dishes, so their add-ons are hand-rolled.
    const isSpringRoll = d.product_code?.startsWith("SALE-SUMMER_ROLLS");
    const sectionId = d.section_id ?? d.category_id;
    const sectionName = d.section_name ?? d.category_name;
    const sectionSort = d.section_sort_order ?? d.category_sort_order ?? 0;
    if (sectionId && !catMap.has(sectionId)) {
      catMap.set(sectionId, { id: sectionId, name: sectionName, sort_order: sectionSort });
    }

    const allTags = tagMap.get(d.id) ?? [];
    const diets = allTags
      .filter((t) => t.tag_group !== "allergen")
      .map((t) => t.slug);
    const allergens = allTags
      .filter((t) => t.tag_group === "allergen")
      .map((t) => t.slug);

    // Stock state (mig 249): coming_soon / out_of_stock dishes stay on the menu
    // but render greyed + non-orderable with a badge, so guests see what's next.
    const stockState = d.stock_state ?? "in_stock";
    const comingSoon = stockState !== "in_stock";
    const stockLabel = stockState === "out_of_stock" ? "Out of stock" : "Coming soon";
    const badges = comingSoon
      ? [{ label: stockLabel, tone: "neutral" }]
      : d.is_featured
        ? [{ label: "Featured", tone: "gold" }]
        : [];

    const modifierGroups = isSpringRoll
      ? springRollModifiers(d.product_code)
      : modifiersFor(d.id);
    const price = d.price != null ? Number(d.price) : null;
    // A dish with a DEFAULT-selected add-on (e.g. a dip served with a bun by
    // default) opens "as configured": its headline price is base + default
    // add-ons (฿111 + ฿38 = ฿149), shown as a flat price the guest can change.
    const priceDefault = dishDefaultPrice(price, modifierGroups);

    // Split the Coffee category into Hot / Cold leaves (hot first) so the menu
    // shows them as two labelled groups. Cold = iced / cold brew / tonic.
    let subId = d.category_id ?? sectionId;
    let subName = d.category_name ?? sectionName;
    let subSort = d.category_sort_order ?? 0;
    if (d.product_code === "SALE-BAKED_POTATO_SIDE") {
      // The grilled potato becomes the Sides subgroup (more to come).
      subId = "grp-sides"; subName = "🥔 Sides"; subSort = 99;
    } else if (/coffee/i.test(d.category_name || "")) {
      const cold = /🧊|\biced\b|\bcold\b|tonic/i.test(d.name || "")
        || d.product_code === "SALE-COFFEE_ORANGE"
        || d.product_code === "SALE-COFFEE_PASSION_FRUIT";
      subId = `${d.category_id}:${cold ? "cold" : "hot"}`;
      subName = cold ? "🧊 Cold Coffee" : "☕ Hot Coffee";
      subSort = (d.category_sort_order ?? 0) + (cold ? 0.5 : 0);
    }

    return {
      id: d.id,
      product_code: d.product_code,
      name: d.customer_short_name || d.name,
      description: d.customer_description ?? null,
      ingredients: d.customer_ingredients ?? null,
      // "Real food, real supplement" — nourishment tags derived from the
      // dish's own ingredients (+ protein), shown in the dialog. See benefits.js.
      benefits: benefitsForDish({
        text: [d.customer_ingredients || d.customer_description, d.customer_short_name || d.name]
          .filter(Boolean)
          .join(" "),
        protein: d.protein != null ? Number(d.protein) : null,
      }),
      modifierGroups,
      price,
      priceDefault,
      // "From ฿X" floor for build-your-own dishes with a required group but no
      // default pick (smoothies). A dish with a default uses priceDefault, not
      // a "from" floor, so suppress it there.
      priceFrom: priceDefault != null ? null : dishFloor(price, modifierGroups),
      // Card (main page) prefers the customer override photo; the dialog keeps
      // the base image_url. They differ only where a dish has a dedicated
      // main-page shot (e.g. spring rolls); elsewhere both resolve to the same.
      cardImage: d.customer_photo_url ?? d.image_url ?? null,
      image_url: d.image_url ?? d.customer_photo_url ?? null,
      is_featured: d.is_featured,
      stockState,
      comingSoon,
      calories: d.calories != null ? Number(d.calories) : null,
      protein: d.protein != null ? Number(d.protein) : null,
      carbs: d.carbs != null ? Number(d.carbs) : null,
      fat: d.fat != null ? Number(d.fat) : null,
      portion_size: d.portion_size != null ? Number(d.portion_size) : null,
      portion_unit: d.portion_unit ?? null,
      category_id: d.category_id ?? null,
      category_code: d.category_code ?? null,
      // 60%-margin floor for the bundle constructor (NULL when it never binds).
      bundle_min_price: d.bundle_min_price != null ? Number(d.bundle_min_price) : null,
      category_name: d.category_name ?? null,
      // Section (umbrella) the dish groups under + its subcategory (leaf).
      section_id: sectionId,
      section_name: sectionName,
      subcategory_id: subId,
      subcategory_name: subName,
      subcategory_sort: subSort,
      diets,
      allergens,
      tags: allTags,
      badges,
    };
  });

  const categories = Array.from(catMap.values())
    .sort((a, b) => a.sort_order - b.sort_order);

  const content = mergeContent(contentResult.error ? [] : contentResult.data);

  // Manakish bundle tiers ("Manakish set of N"), discount escalates with size.
  const bundles = (tierResult?.error ? [] : tierResult?.data ?? []).map((t) => ({
    tierCode: t.tier_code,
    label: t.label,
    discountPct: Number(t.discount_pct),
    manakishCount: t.bundle_manakish_count,
    sauceCount: t.bundle_sauce_count,
  }));

  // The customer site shows emoji-free text only. Source data keeps emojis
  // for the admin panel + Loyverse POS, so strip them here — the single
  // boundary where all Supabase menu data is assembled. (See lib/text.js.)
  return deepStripEmoji({ dishes, categories, content, bundles });
}

// A hung request is the failure mode this site is most exposed to: Russian ISPs
// throttle the CDN in front of Supabase, and a throttled socket does not reject,
// it just never answers. Without a deadline the guest sits on the loading
// skeleton forever, which is the same lie as stale prices in a slower costume.
// 8s × 3 attempts + backoff ≈ 25s worst case before the guest is told the truth.
// A healthy load is under 2s, so this only bites when something is genuinely wrong.
const FETCH_TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`menu fetch timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

export function useMenu() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // No credentials configured — the documented offline development path.
    // This is the ONLY branch allowed to render MOCK_DATA: in production those
    // are hardcoded prices, and a guest shown ฿59 for a ฿79 dish is an argument
    // at the counter plus the margin lost on every order in between.
    if (!hasSupabase) {
      if (typeof window !== "undefined") window.__SHISHKA_MENU_SOURCE__ = "mock";
      // Single chokepoint: render all display copy in Title Case (hero kept as-is).
      setData(titleCaseMenu({ ...MOCK_DATA, content: DEFAULT_CONTENT }));
      setLoading(false);
      return;
    }

    // Russian ISPs throttle the CDN in front of Supabase, so one failed fetch is
    // expected noise rather than a broken contract. Retry before giving up —
    // but never substitute invented prices for real ones.
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await withTimeout(fetchFromSupabase(), FETCH_TIMEOUT_MS);
        if (typeof window !== "undefined") window.__SHISHKA_MENU_SOURCE__ = "live";
        setData(titleCaseMenu(result));
        setLoading(false);
        return;
      } catch (err) {
        lastErr = err;
        if (attempt < 3) await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }

    console.error("Menu fetch failed after 3 attempts:", lastErr);
    if (typeof window !== "undefined") window.__SHISHKA_MENU_SOURCE__ = "error";
    setData(null);
    setError(lastErr);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    if (!canRealtime) return;

    const channel = supabase
      .channel("menu-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "nomenclature" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "nomenclature_tags" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, load)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load]);

  return { data, loading, error };
}

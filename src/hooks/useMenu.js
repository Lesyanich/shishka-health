import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, hasSupabase, canRealtime } from "../lib/supabase.js";
import { MOCK_DATA } from "../lib/mockData.js";
import { DEFAULT_CONTENT, mergeContent, writeCachedContent } from "../lib/content.js";
import { deepStripEmoji, titleCaseMenu } from "../lib/text.js";
import { dishFloor, dishDefaultPrice } from "../lib/modifiers.js";
import { benefitsForDish } from "../lib/benefits.js";
import { buildMenuGroups } from "../lib/menuGroups.js";
import { LANG, DEFAULT_LANG } from "../i18n/index.js";
import { localizeMenu } from "../i18n/localize.js";
import { loadSnapshot, validateRaw } from "../lib/menuSnapshot.js";

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

async function fetchRawFromSupabase(signal) {
  // `signal` aborts every request at once (revalidation deadline, see useMenu).
  const abortable = (q) => (signal ? q.abortSignal(signal) : q);
  const [dishResult, tagResult, contentResult, modResult, tierResult, trResult] = await Promise.all([
    abortable(supabase
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
      .order("display_order", { ascending: true, nullsFirst: false })),

    abortable(supabase
      .from("nomenclature_tags")
      .select("nomenclature_id, tags(slug, name, tag_group, color)")),

    abortable(supabase
      .from("site_content")
      .select("key, data")),

    abortable(supabase
      .from("menu_modifiers")
      .select("dish_id, group_name, group_sort, group_min_select, group_max_select, option_name, option_emoji, price_delta, is_default, sort_order, calories, protein, carbs, fat")),

    // Manakish bundle tiers (the "Manakish set of N" sets). Discount escalates
    // with size; the constructor + cards price entirely from this.
    abortable(supabase
      .from("price_tiers")
      .select("tier_code, label, discount_pct, bundle_manakish_count, bundle_sauce_count, sort_order")
      .not("bundle_dish_code", "is", null)
      .eq("is_active", true)
      .order("sort_order")),

    // Translations for the page language (shishka-os mig 446). The view only
    // returns FRESH rows — a translation whose English source has changed since
    // is withheld, so the guest reads the current English instead of a stale
    // (possibly wrong-allergen) translation. English needs no request.
    LANG === DEFAULT_LANG
      ? Promise.resolve({ data: [], error: null })
      : abortable(supabase
          .from("menu_translations")
          .select("entity, entity_key, field, value")
          .eq("lang", LANG)),
  ]);

  // Each of these is required: a snapshot-less guest sees nothing without them, and
  // a partial live answer must not overwrite a complete snapshot. Translations are
  // optional (English fallback), exactly as before.
  if (dishResult.error) throw dishResult.error;
  if (tagResult.error) throw tagResult.error;
  if (modResult.error) throw modResult.error;
  if (tierResult.error) throw tierResult.error;
  if (trResult?.error) console.warn("menu_translations unavailable, showing English:", trResult.error);

  return {
    dishes: dishResult.data ?? [],
    tags: tagResult.data ?? [],
    content: contentResult.error ? [] : contentResult.data ?? [],
    modifiers: modResult.data ?? [],
    tiers: tierResult.data ?? [],
    translations: trResult?.error ? [] : trResult?.data ?? [],
  };
}

/*
  Raw rows -> the menu the UI renders. Pure and synchronous: the build-time
  snapshot (scripts/snapshot-menu.mjs) and the live fetch both feed it the same
  row shapes, so the two paths cannot render differently.
*/
function buildMenu(raw) {
  const dishResult = { data: raw.dishes };
  const tagResult = { data: raw.tags };
  const contentResult = { data: raw.content };
  const modResult = { data: raw.modifiers };
  const tierResult = { data: raw.tiers };
  const trResult = { data: raw.translations };

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
    // Sections come straight from the data. The rice-paper rolls used to be
    // lifted out here into an invented "Fresh Spring Roll" section at sort 2.5;
    // that name existed nowhere in the database, which is why searching the
    // admin panel for "spring" found nothing while the site plainly showed it.
    // The rolls were retired on 2026-10-16 (shishka-os migration 480) and the
    // special case went with them. Do not reintroduce a section name the data
    // does not carry — name it in the DB instead.
    const sectionId = d.section_id ?? d.category_id;
    let sectionName = d.section_name ?? d.category_name;
    const sectionSort = d.section_sort_order ?? d.category_sort_order ?? 0;
    if (sectionId && !catMap.has(sectionId)) {
      catMap.set(sectionId, { id: sectionId, name: sectionName, sort_order: sectionSort, count: 0 });
    }
    // Counts are never shown to the guest (SPEC §2) but code needs them for
    // ordering and empty checks, so they travel with the section.
    if (sectionId) catMap.get(sectionId).count += 1;

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

    const modifierGroups = modifiersFor(d.id);
    const price = d.price != null ? Number(d.price) : null;
    // A dish with a DEFAULT-selected add-on (e.g. a dip served with a bun by
    // default) opens "as configured": its headline price is base + default
    // add-ons (฿111 + ฿38 = ฿149), shown as a flat price the guest can change.
    const priceDefault = dishDefaultPrice(price, modifierGroups);

    // Subcategories come from the dish's own `category_*` fields — the leaf the
    // admin panel owns, for every dish. That includes Coffee's Hot / Cold split:
    // since shishka-os migration 505 they are real subcategories
    // (KP-DRK-COF-HOT / KP-DRK-COF-CLD), no longer synthesized here.
    const subId = d.category_id ?? sectionId;
    const subName = d.category_name ?? sectionName;
    const subSort = d.category_sort_order ?? 0;

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

  const content = mergeContent(contentResult.data);

  // EAT / DRINK / SWEET. The ordering lives in site_content.menu_groups (written
  // by shishka-os migration 500) with a same-shaped fallback in the site code,
  // so the two paths cannot disagree about group order. See lib/menuGroups.js.
  const groups = buildMenuGroups(categories, content.menu_groups);

  // Manakish bundle tiers ("Manakish set of N"), discount escalates with size.
  const bundles = (tierResult.data ?? []).map((t) => ({
    tierCode: t.tier_code,
    label: t.label,
    discountPct: Number(t.discount_pct),
    manakishCount: t.bundle_manakish_count,
    sauceCount: t.bundle_sauce_count,
  }));

  // The customer site shows emoji-free text only. Source data keeps emojis
  // for the admin panel + Loyverse POS, so strip them here — the single
  // boundary where all Supabase menu data is assembled. (See lib/text.js.)
  // Translations are optional: if they fail to load, the menu still renders in
  // English rather than not at all.
  const translations = trResult.data ?? [];

  return { menu: deepStripEmoji({ dishes, categories, groups, content, bundles }), translations };
}

// A hung request is the failure mode this site is most exposed to: Russian ISPs
// throttle the CDN in front of Supabase, and a throttled socket does not reject,
// it just never answers.
//
// Since the build-time snapshot (MC 46810edc) the guest never waits on it: the
// page paints from /menu-snapshot.json and this fetch only REVALIDATES, so it gets
// a short deadline and one attempt — if fresher data does not arrive in time the
// snapshot simply stays. Only when NO snapshot exists (vite dev, or a deployment
// predating the snapshot) does the old behaviour apply: 3 attempts x 8 s, then the
// "menu is temporarily unavailable" state.
const REVALIDATE_TIMEOUT_MS = 3000;
const NO_SNAPSHOT_TIMEOUT_MS = 8000;

/** One bounded live fetch. Rejects on timeout, HTTP error, or invalid/empty data. */
async function fetchLive(timeoutMs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const raw = await fetchRawFromSupabase(ac.signal);
    const problems = validateRaw(raw);
    if (problems.length) throw new Error(`live menu rejected: ${problems.join("; ")}`);
    return raw;
  } catch (err) {
    if (ac.signal.aborted) throw new Error(`menu fetch timed out after ${timeoutMs}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function useMenu() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Anything rendered yet (snapshot or live)? Refs, not state: load() is re-entrant
  // (realtime events in dev) and must see the latest value without re-creating itself.
  const haveData = useRef(false);
  const liveWon = useRef(false);

  const show = useCallback((raw, source) => {
    // Title Case is an English rule (lib/text.js) — applied to the English
    // payload BEFORE translations are laid over it, never to other languages.
    const { menu, translations } = buildMenu(raw);
    const localized = localizeMenu(titleCaseMenu(menu), translations);
    if (typeof window !== "undefined") window.__SHISHKA_MENU_SOURCE__ = source;
    // Next load paints this instead of the shipped defaults (see App.jsx).
    writeCachedContent(LANG, localized.content);
    haveData.current = true;
    setData(localized);
    setError(null);
    setLoading(false);
  }, []);

  const load = useCallback(async () => {
    if (!haveData.current) setLoading(true);

    // No credentials configured — the documented offline development path.
    // This is the ONLY branch allowed to render MOCK_DATA: in production those
    // are hardcoded prices, and a guest shown ฿59 for a ฿79 dish is an argument
    // at the counter plus the margin lost on every order in between.
    if (!hasSupabase) {
      if (typeof window !== "undefined") window.__SHISHKA_MENU_SOURCE__ = "mock";
      // Single chokepoint: render all display copy in Title Case (hero kept as-is).
      const mock = { ...MOCK_DATA, content: DEFAULT_CONTENT };
      mock.groups = buildMenuGroups(mock.categories, DEFAULT_CONTENT.menu_groups);
      setData(localizeMenu(titleCaseMenu(mock), []));
      setLoading(false);
      return;
    }

    // 1. Snapshot, in parallel with the live request below. Never blocks it and is
    //    ignored if live data already won the race.
    const snapshotP = loadSnapshot(import.meta.env.BASE_URL || "/").then((snap) => {
      if (snap && !liveWon.current) {
        show({ ...snap.raw, translations: snap.raw.translations[LANG] ?? [] }, "snapshot");
      }
      return snap;
    });

    // 2. Live revalidation. First attempt is short; the snapshot (if any) covers a miss.
    let lastErr;
    try {
      const raw = await fetchLive(REVALIDATE_TIMEOUT_MS);
      liveWon.current = true;
      show(raw, "live");
      return;
    } catch (err) {
      lastErr = err;
    }

    const snap = await snapshotP;
    if (snap || haveData.current) {
      // The snapshot is on screen. Say so quietly; the guest sees a full menu.
      console.warn("menu revalidation failed, keeping the snapshot:", lastErr?.message ?? lastErr);
      setLoading(false);
      return;
    }

    // No snapshot: Russian ISPs throttle the CDN in front of Supabase, so one failed
    // fetch is expected noise. Retry before giving up — but never substitute
    // invented prices for real ones.
    for (let attempt = 2; attempt <= 3; attempt++) {
      await new Promise((r) => setTimeout(r, 600 * (attempt - 1)));
      try {
        const raw = await fetchLive(NO_SNAPSHOT_TIMEOUT_MS);
        liveWon.current = true;
        show(raw, "live");
        return;
      } catch (err) {
        lastErr = err;
      }
    }

    console.error("Menu fetch failed after 3 attempts:", lastErr);
    if (typeof window !== "undefined") window.__SHISHKA_MENU_SOURCE__ = "error";
    if (!haveData.current) {
      setData(null);
      setError(lastErr);
    }
    setLoading(false);
  }, [show]);

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

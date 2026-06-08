import { useState, useEffect, useCallback } from "react";
import { supabase, hasSupabase } from "../lib/supabase.js";
import { MOCK_DATA } from "../lib/mockData.js";
import { DEFAULT_CONTENT, mergeContent } from "../lib/content.js";
import { deepStripEmoji } from "../lib/text.js";
import { dishFloor } from "../lib/modifiers.js";

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
        section_id, section_name, section_sort_order
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
      .select("dish_id, group_name, group_sort, group_min_select, group_max_select, option_name, option_emoji, price_delta, is_default, sort_order"),

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

    const modifierGroups = modifiersFor(d.id);
    const price = d.price != null ? Number(d.price) : null;
    return {
      id: d.id,
      name: d.customer_short_name || d.name,
      description: d.customer_description ?? null,
      ingredients: d.customer_ingredients ?? null,
      modifierGroups,
      price,
      // "From ฿X" floor for build-your-own dishes (a required modifier group):
      // base + cheapest mandatory add-ons. null for ordinary fixed-price dishes.
      priceFrom: dishFloor(price, modifierGroups),
      image_url: d.customer_photo_url ?? d.image_url ?? null,
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
      category_name: d.category_name ?? null,
      // Section (umbrella) the dish groups under + its subcategory (leaf).
      section_id: sectionId,
      section_name: sectionName,
      subcategory_id: d.category_id ?? sectionId,
      subcategory_name: d.category_name ?? sectionName,
      subcategory_sort: d.category_sort_order ?? 0,
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

export function useMenu() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = hasSupabase
        ? await fetchFromSupabase()
        : { ...MOCK_DATA, content: DEFAULT_CONTENT };
      setData(result);
    } catch (err) {
      console.error("Menu fetch failed, using mock data:", err);
      setData({ ...MOCK_DATA, content: DEFAULT_CONTENT });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    if (!hasSupabase) return;

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

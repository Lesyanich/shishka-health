import { useState, useEffect, useCallback } from "react";
import { supabase, hasSupabase } from "../lib/supabase.js";
import { MOCK_DATA } from "../lib/mockData.js";
import { DEFAULT_CONTENT, mergeContent } from "../lib/content.js";

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
  const [dishResult, tagResult, contentResult, modResult] = await Promise.all([
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
        category_code, category_name, category_sort_order
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
      .select("dish_id, group_name, group_sort, option_name, option_emoji, price_delta, is_default, sort_order"),
  ]);

  if (dishResult.error) throw dishResult.error;

  // Build modifier map: dish_id → grouped builder options
  const modMap = new Map();
  for (const r of modResult.data ?? []) {
    if (!modMap.has(r.dish_id)) modMap.set(r.dish_id, new Map());
    const groups = modMap.get(r.dish_id);
    if (!groups.has(r.group_name)) {
      groups.set(r.group_name, { name: r.group_name, sort: r.group_sort ?? 0, options: [] });
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

  // Collect unique categories from dish rows
  const catMap = new Map();
  const dishes = (dishResult.data ?? []).map((d) => {
    const cat = d.category_id
      ? { id: d.category_id, code: d.category_code, name: d.category_name, sort_order: d.category_sort_order }
      : null;
    if (cat && !catMap.has(cat.id)) {
      catMap.set(cat.id, { id: cat.id, code: cat.code, name: cat.name, sort_order: cat.sort_order });
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

    return {
      id: d.id,
      name: d.customer_short_name || d.name,
      description: d.customer_description ?? null,
      ingredients: d.customer_ingredients ?? null,
      modifierGroups: modifiersFor(d.id),
      price: d.price != null ? Number(d.price) : null,
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
      category_name: cat?.name ?? null,
      diets,
      allergens,
      tags: allTags,
      badges,
    };
  });

  const categories = Array.from(catMap.values())
    .sort((a, b) => a.sort_order - b.sort_order);

  const content = mergeContent(contentResult.error ? [] : contentResult.data);

  return { dishes, categories, content };
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

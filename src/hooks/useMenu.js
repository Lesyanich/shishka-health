import { useState, useEffect, useCallback } from "react";
import { supabase, hasSupabase } from "../lib/supabase.js";
import { MOCK_DATA } from "../lib/mockData.js";

/*
  Schema reference: Lesyanich/shishka-os
    apps/admin-panel/src/hooks/useMenuDishes.ts
    apps/admin-panel/src/pages/menu/components/CustomerPreview.tsx

  Table: nomenclature
    Filter: product_code LIKE 'SALE-%' AND is_available = true
    Customer fields: customer_short_name (fallback name), customer_photo_url,
                     customer_description, calories, protein, carbs, fat,
                     portion_size, portion_unit
    Tags: nomenclature_tags → tags(slug, name, tag_group, color)
      tag_group !== 'allergen' → diets
      tag_group === 'allergen' → allergens

  Categories: product_categories (2 levels via parent_id)
    Collected from each dish's category_id join.

  RLS: anon key needs SELECT on nomenclature (SALE-% rows), nomenclature_tags,
       tags, and product_categories.
*/

async function fetchFromSupabase() {
  const [dishResult, tagResult] = await Promise.all([
    supabase
      .from("nomenclature")
      .select(`
        id, name, product_code,
        customer_short_name, customer_photo_url, customer_description,
        price, is_available, is_featured,
        calories, protein, carbs, fat,
        portion_size, portion_unit,
        category_id, display_order,
        product_categories!category_id(id, code, name, sort_order)
      `)
      .like("product_code", "SALE-%")
      .eq("is_available", true)
      .order("display_order", { ascending: true, nullsFirst: false }),

    supabase
      .from("nomenclature_tags")
      .select("nomenclature_id, tags(slug, name, tag_group, color)"),
  ]);

  if (dishResult.error) throw dishResult.error;

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
    const cat = d.product_categories;
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

    return {
      id: d.id,
      name: d.customer_short_name || d.name,
      description: d.customer_description ?? null,
      price: d.price != null ? Number(d.price) : null,
      image_url: d.customer_photo_url ?? null,
      is_featured: d.is_featured,
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
      badges: d.is_featured ? [{ label: "Featured", tone: "gold" }] : [],
    };
  });

  const categories = Array.from(catMap.values())
    .sort((a, b) => a.sort_order - b.sort_order);

  return { dishes, categories };
}

export function useMenu() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = hasSupabase ? await fetchFromSupabase() : MOCK_DATA;
      setData(result);
    } catch (err) {
      console.error("Menu fetch failed, using mock data:", err);
      setData(MOCK_DATA);
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
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [load]);

  return { data, loading, error };
}

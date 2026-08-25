#!/usr/bin/env node
/**
 * Print the board's running order, straight from the live menu feed.
 *
 * The board is a wall screen nobody watches from a desk, so "does the order
 * read the way the CEO asked" is not something you want to discover by
 * standing in the restaurant. This renders the same reel `pickBoardDishes`
 * builds, as text, in about a second.
 *
 * USAGE  node scripts/board-order-check.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { pickBoardDishes, BOARD_RUNNING_ORDER } from "../src/lib/boardPicks.js";

const URL = "https://shishka.health/sb";
const KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!KEY) {
  console.error("Set VITE_SUPABASE_ANON_KEY (see .env) before running this.");
  process.exit(1);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const { data, error } = await sb
  .from("menu_public")
  .select(
    "id, name, product_code, customer_photo_url, image_url, price, " +
      "customer_description, customer_ingredients, calories, stock_state, " +
      "section_id, section_name, display_order, is_featured",
  )
  .order("display_order", { ascending: true, nullsFirst: false });

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

// Mirror the few fields useMenu derives that pickBoardDishes actually reads.
const dishes = data.map((d) => ({
  ...d,
  cardImage: d.customer_photo_url ?? d.image_url ?? null,
  description: d.customer_description,
  ingredients: d.customer_ingredients,
  comingSoon: (d.stock_state ?? "in_stock") !== "in_stock",
}));

const reel = pickBoardDishes(dishes, []);

const isSalad = (d) => /salad/i.test(d.section_name ?? "");
console.log(`\n${reel.length} slides · ${(reel.length * 8) / 60} min loop at 8s\n`);
reel.forEach((d, i) => {
  const tag = isSalad(d) ? "SALAD" : "     ";
  console.log(
    `${String(i + 1).padStart(2)}  ${tag}  ${d.name}  —  ${d.price} THB  (${d.section_name})`,
  );
});

// Anything the CEO asked for that the feed could not supply is the interesting
// failure: it means a dish is missing a photo, sold out, or was renamed.
const present = new Set(reel.map((d) => d.product_code));
const missing = BOARD_RUNNING_ORDER.filter((c) => !present.has(c));
if (missing.length) {
  console.log(`\n⚠ requested but NOT on the board (${missing.length}):`);
  for (const code of missing) {
    const row = data.find((d) => d.product_code === code);
    const why = !row
      ? "not in the live menu feed at all"
      : !(row.customer_photo_url ?? row.image_url)
        ? "no photo"
        : row.price == null
          ? "no price"
          : (row.stock_state ?? "in_stock") !== "in_stock"
            ? `stock_state = ${row.stock_state}`
            : "unknown";
    console.log(`    ${code} — ${why}`);
  }
}

// "all salads" is only as complete as the data allows, and the gap is always
// worth printing: a salad held back by a stale coming_soon flag looks
// identical to one we chose not to show.
const onBoard = new Set(reel.map((d) => d.id));
const heldBack = dishes.filter((d) => isSalad(d) && !onBoard.has(d.id));
console.log(`\nsalads on the board: ${reel.filter(isSalad).length}`);
if (heldBack.length) {
  console.log(`salads held back (${heldBack.length}):`);
  for (const d of heldBack) {
    const why = !d.cardImage
      ? "no photo"
      : d.price == null
        ? "no price"
        : d.comingSoon
          ? `stock_state = ${d.stock_state}  ← flip in admin to add it`
          : "unknown";
    console.log(`    ${d.name.split(" (")[0]} — ${why}`);
  }
}
console.log();

#!/usr/bin/env node
/*
  Build-time menu snapshot (MC 46810edc).

  Fetches every resource listed in contracts/menu-contract.json with the public
  anon key and writes public/menu-snapshot.json, which Vite ships with the
  deployment. The browser paints from it immediately and only then revalidates
  against Supabase (src/hooks/useMenu.js), so a slow or dead database can no
  longer blank the menu.

  Runs as `prebuild`. The failure policy is the point: if Supabase is down, a
  resource is empty, or a contract column is missing, this EXITS 1, the build
  fails, and Vercel keeps serving the previous deployment. An empty menu is never
  shipped. There is deliberately no skip flag.

  Plain PostgREST over fetch (no supabase-js) for the same Node 20 reason as
  scripts/aeo-prerender.mjs.

  Env (optional): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY — same names the
  prerender uses. SNAPSHOT_OUT overrides the output path (tests only).
*/
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SNAPSHOT_VERSION, SNAPSHOT_FILE, SNAPSHOT_LANGS, validateSnapshot, filterToDishes } from "../src/lib/menuSnapshot.js";
import { checkSnapshotAgainstContract } from "./snapshot-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(readFileSync(join(HERE, "..", "contracts", "menu-contract.json"), "utf8"));
const OUT = process.env.SNAPSHOT_OUT || join(HERE, "..", "public", SNAPSHOT_FILE);

const BASE = (process.env.VITE_SUPABASE_URL || contract.baseUrls[0]).replace(/\/$/, "");
// VITE_SUPABASE_ANON_KEY is what Vercel, supabase.js and aeo-prerender already use;
// SUPABASE_ANON_KEY is the name the contract comment / contract-check.mjs use. Accept both.
const KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || contract.anonKey;

// The snapshot is fetched with a key that ships in public JS. Refuse anything else — a
// service-role or secret key here would be a leak waiting to happen.
function assertAnonKey(key) {
  if (/^sb_secret_/.test(key)) throw new Error("key is an sb_secret_ key; only the anon/publishable key is allowed");
  if (key.startsWith("sb_publishable_")) return;
  let role;
  try { role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8")).role; } catch { /* below */ }
  if (role !== "anon") throw new Error(`key JWT role is "${role ?? "unreadable"}", expected "anon"`);
}
const TIMEOUT_MS = 20000;
const ATTEMPTS = 3;
const PAGE = 1000; // PostgREST's default max-rows

// Ordering the SPA applies in its own queries (useMenu.js) — the transform relies on it.
// Every order is TOTAL (ends in a unique-ish key) because we paginate with offset: a
// non-deterministic order can repeat or skip rows across pages.
const ORDER = {
  menu_public: "display_order.asc.nullslast,id.asc",
  nomenclature_tags: "nomenclature_id.asc,tag_id.asc",
  site_content: "key.asc",
  menu_modifiers: "dish_id.asc,group_sort.asc,group_name.asc,sort_order.asc,option_name.asc",
  price_tiers: "sort_order.asc,tier_code.asc",
  menu_translations: "entity.asc,entity_key.asc,field.asc",
};

async function getPage(path) {
  let last;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE}/rest/v1/${path}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        signal: ac.signal,
      });
      const body = await res.text();
      if (res.ok) return JSON.parse(body);
      last = new Error(`HTTP ${res.status} ${body.slice(0, 300)}`);
      if (res.status >= 400 && res.status < 500) throw last; // a real answer about the schema; do not retry
    } catch (err) {
      last = err;
      if (/^HTTP 4/.test(String(err.message))) throw err;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  throw last;
}

async function getAll(resource, queryOverride) {
  const r = contract.resources.find((x) => x.name === resource);
  if (!r) throw new Error(`contract has no resource "${resource}"`);
  const extraQuery = "";
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const q = [
      `select=${encodeURIComponent(r.select)}`,
      queryOverride ?? r.query,
      extraQuery,
      ORDER[resource] && `order=${ORDER[resource]}`,
      `limit=${PAGE}`,
      `offset=${offset}`,
    ].filter(Boolean).join("&");
    const page = await getPage(`${resource}?${q}`);
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

async function main() {
  // A stale file from an earlier run must never be mistaken for this run's output.
  rmSync(OUT, { force: true });

  assertAnonKey(KEY);

  const [dishes, allTags, content, allModifiers, tiers] = await Promise.all([
    getAll("menu_public"),
    getAll("nomenclature_tags"),
    getAll("site_content"),
    getAll("menu_modifiers"),
    getAll("price_tiers"),
  ]);

  // The contract pins menu_translations to lang=eq.ru; the other site languages
  // use the same view with their own lang value.
  const translations = {};
  for (const lang of SNAPSHOT_LANGS) translations[lang] = await getAll("menu_translations", `lang=eq.${lang}`);

  const snap = {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    // Only dishes on the menu: tags/modifiers of everything else (942 tag rows, 121 ours)
    // are neither needed nor ours to publish.
    raw: filterToDishes({ dishes, tags: allTags, content, modifiers: allModifiers, tiers, translations }),
  };
  const { tags, modifiers } = snap.raw;

  const problems = [...validateSnapshot(snap), ...checkSnapshotAgainstContract(snap, contract)];
  if (problems.length) {
    console.error("[snapshot] REFUSING to write a snapshot that breaks the contract:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(snap));
  const kb = (JSON.stringify(snap).length / 1024).toFixed(0);
  console.log(
    `[snapshot] ${OUT.replace(process.cwd() + "/", "")} — ${dishes.length} dishes, ${tags.length} tags, ` +
      `${content.length} content rows, ${modifiers.length} modifier rows, ${tiers.length} tiers, ` +
      `translations ${SNAPSHOT_LANGS.map((l) => `${l}:${translations[l].length}`).join(" ")} (${kb} KB; tags ${allTags.length}->${tags.length}, modifiers ${allModifiers.length}->${modifiers.length})`,
  );
}

main().catch((err) => {
  console.error(`[snapshot] build FAILED, no snapshot written: ${err.message}`);
  console.error("[snapshot] The build stops here so Vercel keeps serving the previous deployment.");
  process.exit(1);
});

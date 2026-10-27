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
import { SNAPSHOT_VERSION, SNAPSHOT_FILE, SNAPSHOT_LANGS, validateSnapshot } from "../src/lib/menuSnapshot.js";
import { checkSnapshotAgainstContract } from "./snapshot-check.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(readFileSync(join(HERE, "..", "contracts", "menu-contract.json"), "utf8"));
const OUT = process.env.SNAPSHOT_OUT || join(HERE, "..", "public", SNAPSHOT_FILE);

const BASE = (process.env.VITE_SUPABASE_URL || contract.baseUrls[0]).replace(/\/$/, "");
const KEY = process.env.VITE_SUPABASE_ANON_KEY || contract.anonKey;
const TIMEOUT_MS = 20000;
const ATTEMPTS = 3;
const PAGE = 1000; // PostgREST's default max-rows

// Ordering the SPA applies in its own queries (useMenu.js) — the transform relies on it.
const ORDER = {
  menu_public: "display_order.asc.nullslast",
  price_tiers: "sort_order.asc",
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

async function getAll(resource, extraQuery = "") {
  const r = contract.resources.find((x) => x.name === resource);
  if (!r) throw new Error(`contract has no resource "${resource}"`);
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const q = [
      `select=${encodeURIComponent(r.select)}`,
      r.query,
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

  const [dishes, tags, content, modifiers, tiers] = await Promise.all([
    getAll("menu_public"),
    getAll("nomenclature_tags"),
    getAll("site_content"),
    getAll("menu_modifiers"),
    getAll("price_tiers"),
  ]);

  // The contract pins menu_translations to lang=eq.ru; the other site languages
  // use the same view with their own lang value.
  const base = contract.resources.find((x) => x.name === "menu_translations");
  const translations = {};
  for (const lang of SNAPSHOT_LANGS) {
    const q = [`select=${encodeURIComponent(base.select)}`, `lang=eq.${lang}`, `limit=${PAGE}`].join("&");
    translations[lang] = await getPage(`menu_translations?${q}`);
  }

  const snap = {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    raw: { dishes, tags, content, modifiers, tiers, translations },
  };

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
      `translations ${SNAPSHOT_LANGS.map((l) => `${l}:${translations[l].length}`).join(" ")} (${kb} KB)`,
  );
}

main().catch((err) => {
  console.error(`[snapshot] build FAILED, no snapshot written: ${err.message}`);
  console.error("[snapshot] The build stops here so Vercel keeps serving the previous deployment.");
  process.exit(1);
});

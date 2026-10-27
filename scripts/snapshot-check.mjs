#!/usr/bin/env node
/*
  Snapshot vs contract check (MC 46810edc). Offline: reads a snapshot file and
  contracts/menu-contract.json, touches no network.

    node scripts/snapshot-check.mjs [path/to/menu-snapshot.json]   # default public/menu-snapshot.json

  Also imported by scripts/snapshot-menu.mjs, which runs it before writing the file.
  Asserts, per contract resource: minRows is met, and every top-level column named in
  `select` is present in the rows (embeds such as tags(...) are checked one level down).
  The contract's live-query `assertions` are covered by scripts/contract-check.mjs;
  the one that can be evaluated locally (no NULL price) is repeated by validateRaw().

  Exit 0 = snapshot non-empty and matches the contract, 1 = it does not.
*/
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSnapshot } from "../src/lib/menuSnapshot.js";

// contract resource -> key in snapshot.raw
const KEY_OF = {
  menu_public: "dishes",
  nomenclature_tags: "tags",
  site_content: "content",
  menu_modifiers: "modifiers",
  price_tiers: "tiers",
};

/** Split "a,b,tags(x,y)" on top-level commas -> [{col, inner|null}] */
function parseSelect(select) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of select) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur) out.push(cur);
  return out.map((s) => {
    const m = s.trim().match(/^(\w+)(?:\(([^)]*)\))?$/);
    return m ? { col: m[1], inner: m[2] ? m[2].split(",").map((x) => x.trim()) : null } : { col: s.trim(), inner: null };
  });
}

export function checkSnapshotAgainstContract(snap, contract) {
  const problems = [];
  for (const r of contract.resources) {
    const rows =
      r.name === "menu_translations" ? snap.raw?.translations?.ru : snap.raw?.[KEY_OF[r.name]];
    if (!Array.isArray(rows)) { problems.push(`${r.name}: missing from snapshot`); continue; }
    if (rows.length < (r.minRows ?? 0)) {
      problems.push(`${r.name}: ${rows.length} rows, contract requires at least ${r.minRows}`);
      continue;
    }
    if (!rows.length) continue;
    for (const { col, inner } of parseSelect(r.select)) {
      // Check every row, not just the first: PostgREST always emits all selected keys,
      // so a missing key means the snapshot was not produced from this contract.
      const missing = rows.filter((row) => !(col in row)).length;
      if (missing) problems.push(`${r.name}: column "${col}" missing in ${missing} row(s)`);
      if (inner) {
        const sample = rows.find((row) => row[col]);
        for (const c of inner) if (sample && !(c in sample[col])) problems.push(`${r.name}: ${col}.${c} missing`);
      }
    }
  }
  return problems;
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const file = process.argv[2] || join(HERE, "..", "public", "menu-snapshot.json");
  const contract = JSON.parse(readFileSync(join(HERE, "..", "contracts", "menu-contract.json"), "utf8"));
  let snap;
  try {
    snap = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`snapshot-check: cannot read ${file}: ${err.message}`);
    process.exit(1);
  }
  const problems = [...validateSnapshot(snap), ...checkSnapshotAgainstContract(snap, contract)];
  if (problems.length) {
    console.error(`snapshot-check: ${problems.length} problem(s) in ${file}`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  const r = snap.raw;
  console.log(
    `snapshot-check ok: ${r.dishes.length} dishes, ${r.tags.length} tags, ${r.content.length} content, ` +
      `${r.modifiers.length} modifiers, ${r.tiers.length} tiers, generated ${snap.generatedAt}`,
  );
}

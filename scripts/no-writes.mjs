#!/usr/bin/env node
/*
  Repo boundary guard.

  The rule is "whoever writes to the database is shishka-os; whoever only shows the
  guest is shishka-health". This script is what turns that sentence from a
  convention into an invariant: it fails the build if anything in this repo learns
  to write.

  Until 2026-07-28 the rule had exactly one exception — the menu-photo-sync edge
  function, which updated nomenclature.image_url with a service_role key from inside
  a public website repo. It has moved to shishka-os. This guard is here so the
  exception cannot quietly come back.

  Matching is deliberately narrow. A bare `.delete(` is not a finding: the cart uses
  Set.prototype.delete, and a check that cries wolf gets switched off. Only PostgREST
  and storage write chains count.

  Usage: node scripts/no-writes.mjs
*/

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCAN = ["src", "supabase", "api"];
const EXT = /\.(js|jsx|ts|tsx|mjs|cjs)$/;

const RULES = [
  {
    id: "postgrest-write",
    // .from("x").insert( — allowing newlines between the call and the verb
    re: /\.from\s*\(\s*["'`][^"'`]+["'`]\s*\)\s*(?:\/\/[^\n]*\n|\s)*\.\s*(insert|upsert|update|delete)\s*\(/g,
    why: "writes to a table. Data changes belong in shishka-os (migration, admin panel or an MCP tool).",
  },
  {
    id: "rpc-call",
    re: /\bsupabase\s*(?:\/\/[^\n]*\n|\s)*\.\s*rpc\s*\(/g,
    why: "calls a database function. An RPC can write; route it through shishka-os.",
  },
  {
    id: "storage-write",
    re: /\.storage\s*(?:\/\/[^\n]*\n|\s)*\.\s*from\s*\([^)]*\)\s*(?:\/\/[^\n]*\n|\s)*\.\s*(upload|remove|move|copy|createSignedUploadUrl)\s*\(/g,
    why: "writes to storage. Uploading belongs in shishka-os.",
  },
  {
    id: "service-role-key",
    re: /service_role|SERVICE_ROLE/g,
    why: "references the service-role key. This repo ships to the browser and must only ever hold the anon key.",
  },
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return; // directory absent is fine — supabase/ is expected to be gone
  }
  for (const name of entries) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXT.test(name)) yield full;
  }
}

const findings = [];
for (const base of SCAN) {
  for (const file of walk(join(ROOT, base))) {
    const text = readFileSync(file, "utf8");
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text)) !== null) {
        const line = text.slice(0, m.index).split("\n").length;
        findings.push({ file: relative(ROOT, file), line, id: rule.id, why: rule.why, snippet: m[0].replace(/\s+/g, " ").slice(0, 70) });
      }
    }
  }
}

if (findings.length) {
  console.error("This repo is read-only. Found write access:\n");
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  [${f.id}]`);
    console.error(`    ${f.snippet}`);
    console.error(`    ${f.why}\n`);
  }
  console.error(
    "See the Repo Boundary block in CLAUDE.md. If a guest-facing feature genuinely\n" +
      "needs to write, it does not belong in this repo — build it in shishka-os.",
  );
  process.exit(1);
}

console.log("Read-only: no database or storage writes found in src/.");

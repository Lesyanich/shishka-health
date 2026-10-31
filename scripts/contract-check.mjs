#!/usr/bin/env node
/*
  Menu contract check — meant to be the same file in shishka-health and shishka-os
  (the SKIPPED handling below exists in shishka-os first; mirror it to shishka-health).

  Asks production for exactly what src/hooks/useMenu.js asks for, column by column.
  A dropped or renamed column comes back as HTTP 400 naming it; tightened RLS comes
  back as 401 or an empty result; a renamed category trips a semantic assertion.

  No secret, no staging database, no local Supabase: the anon key is public and the
  contract is fetched over HTTPS, so this runs the same from either repo and from CI.

  Usage:
    node scripts/contract-check.mjs                 # every baseUrl in the contract
    node scripts/contract-check.mjs --base=https://shishka.health/sb
    node scripts/contract-check.mjs --contract=https://raw.githubusercontent.com/...
    node scripts/contract-check.mjs --json

  Exit code 0 = contract intact (or the database was unreachable — see below),
  1 = the live site is broken or about to be.

  SKIPPED probes: a probe that cannot reach the database is reported SKIPPED and is
  not a contract failure; it prints a ::warning:: and, in CI, a line in the step
  summary. If every probe is skipped the summary says nothing was verified. See
  isInfraFailure() for the exact rule.
*/

import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONTRACT = join(HERE, "..", "contracts", "menu-contract.json");
const REMOTE_CONTRACT =
  "https://raw.githubusercontent.com/Lesyanich/shishka-health/main/contracts/menu-contract.json";

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const asJson = args.includes("--json");
const TIMEOUT_MS = Number(flag("timeout") ?? 20000);
const ATTEMPTS = Number(flag("attempts") ?? 2); // one try + one retry
const BACKOFF_MS = Number(flag("backoff-ms") ?? 5000);

async function loadContract() {
  const explicit = flag("contract");
  if (explicit && /^https?:/.test(explicit)) return (await fetch(explicit)).json();
  const path = explicit ?? DEFAULT_CONTRACT;
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  // Running from shishka-os, where the contract belongs to the other repo.
  const res = await fetch(REMOTE_CONTRACT);
  if (!res.ok) throw new Error(`cannot fetch contract: HTTP ${res.status} ${REMOTE_CONTRACT}`);
  return res.json();
}

/** True when the text is a PostgREST error object ({code, message, details, hint}). */
function isPostgrestError(text) {
  try {
    const j = JSON.parse(text);
    return j !== null && typeof j === "object" && !Array.isArray(j) && ("code" in j || "message" in j);
  } catch {
    return false;
  }
}

/*
  Infrastructure vs contract. Only "the database could not be reached" is skipped:
    - status 0: network error, DNS, connection reset, our own timeout abort;
    - HTTP 502/503/504 or Cloudflare 520-529 whose body is NOT a PostgREST error
      object (the observed case is an HTML page "supabase.co | 522: Connection timed out").
  Everything else is a real answer from PostgREST and stays a failure: any 4xx, a 200
  with wrong content, and above all HTTP 500 with a JSON body — PostgREST answers a
  failed query that way (code 57014 statement timeout under anon's 3 s limit when
  menu_public turns slow, other SQL errors). That is exactly what this watch is for.
  A JSON-bodied 502/503/504 is also PostgREST speaking, so it fails too.
*/
function isInfraFailure(status, body) {
  if (status === 0) return true;
  const gateway = status === 502 || status === 503 || status === 504 || (status >= 520 && status <= 529);
  return gateway && !isPostgrestError(body);
}

/** One PostgREST read. Returns { ok, status, count, body, skipped }. One retry on 5xx / transport errors. */
async function probe(base, key, path) {
  const url = `${base.replace(/\/$/, "")}/rest/v1/${path}`;
  let last;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
        signal: ac.signal,
      });
      const body = await res.text();
      const count = Number(res.headers.get("content-range")?.split("/")[1] ?? NaN);
      // 4xx is a real answer about the schema — never retry it, that is the finding.
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return { ok: res.ok, status: res.status, count, body: body.slice(0, 400), skipped: false };
      }
      last = { ok: false, status: res.status, count: NaN, body, skipped: false };
    } catch (err) {
      last = { ok: false, status: 0, count: NaN, body: String(err.message ?? err), skipped: false };
    } finally {
      clearTimeout(timer);
    }
    if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, BACKOFF_MS));
  }
  last.skipped = isInfraFailure(last.status, last.body);
  last.body = (last.body.match(/<title>([^<]*)/i)?.[1] ?? last.body).trim().slice(0, 400);
  return last;
}

function skippedDetail(res) {
  return `SKIPPED (db unreachable) — ${res.status ? `HTTP ${res.status}` : "network"}: ${res.body}`;
}

async function checkBase(contract, base, key) {
  const results = [];

  for (const r of contract.resources) {
    const q = [`select=${encodeURIComponent(r.select)}`, r.query, "limit=1"].filter(Boolean).join("&");
    const res = await probe(base, key, `${r.name}?${q}`);
    const min = r.minRows ?? 0;
    let detail = "";
    let pass = res.ok;
    if (res.skipped) {
      detail = skippedDetail(res);
    } else if (!res.ok) {
      detail = `HTTP ${res.status || "network"} — ${res.body}`;
    } else if (Number.isFinite(res.count) && res.count < min) {
      pass = false;
      detail = `returned ${res.count} rows, expected at least ${min} (RLS or empty table)`;
    } else {
      detail = `${res.count} rows`;
    }
    results.push({ kind: "resource", id: r.name, pass, skipped: res.skipped, detail });
  }

  for (const a of contract.assertions) {
    const q = [a.query, "select=id", "limit=1"].filter(Boolean).join("&");
    const res = await probe(base, key, `${a.resource}?${q}`);
    let pass = res.ok;
    let detail = "";
    if (res.skipped) {
      detail = skippedDetail(res);
    } else if (!res.ok) {
      detail = `HTTP ${res.status || "network"} — ${res.body}`;
    } else if (a.min != null && res.count < a.min) {
      pass = false;
      detail = `matched ${res.count}, expected at least ${a.min} — ${a.why}`;
    } else if (a.max != null && res.count > a.max) {
      pass = false;
      detail = `matched ${res.count}, expected at most ${a.max} — ${a.why}`;
    } else {
      detail = `matched ${res.count}`;
    }
    results.push({ kind: "assertion", id: a.id, pass, skipped: res.skipped, detail });
  }

  return results;
}

let contract;
try {
  contract = await loadContract();
} catch (err) {
  console.error(`Could not load the menu contract: ${err.message}`);
  console.error(
    "It is canonical in the shishka-health repo at contracts/menu-contract.json and is read " +
      "from main over raw.githubusercontent.com. A 404 usually means the branch that adds it " +
      "has not been merged yet — merge shishka-health first, then this repo.",
  );
  process.exit(1);
}

const key = process.env.SUPABASE_ANON_KEY || contract.anonKey;
if (!key) {
  console.error("No anon key: set SUPABASE_ANON_KEY or add anonKey to the contract.");
  process.exit(1);
}

const bases = flag("base") ? [flag("base")] : contract.baseUrls;
const report = {};
let failed = 0;
const skipped = [];
let total = 0;

for (const base of bases) {
  const results = await checkBase(contract, base, key);
  report[base] = results;
  total += results.length;
  failed += results.filter((r) => !r.pass && !r.skipped).length;
  for (const r of results) if (r.skipped) skipped.push({ base, ...r });

  if (!asJson) {
    console.log(`\n${base}`);
    for (const r of results) {
      const tag = r.skipped ? "SKIP" : r.pass ? "ok  " : "FAIL";
      console.log(`  ${tag}  ${r.id.padEnd(24)} ${r.detail}`);
    }
  }
}

if (asJson) console.log(JSON.stringify(report, null, 2));

// Make a skipped probe impossible to miss: an annotation per probe, plus the job summary.
for (const r of skipped) {
  console.error(`::warning title=Menu contract probe skipped::${r.id} on ${r.base} — ${r.detail}`);
}
if (skipped.length && process.env.GITHUB_STEP_SUMMARY) {
  const verified = total - skipped.length;
  const lines = [
    "### Menu contract watch",
    skipped.length === total
      ? `⚠️ All ${total} probes were SKIPPED (db unreachable): **nothing was verified this run.**`
      : `⚠️ ${skipped.length} of ${total} probes SKIPPED (db unreachable); ${verified} verified` +
        (failed ? ` — ${failed} of them FAILED.` : ", no contract failure."),
    ...skipped.map((r) => `- \`${r.id}\` (${r.base}): ${r.detail}`),
    "",
  ];
  try {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  } catch (err) {
    console.error(`Could not write the step summary: ${err.message}`);
  }
}

if (failed) {
  console.error(
    `\n${failed} contract check(s) failed. The public menu at shishka.health depends on these ` +
      `objects; it fails by showing stale prices, not by erroring. Fix the database or update ` +
      `contracts/menu-contract.json in the shishka-health repo.`,
  );
  process.exit(1);
}

if (skipped.length && skipped.length === total) {
  console.log(`\nNothing was verified: all ${total} probe(s) were skipped (db unreachable).`);
} else {
  console.log(
    `\nContract intact across ${bases.length} endpoint(s)` +
      (skipped.length ? ` (${skipped.length} probe(s) skipped, db unreachable).` : "."),
  );
}

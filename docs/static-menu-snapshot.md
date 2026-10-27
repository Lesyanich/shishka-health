# Static menu snapshot (MC 46810edc)

**Problem.** The public menu is a SPA that fetched `menu_public` & co. from Supabase on every
page load. When the database stalled (2026-10-16 outage and two later stalls) shishka.health
rendered "The menu is temporarily unavailable" — a DB outage became a site outage.

**Fix.** The menu is baked into each deployment. The database is only asked for *fresher* data.

## How it works

1. **Build** — `npm run build` runs `prebuild` -> `scripts/snapshot-menu.mjs`. It reads every
   resource in `contracts/menu-contract.json` (`menu_public`, `nomenclature_tags`, `site_content`,
   `menu_modifiers`, `price_tiers`, `menu_translations` for ru/th/ar) with the public anon key and
   writes `public/menu-snapshot.json` (gitignored, ~0.5 MB, ~80 KB gzipped). Vite ships it as
   `/menu-snapshot.json`.
2. **Fail closed** — the script exits 1 (so the build fails and **Vercel keeps serving the previous
   deployment**) when: Supabase is unreachable after 3 attempts, any HTTP error, a resource is
   below its `minRows`, a selected column is missing, `menu_public` has a dish without id/name/price
   or duplicate ids. There is no skip flag. (`aeo-prerender.mjs` already fails the same way.)
3. **Runtime** — `src/hooks/useMenu.js`:
   - `index.html` preloads `/menu-snapshot.json`; the hook paints from it immediately;
   - in parallel it asks Supabase (through the `/sb` proxy) with an `AbortController`, 4 s deadline (two sequential round trips),
     one attempt;
   - the live answer replaces the snapshot **atomically for the menu**: dishes + tags + modifiers (+
     translations for non-English pages) are one unit, because tags carry allergens and modifiers carry
     "From X" prices — live dishes over snapshot tags would show a dish as allergen-free. Live replaces
     the snapshot menu only if ALL parts are valid (not errored, at least the contract `minRows` —
     `MIN_ROWS`, asserted equal to the contract by `snapshot-check` — not exactly 1000 rows i.e.
     probably truncated, and dishes at least 50% of the snapshot's count). Otherwise the whole snapshot
     menu stays. `site_content` and `price_tiers` are independent (each keeps its snapshot rows on
     failure; defaults from a failed call are never written to the content cache);
   - live tags and modifiers are requested only for the live dishes' ids (`.in(...)`, 100 ids per
     request, ~4 KB URL), after the dishes arrive — so they cannot creep into PostgREST's max-rows;
   - a snapshot paint never replaces data already on screen, and a throw while painting the snapshot
     degrades to the no-snapshot path instead of an endless spinner;
   - a generation counter makes an older `load()` ignore its results; requests are aborted on unmount;
   - "menu is temporarily unavailable" can only appear when there is **no snapshot at all**
     (vite dev, or a deployment that predates this change); that path keeps the old 3 x 8 s retry and
     requires live dishes, tags and modifiers.
   - `window.__SHISHKA_MENU_SOURCE__` is `snapshot` (dishes from the snapshot), `live` (dishes from the
     live answer), `mock` (no credentials, dev only) or `error` (no snapshot and live failed);
     `window.__SHISHKA_MENU_KEPT__` lists the resources that kept snapshot rows.
4. **CI** — the `build` job runs `npm run build` (prebuild = the snapshot gate) and then
   `node scripts/snapshot-check.mjs dist/menu-snapshot.json` on the shipped artifact (non-empty, every
   contract resource and selected column present, ru/th/ar translations non-empty, tags/modifiers only
   for menu_public dishes). The `contract` job (`contract-check.mjs`, live queries incl. assertions)
   is unchanged.
5. **Data minimisation** — tags and modifiers are filtered to `menu_public` dish ids before writing
   (942 -> 121 tag rows). All paged queries use a total `order` so offset pagination is deterministic.
6. **Single read per build** — `aeo-prerender.mjs` reads `dist/menu-snapshot.json` instead of fetching
   again (its live fetch remains the fallback for a stand-alone `npm run aeo`).
7. **Key guard** — the script refuses a key whose JWT role is not `anon` or that starts with
   `sb_secret_`. It reads `VITE_SUPABASE_ANON_KEY` (what Vercel, `supabase.js` and the prerender use),
   then `SUPABASE_ANON_KEY` (the name in the contract comment), then the contract's `anonKey`.

## Build-time fallback to the last production snapshot (CEO-approved)

If the database is **unreachable at build time**, `prebuild` ships the last good production snapshot
instead of failing, so code-only changes can still deploy during a DB outage. Rules
(`scripts/snapshot-menu.mjs`):

- Only when the fetch fails after its 3 attempts for **network error, timeout or HTTP 5xx**. A 4xx
  (schema/auth), an invalid anon key, a contract mismatch, or invalid/empty data from a reachable
  database still **fail the build** — no fallback.
- It downloads `https://shishka.health/menu-snapshot.json` (override: `SNAPSHOT_FALLBACK_URL`, used for
  tests), runs `validateSnapshot` + the contract check on it, and **refuses if `generatedAt` is older
  than 48 h** (`SNAPSHOT_FALLBACK_MAX_AGE_HOURS`, default 48). A missing/invalid fallback fails the build
  as before.
- The file is written with `stale: true` and `staleSince`, and its **original `generatedAt` is never
  refreshed**, so a chain of fallbacks cannot extend its life: after 48 h the build fails again.
- The build log carries a loud banner plus a GitHub-style `::warning title=Stale menu snapshot::`
  line. Look for `STALE MENU SNAPSHOT` in the Vercel build log.
- Runtime: a `stale` snapshot is painted and logged (`menu snapshot is STALE`), and live revalidation
  runs as usual.
- The very first production deploy of this feature has no `/menu-snapshot.json` to fall back to (404 ->
  build fails); the fallback exists from the second successful deploy on.

## Trade-off: freshness

A price/photo/availability change is **not visible on the site until the next deploy** — except for
guests whose browser reaches Supabase within 4 s, who get live data over the snapshot. Hence the
rebuild trigger below. Without it the worst-case staleness is "until someone pushes to main".

## Rebuild trigger (spec — the OS-side half is NOT built in this repo)

Vercel project `shishka-web` -> Settings -> Git -> **Deploy Hooks** -> create `menu-changed`
(branch `main`). The hook is a secret URL (`https://api.vercel.com/v1/integrations/deploy/...`);
store it as a Supabase edge-function secret, never in a repo. `POST` it (empty body) to build the
latest `main`.

**Budget.** Vercel rate-limits builds after ~8/day on this plan; hard cap 100 deploys/day
(see shishka-os `gotcha_vercel_100_deploys_per_day`). Menu edits arrive in bursts (a chef edits 20
dishes in 10 minutes), so the caller MUST debounce:

- on a menu change, record `menu_dirty_at = now()`; do not call the hook yet;
- a scheduled job (pg_cron calling a one-line function, per the DB-hygiene rules) every 5 min:
  if `menu_dirty_at` is set AND no change for >= 5 min (quiet period) AND last hook call >= 30 min
  ago (floor) -> POST the hook, clear `menu_dirty_at`, store `last_hook_at`;
- hard daily cap in the same function (e.g. <= 6 hook calls per UTC day); changes beyond it wait
  for the next day or a manual button press;
- what counts as a change: `nomenclature` (price, name, photo, is_web_visible, stock_state),
  `nomenclature_tags`, `menu_modifiers` sources, `site_content`, `price_tiers`,
  translations. Filter on those columns, not on every UPDATE (cost/WAC updates fire constantly).
- log every call (status code, deployment id) to a journal table with a `log_retention_policy` row.

Failure of the hook is harmless: the site keeps the previous snapshot and live-revalidates.

## Local verification recipe

```
npm run build                 # snapshot + vite + aeo
# serve dist/ with /sb proxied to a black hole (10.255.255.1) -> menu must still render from the snapshot
# serve dist/ with /sb proxied to Supabase                    -> __SHISHKA_MENU_SOURCE__ === "live"
npm run snapshot:check        # offline contract check of public/menu-snapshot.json
```

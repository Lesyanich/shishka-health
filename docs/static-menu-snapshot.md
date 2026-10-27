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
   - fetches `/menu-snapshot.json` (same origin, static) and paints from it immediately;
   - in parallel asks Supabase (through the `/sb` proxy) with an `AbortController`, 3 s deadline,
     one attempt. If valid data arrives it replaces the snapshot; if not, the snapshot stays;
   - live data is validated by the same `validateRaw()` (`src/lib/menuSnapshot.js`) — an empty or
     partial answer never replaces a good snapshot;
   - "menu is temporarily unavailable" can only appear when there is **no snapshot at all**
     (vite dev, or a deployment that predates this change); that path keeps the old 3 x 8 s retry.
   - `window.__SHISHKA_MENU_SOURCE__` is `snapshot` or `live` (was `live`/`mock`/`error`).
4. **CI** — `.github/workflows/verify.yml` job `snapshot` fetches a snapshot and runs
   `scripts/snapshot-check.mjs` (non-empty + matches the contract). Existing `contract` job
   (`contract-check.mjs`, live queries incl. assertions) is unchanged.

## Trade-off: freshness

A price/photo/availability change is **not visible on the site until the next deploy** — except for
guests whose browser reaches Supabase within 3 s, who get live data over the snapshot. Hence the
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

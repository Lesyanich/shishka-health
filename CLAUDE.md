# CLAUDE.md — Shishka Web (shishka.health)

Customer-facing menu site. React 18 + Vite, **pure CSS variables** (no Tailwind, no CSS-in-JS).
This is the canonical home of the Shishka brand design.

<!-- REPO-BOUNDARY-BLOCK: keep byte-identical in shishka-os/CLAUDE.md and shishka-health/CLAUDE.md -->
## Repo Boundary
Two repos, one Supabase project (`qcqgtcsjoacuktcewpvo`):
- **`shishka-os`** — everything that *writes*: migrations, admin panel, KDS, MCP services, agents.
- **`shishka-health`** — reads only: the public menu at shishka.health + the brand design system.

**Rule: whoever writes to the database is OS; whoever only shows the guest is HEALTH.**
Unsure → OS. A new field is always born in OS (migration) and only then rendered in HEALTH.

- Dish price, photo, composition → *neither repo*: admin panel or `/chef`. That is data, not code.
- Site copy in `site_content` → data lives in the DB; only the fallback defaults are HEALTH code.
- The team (`/chef`, `/finance`, `/procurement`, `/strategy`, `/techlead`) lives in OS only.
- The DB contract HEALTH depends on: `contracts/menu-contract.json`, canonical in the HEALTH repo.
<!-- /REPO-BOUNDARY-BLOCK -->

## Language Contract
Conversation in the human's language (CEO → Russian). Storage — code, commits, CSS, docs — **English only**.

## Design System (MANDATORY — read before ANY front-end work)
- **Living style guide:** `design-system/index.html` — open it in a browser. Every `.shk-*` component
  (buttons, badges, tabs, cards, hero, order FAB, dialog) rendered live, with its className recipe and
  source file. It links the real `src/styles/` CSS, so it **cannot drift** from production.
- **Rules & a11y contract:** `design-system/MASTER.md` — brand palette, typography, component contract,
  anti-patterns, pre-delivery checklist. MASTER is the authority.
- **The contract:**
  1. Check `design-system/index.html` + `MASTER.md` before touching UI. Reuse a `.shk-*` primitive; don't reinvent.
  2. Reference **semantic tokens**, never raw hex (`var(--accent)`, `var(--royal-green)`, `var(--menu-price)`).
  3. **Every PR that touches UI updates `design-system/index.html` in the same commit** — new component or
     variant → new section in the guide. Design system and code ship together.

## Design Tokens (source of truth)
`src/styles/tokens/` — `colors.css` · `fonts.css` · `typography.css` · `spacing.css` (radii/shadow/motion) ·
`theme-royal.css` (dark royal-green theme, imported last so it wins). Components: `src/styles/components.css`.
Brand: royal-green `#1E3903` canvas · cream `#FBF8F0` text · spice-red `#B62A23` CTA · gold `#F0CE83` prices ·
SF Pro / Albert Sans · "from the SOIL to the SOUL".

## Git
- Never commit to `main`. Branch `feature/web/<description>`.
- Conventional commits in English. Preview locally before push (CEO reviews a link first).

## Cross-project note
**Brand** — the palette, typography and voice a guest sees — is owned here and nowhere else.
The admin panel (`shishka-os`) derives brand hues from it into its Tailwind v4 `@theme`.

The admin's own working surfaces, borders and motion are a *different* set, documented in
`shishka-os/agents/designer/admin-ui-tokens.md`. Those are application tokens, not brand tokens,
and they are not required to match this file surface for surface. Changing a brand colour starts here.

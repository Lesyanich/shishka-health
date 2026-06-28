# CLAUDE.md — Shishka Web (shishka.health)

Customer-facing menu site. React 18 + Vite, **pure CSS variables** (no Tailwind, no CSS-in-JS).
This is the canonical home of the Shishka brand design.

## Language Contract
Conversation in the human's language (CEO → Russian). Storage — code, commits, CSS, docs — **English only**.

## Design System (MANDATORY — read before ANY front-end work)
- **Living style guide:** `design-system/index.html` — open it in a browser. Every `.shk-*` component
  (buttons, badges, tabs, cards, hero, order FAB, dialog) rendered live, with its className recipe and
  source file. It links the real `src/styles/` CSS, so it **cannot drift** from production.
- **Rules & a11y contract:** `design-system/MASTER.md` — brand palette, typography, component contract,
  anti-patterns, pre-delivery checklist. MASTER is the authority; per-page overrides in `design-system/pages/`.
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
This brand DS is the target for re-skinning the **admin panel** (`shishka-os` repo). When that work starts,
the token block here is ported into the admin's Tailwind v4 `@theme`. Keep this guide the single source of truth.

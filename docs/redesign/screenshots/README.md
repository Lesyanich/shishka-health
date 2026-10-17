# PR 3 review screenshots

Captured from the real page against live `menu_public` data on 2026-10-17, at the
three widths MASTER.md's checklist asks for. They exist so the PR body can show
them; the CEO reviews the moving thing on the Vercel preview, not these.

| File | What it shows |
|---|---|
| `pr3-mobile-375.jpg` | 375px, top of the page: header, lede, sticky rail, EAT eyebrow, Salads, the filter row and two dish photos — all above the fold. The first photo is at **360px**; before this PR it was at 910px. |
| `pr3-dish-sheet-375.jpg` | 375px, the dish sheet opened from a cold `?dish=` link: photo, name + price, weight, description, macros, and the pinned quantity bar. |
| `pr3-desktop-1024.jpg` | 1024px: sticky left nav grouped EAT / DRINK / SWEET, two content columns, sticky order panel and Visit us on the right. |
| `pr3-desktop-1440.jpg` | 1440px: the spec's `220px \| 1fr \| 320px` exactly, three `grid-full` cards with macros, weight, allergens and Add inline — and no dish dialog (§4.5). |

Retake them when the page changes shape; a stale screenshot in a PR is worse
than none.

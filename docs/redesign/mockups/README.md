# Mockups

HTML sources of the four approved screens, exported from the "Shishka first screen: A vs B" design canvas.

| File | Screen | Frame |
|---|---|---|
| `A2-home-full.dc.html` | Mobile home, full scroll | 390 × 1440 |
| `A2-cat-grid.dc.html` | Mobile category, 2-column grid | 390 × 844 |
| `A2-dish.dc.html` | Mobile dish bottom sheet | 390 × 844 |
| `D-category.dc.html` | Desktop menu (first screen) | 1440 × 1300 |

These are reference files, not app code. They use the canvas runtime (`support.js`, `{{…}}` templating,
`<sc-for>`) and image URLs (`/_blob/…`) that only resolve inside the canvas, so they will not render
when opened directly. Read them for sizes, spacing, hierarchy and copy; build the real components with
the `.shk-*` primitives and tokens. Images in the app come from Supabase as today.

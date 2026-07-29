/*
  The produce library: every fruit, vegetable, nut and seed on the site, drawn
  as SVG.

  Shared by two surfaces: the fixed scatter behind the hero copy
  (FruitConfetti.jsx) and the falling, sliceable layer that runs over the whole
  site (FruitFall.jsx). One source of truth so a colour fix lands in both.

  Drawn rather than photographed because they render at a dozen different sizes
  — a bitmap would either band on the big ones or ship a dozen crops.

  ---------------------------------------------------------------------------
  ONE ROW PER ITEM
  ---------------------------------------------------------------------------
  Everything an item needs lives on its row in PRODUCE: the drawing, what it's
  worth when sliced, the juice it throws, how big it spawns and how often. The
  flat maps below (SLICE_ART, JUICE, SCORE…) are derived from it, never hand-
  maintained — with sixty items, four parallel maps would drift within a week.

  ---------------------------------------------------------------------------
  THE 100×100 RULE
  ---------------------------------------------------------------------------
  Every item is authored to fill a 100×100 box centred on (50,50). Most are
  literal circles — the top-down "cut through the middle" view — so they read as
  one set, and so the falling layer can treat any item as a circle of radius 50
  for hit detection without special-casing a single one.

  Nuts and seeds are not circular, and they don't get an exception: they are
  drawn large enough to fill the same box, and `scale` shrinks the box instead.
  So a sesame scatter is small on screen because its slot is small, not because
  the drawing is small in its box — and the one hit-detection rule still holds.
*/

/* ═══════════════════════ drawing helpers ═══════════════════════ */

// Evenly spaced spokes between two radii, used for citrus segment walls and
// the pale striations in kiwi/strawberry/radish flesh.
function spokes(count, r1, r2, phase = 0) {
  return Array.from({ length: count }, (_, i) => {
    const a = ((i / count) * 360 + phase) * (Math.PI / 180);
    return (
      <line
        key={i}
        x1={(50 + Math.cos(a) * r1).toFixed(1)}
        y1={(50 + Math.sin(a) * r1).toFixed(1)}
        x2={(50 + Math.cos(a) * r2).toFixed(1)}
        y2={(50 + Math.sin(a) * r2).toFixed(1)}
      />
    );
  });
}

// Copies of one shape placed around the centre. The shape is authored once at
// twelve o'clock and rotated into place, so it always tilts to face the middle.
function orbit(count, phase, render) {
  return Array.from({ length: count }, (_, i) => (
    <g key={i} transform={`rotate(${((i / count) * 360 + phase).toFixed(1)} 50 50)`}>{render(i)}</g>
  ));
}

// Concentric rings from the rim inwards, evenly spaced — beetroot, onion,
// carrot. Outermost colour first.
function conc(colors) {
  const n = colors.length;
  return colors.map((c, i) => (
    <circle key={i} cx="50" cy="50" r={((49 * (n - i)) / n).toFixed(1)} fill={c} />
  ));
}

// Small items authored as a handful rather than as one specimen: a single
// sesame seed would be a speck, but a scatter of them reads instantly — and
// still splits cleanly when the cut runs through it.
function cluster(spots, render) {
  return spots.map(([x, y, rot], i) => (
    <g key={i} transform={`translate(${x} ${y}) rotate(${rot ?? 0})`}>{render(i)}</g>
  ));
}

/* ═══════════════════════ family templates ═══════════════════════ */

// Lemon, lime, orange, grapefruit… — same anatomy, different palette.
function citrus(rind, pith, flesh, segments = 9) {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill={rind} />
      <circle cx="50" cy="50" r="43" fill={pith} />
      <circle cx="50" cy="50" r="38" fill={flesh} />
      <g stroke={pith} strokeWidth="2.6" strokeLinecap="round">{spokes(segments, 4, 37)}</g>
      <circle cx="50" cy="50" r="4.5" fill={pith} />
    </>
  );
}

// Apple / pear: skin ring, flesh, and the five-petal core with a seed in each.
function pome(skin, flesh, seed, core = "#F0E4C0") {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill={skin} />
      <circle cx="50" cy="50" r="44" fill={flesh} />
      {orbit(5, 0, () => <ellipse cx="50" cy="33" rx="7.5" ry="12" fill={core} />)}
      {orbit(5, 0, () => <ellipse cx="50" cy="32" rx="2.4" ry="3.8" fill={seed} />)}
      <circle cx="50" cy="50" r="4" fill={core} />
    </>
  );
}

// Peach, plum, apricot, mango, cherry: skin, flesh, and a stone in the middle.
function stone(skin, flesh, pit, pitR = 17, grain) {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill={skin} />
      <circle cx="50" cy="50" r="45" fill={flesh} />
      <circle cx="50" cy="50" r={pitR} fill={pit} />
      {grain && (
        <g stroke={grain} strokeWidth="1.3" strokeLinecap="round" opacity="0.75">
          {spokes(9, pitR * 0.25, pitR * 0.82)}
        </g>
      )}
    </>
  );
}

// Courgette, cucumber, pumpkin — rind, flesh, seed cavity, seeds.
function gourd(rind, flesh, inner, seed, seedCount = 6) {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill={rind} />
      <circle cx="50" cy="50" r="44" fill={flesh} />
      <circle cx="50" cy="50" r="31" fill={inner} />
      {orbit(seedCount, 15, () => (
        <>
          <ellipse cx="50" cy="34" rx="3.4" ry="5" fill={seed} />
          <ellipse cx="50" cy="34" rx="1.5" ry="2.6" fill={flesh} opacity="0.7" />
        </>
      ))}
      <circle cx="50" cy="50" r="5" fill={seed} />
    </>
  );
}

// A pepper or chilli: flesh ring, hollow cavity, chamber walls, seeds on the
// placenta in the middle.
function capsicum(skin, flesh, cavity, wall, seed, chambers = 3) {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill={skin} />
      <circle cx="50" cy="50" r="41" fill={cavity} />
      {orbit(chambers, 0, () => <ellipse cx="50" cy="27" rx="9" ry="14" fill={wall} />)}
      {orbit(chambers * 3, 12, () => <ellipse cx="50" cy="36" rx="2.3" ry="3.1" fill={seed} />)}
      <circle cx="50" cy="50" r="8" fill={flesh} />
    </>
  );
}

// Pomegranate, raspberry: three rings of juice-filled beads.
function beads(rind, pith, bead, hi) {
  return (
    <>
      <circle cx="50" cy="50" r="49" fill={rind} />
      <circle cx="50" cy="50" r="44" fill={pith} />
      {orbit(12, 0, () => <circle cx="50" cy="16" r="4.8" fill={bead} />)}
      {orbit(9, 20, () => <circle cx="50" cy="27" r="4.6" fill={bead} />)}
      {orbit(5, 40, () => <circle cx="50" cy="38" r="4.4" fill={bead} />)}
      {orbit(12, 0, () => <circle cx="48" cy="14" r="1.5" fill={hi} opacity="0.6" />)}
      <circle cx="50" cy="50" r="4.2" fill={bead} />
    </>
  );
}

/* ═══════════════════════ the library ═══════════════════════ */

/*
  score  — credits for slicing it. Common things are cheap; small, rare, fiddly
           things pay. A nut is worth ten lemons because it spawns small, spawns
           rarely, and you have to actually aim.
  scale  — spawn size as a fraction of the normal fruit size. Nuts and seeds are
           small in the world, not small in their box.
  w      — spawn weight. Default 1. Below 1 = rarer.
  juice  — the colour it throws when cut.
*/
const PRODUCE = {
  /* ---- citrus ---------------------------------------------------------- */
  lemon:       { kind: "fruit", score: 60,  juice: "#F3D53C", art: citrus("#F6E27A", "#FDFBEA", "#F3D53C", 9) },
  lime:        { kind: "fruit", score: 60,  juice: "#A8CD52", art: citrus("#5FA02F", "#F2F8E4", "#A8CD52", 9) },
  orange:      { kind: "fruit", score: 70,  juice: "#F58B22", art: citrus("#F3A63B", "#FEF3E0", "#F58B22", 10) },
  mandarin:    { kind: "fruit", score: 80,  juice: "#FB9E2E", art: citrus("#ED7A14", "#FFF3E2", "#FBA338", 8) },
  grapefruit:  { kind: "fruit", score: 110, juice: "#F0796B", art: citrus("#F2B49A", "#FDEEE8", "#F0796B", 11) },
  bloodOrange: { kind: "fruit", score: 120, juice: "#D63A2A", art: citrus("#EBA24A", "#FDEBDF", "#D63A2A", 10) },

  /* ---- pomes and stone fruit ------------------------------------------- */
  apple:      { kind: "fruit", score: 90,  juice: "#FAF3DC", art: pome("#D6303B", "#FAF3DC", "#3A2A18") },
  greenApple: { kind: "fruit", score: 90,  juice: "#EFF4D8", art: pome("#7BB026", "#F1F5DA", "#3A2A18") },
  pear:       { kind: "fruit", score: 100, juice: "#F3F1D6", art: pome("#C6D148", "#F4F2DC", "#3A2A18") },
  peach:      { kind: "fruit", score: 140, juice: "#FBD3A8", art: stone("#EF9066", "#FBD3A8", "#8B4A32", 17, "#5E2E1E") },
  apricot:    { kind: "fruit", score: 160, juice: "#FBD08A", art: stone("#EFA132", "#FBD08A", "#7A4B2A", 15, "#4E2C18") },
  plum:       { kind: "fruit", score: 150, juice: "#E8B04E", art: stone("#763668", "#E8B04E", "#6B4A2E", 16, "#432A18") },
  mango:      { kind: "fruit", score: 170, juice: "#FBC02D", art: stone("#E49020", "#FBC22F", "#F4E5B0", 19) },
  cherry:     { kind: "fruit", score: 180, juice: "#D33A44", art: stone("#A6182A", "#D33A44", "#EFDCAE", 12), w: 0.8 },

  /* ---- berries and beaded fruit ---------------------------------------- */
  strawberry: {
    kind: "fruit", score: 110, juice: "#EC4A54",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#DE2F45" />
        <circle cx="50" cy="50" r="44" fill="#EC4A54" />
        <g stroke="#FBDDE0" strokeWidth="1.7" strokeLinecap="round" opacity="0.75">{spokes(22, 12, 41)}</g>
        <circle cx="50" cy="50" r="14" fill="#FBE7E8" opacity="0.92" />
      </>
    ),
  },
  blueberry: {
    kind: "fruit", score: 150, juice: "#5468A0",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#3F5486" />
        <circle cx="42" cy="40" r="31" fill="#5468A0" opacity="0.5" />
        <circle cx="50" cy="50" r="15" fill="#2C3859" />
        <path
          fill="#1D2742"
          d="M50 37 L53.2 45.6 L62.4 46 L55.2 51.7 L57.6 60.5 L50 55.5 L42.4 60.5 L44.8 51.7 L37.6 46 L46.8 45.6 Z"
        />
      </>
    ),
  },
  grape: {
    kind: "fruit", score: 100, juice: "#7A4A8E",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#5E3470" />
        <circle cx="50" cy="50" r="44" fill="#8A5A9E" />
        <ellipse cx="38" cy="34" rx="13" ry="9" fill="#C4A2D2" opacity="0.55" transform="rotate(-28 38 34)" />
        <ellipse cx="46" cy="52" rx="3.4" ry="5.6" fill="#E4D6B8" transform="rotate(-12 46 52)" />
        <ellipse cx="56" cy="56" rx="3.2" ry="5.2" fill="#E4D6B8" transform="rotate(16 56 56)" />
      </>
    ),
  },
  raspberry:   { kind: "fruit", score: 190, juice: "#C22B4A", art: beads("#8E1C36", "#F6DCE2", "#C93A56", "#F2A8BA"), w: 0.75 },
  pomegranate: { kind: "fruit", score: 300, juice: "#C4102E", art: beads("#8E1F2E", "#F8E8DA", "#C4102E", "#F49AA4"), w: 0.55 },

  /* ---- melons ----------------------------------------------------------- */
  watermelon: {
    kind: "fruit", score: 70, juice: "#E63946",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#3F7A33" />
        <circle cx="50" cy="50" r="45" fill="#EAF4D5" />
        <circle cx="50" cy="50" r="41.5" fill="#E63946" />
        {orbit(7, 12, () => <ellipse cx="50" cy="24" rx="2.4" ry="3.6" fill="#241F1C" />)}
        {orbit(5, 40, () => <ellipse cx="50" cy="12.5" rx="2.2" ry="3.3" fill="#241F1C" />)}
      </>
    ),
  },
  cantaloupe: {
    kind: "fruit", score: 140, juice: "#F2A25C",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#A9B26E" />
        <circle cx="50" cy="50" r="45" fill="#D8DCA8" />
        <circle cx="50" cy="50" r="41" fill="#F2A25C" />
        <circle cx="50" cy="50" r="17" fill="#F6C79A" />
        {orbit(8, 0, () => <ellipse cx="50" cy="40" rx="2.6" ry="4" fill="#F3E6C4" />)}
      </>
    ),
  },
  papaya: {
    kind: "fruit", score: 220, juice: "#EE6C3C",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#7FA83E" />
        <circle cx="50" cy="50" r="45" fill="#C6D46A" />
        <circle cx="50" cy="50" r="41" fill="#EE6C3C" />
        <circle cx="50" cy="50" r="21" fill="#F39E70" />
        {orbit(10, 0, () => <circle cx="50" cy="35" r="3.2" fill="#2A2420" />)}
        {orbit(6, 30, () => <circle cx="50" cy="43" r="2.6" fill="#2A2420" />)}
      </>
    ),
    w: 0.7,
  },

  /* ---- tropical --------------------------------------------------------- */
  kiwi: {
    kind: "fruit", score: 130, juice: "#A3C34A",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#8A6F3A" />
        <circle cx="50" cy="50" r="46" fill="#A3C34A" />
        <g stroke="#E9F2CE" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">{spokes(26, 15, 43)}</g>
        <circle cx="50" cy="50" r="13" fill="#F2F7DE" />
        {orbit(12, 0, () => <ellipse cx="50" cy="31" rx="1.6" ry="2.9" fill="#2B2B22" />)}
      </>
    ),
  },
  dragonfruit: {
    kind: "fruit", score: 340, juice: "#DE2A79", w: 0.55,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#DE2A79" />
        <circle cx="50" cy="50" r="43" fill="#FDF5F8" />
        <g fill="#2A2530">
          <circle cx="50" cy="30" r="1.9" /><circle cx="38" cy="36" r="1.6" />
          <circle cx="62" cy="35" r="1.8" /><circle cx="30" cy="48" r="1.7" />
          <circle cx="45" cy="45" r="1.5" /><circle cx="58" cy="47" r="1.9" />
          <circle cx="70" cy="52" r="1.6" /><circle cx="34" cy="61" r="1.8" />
          <circle cx="48" cy="58" r="1.7" /><circle cx="61" cy="63" r="1.5" />
          <circle cx="50" cy="72" r="1.8" /><circle cx="40" cy="72" r="1.5" />
          <circle cx="66" cy="72" r="1.7" /><circle cx="24" cy="55" r="1.4" />
          <circle cx="74" cy="43" r="1.5" /><circle cx="55" cy="22" r="1.5" />
        </g>
      </>
    ),
  },
  pineapple: {
    kind: "fruit", score: 200, juice: "#F5C542", w: 0.8,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#A87D28" />
        <g stroke="#C99A3E" strokeWidth="3" strokeLinecap="round">{spokes(18, 44, 48)}</g>
        <circle cx="50" cy="50" r="43" fill="#F5C542" />
        <g stroke="#FBE49A" strokeWidth="2" strokeLinecap="round" opacity="0.85">{spokes(16, 12, 41)}</g>
        <circle cx="50" cy="50" r="11" fill="#FBE9AE" />
      </>
    ),
  },
  banana: {
    kind: "fruit", score: 90, juice: "#FBF3D5",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#E0BC2E" />
        <circle cx="50" cy="50" r="44" fill="#F7EFC0" />
        <circle cx="50" cy="50" r="40" fill="#FCF8E4" />
        <g stroke="#E7DDA8" strokeWidth="1.8" strokeLinecap="round">{spokes(3, 3, 36)}</g>
        {orbit(3, 60, () => (
          <>
            <circle cx="50" cy="34" r="1.5" fill="#8A7A4A" />
            <circle cx="50" cy="41" r="1.2" fill="#8A7A4A" />
          </>
        ))}
      </>
    ),
  },
  passionfruit: {
    kind: "fruit", score: 320, juice: "#F0B429", w: 0.55,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#5E3325" />
        <circle cx="50" cy="50" r="43" fill="#FBF2DE" />
        <circle cx="50" cy="50" r="36" fill="#F0B429" />
        {orbit(9, 0, () => (
          <>
            <ellipse cx="50" cy="30" rx="3.4" ry="4.6" fill="#F6D06A" />
            <ellipse cx="50" cy="30" rx="1.8" ry="2.6" fill="#2E2418" />
          </>
        ))}
        {orbit(5, 36, () => (
          <>
            <ellipse cx="50" cy="41" rx="3" ry="4" fill="#F6D06A" />
            <ellipse cx="50" cy="41" rx="1.6" ry="2.3" fill="#2E2418" />
          </>
        ))}
      </>
    ),
  },
  fig: {
    kind: "fruit", score: 260, juice: "#DC5A78", w: 0.65,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#6E4A7E" />
        <circle cx="50" cy="50" r="44" fill="#F4E6D6" />
        <circle cx="50" cy="50" r="37" fill="#DC5A78" />
        <g stroke="#F8D8E0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">{spokes(20, 6, 35)}</g>
        {orbit(10, 18, () => <ellipse cx="50" cy="30" rx="1.4" ry="2.2" fill="#F6ECC8" />)}
        <circle cx="50" cy="50" r="5" fill="#F4E6D6" />
      </>
    ),
  },
  coconut: {
    kind: "fruit", score: 280, juice: "#FBFAF2", w: 0.6,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#5E4028" />
        <circle cx="50" cy="50" r="43" fill="#3E2A18" />
        <circle cx="50" cy="50" r="38" fill="#FBFAF2" />
        <circle cx="50" cy="50" r="17" fill="#E4DAC2" />
        <g stroke="#7A5A3A" strokeWidth="1.4" strokeLinecap="round" opacity="0.5">{spokes(14, 44, 48)}</g>
      </>
    ),
  },
  starfruit: {
    kind: "fruit", score: 360, juice: "#EBCB3E", w: 0.45,
    art: (
      <>
        <path
          fill="#D8B62E"
          d="M50 2 L62.34 33.01 L95.65 35.17 L69.97 56.49 L78.2 88.83 L50 71 L21.8 88.83 L30.03 56.49 L4.35 35.17 L37.66 33.01 Z"
        />
        <path
          fill="#F2DA62"
          d="M50 14 L59.4 37.6 L84.7 39.3 L65.2 55.5 L71.4 80.1 L50 66.6 L28.6 80.1 L34.8 55.5 L15.3 39.3 L40.6 37.6 Z"
        />
        {orbit(5, 0, () => <ellipse cx="50" cy="38" rx="2" ry="3.2" fill="#8E7A28" />)}
      </>
    ),
  },
  avocado: {
    kind: "fruit", score: 240, juice: "#C8D96F", w: 0.8,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#2C4A1E" />
        <circle cx="50" cy="50" r="46" fill="#6E8F32" />
        <circle cx="50" cy="50" r="43" fill="#B7CE52" />
        <circle cx="50" cy="50" r="33" fill="#DFEBA6" />
        <circle cx="50" cy="50" r="18" fill="#8B5E33" />
        <ellipse cx="44" cy="44" rx="6" ry="4.4" fill="#A97B4E" opacity="0.6" transform="rotate(-30 44 44)" />
      </>
    ),
  },

  /* ---- vegetables -------------------------------------------------------- */
  cucumber: { kind: "veg", score: 60,  juice: "#C6E2A4", art: gourd("#2E6B36", "#C6E2A4", "#DCEDC4", "#EAF4DA", 6) },
  zucchini: { kind: "veg", score: 90,  juice: "#E4EFCF", art: gourd("#28532A", "#8FB855", "#E8F1D4", "#F2F7E4", 7) },
  pumpkin:  { kind: "veg", score: 130, juice: "#F7BE5A", art: gourd("#DE7A16", "#F5B54A", "#F8D08A", "#FBEBC4", 8) },
  tomato: {
    kind: "veg", score: 60, juice: "#E8483A",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#D8352A" />
        <circle cx="50" cy="50" r="44" fill="#E8483A" />
        {/* Five locules, not four — an even count reads as a pinwheel at this size. */}
        {orbit(5, 0, () => (
          <>
            <ellipse cx="50" cy="27" rx="10" ry="14" fill="#F8D8C6" />
            <ellipse cx="50" cy="27" rx="5.5" ry="8.5" fill="#EC6A4E" opacity="0.65" />
          </>
        ))}
        <circle cx="50" cy="50" r="8" fill="#FAE6D9" />
      </>
    ),
  },
  carrot:   { kind: "veg", score: 80,  juice: "#EE8A32", art: <>{conc(["#DE6A14", "#EC8630", "#F09E45", "#F7BC6E"])}</> },
  beetroot: { kind: "veg", score: 130, juice: "#9E2A58", art: <>{conc(["#6E1338", "#A02C5A", "#7A1B42", "#AE3E68", "#7E1F46", "#BC5480"])}</> },
  redOnion: { kind: "veg", score: 110, juice: "#B87AA8", art: <>{conc(["#8E4A7A", "#F0E2EE", "#9E5A8A", "#F3E8F2", "#A76A94", "#F7EEF6"])}</> },
  onion:    { kind: "veg", score: 90,  juice: "#F6EEDE", art: <>{conc(["#D8C49E", "#FBF4E6", "#E6D6B8", "#FCF7EC", "#EDE0C8", "#FDFAF2"])}</> },
  radish: {
    kind: "veg", score: 120, juice: "#FDFAFA",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#C41E42" />
        <circle cx="50" cy="50" r="45" fill="#E8496A" />
        <circle cx="50" cy="50" r="41" fill="#FDFAFA" />
        <g stroke="#F6DCE4" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">{spokes(16, 6, 39)}</g>
      </>
    ),
  },
  bellPepper: { kind: "veg", score: 140, juice: "#D3242E", art: capsicum("#D3242E", "#F6EDD2", "#FDF6EF", "#E0454A", "#F0DFA0", 3) },
  // Same cross-section template as the bell pepper, so size is what tells them
  // apart — which is true of the real thing, and makes the chili the smaller,
  // harder target its higher score is paying for.
  chili:      { kind: "veg", score: 170, juice: "#C81E28", art: capsicum("#C81E28", "#F5E9C8", "#FBF0E4", "#D8353C", "#F2E2A8", 2), scale: 0.52, w: 0.8 },
  eggplant: {
    kind: "veg", score: 150, juice: "#F4EFE0",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#3E2352" />
        <circle cx="50" cy="50" r="46" fill="#6B4A80" />
        <circle cx="50" cy="50" r="43" fill="#F4EFE0" />
        <g fill="#C4AC88">
          <circle cx="42" cy="36" r="1.7" /><circle cx="58" cy="38" r="1.6" />
          <circle cx="34" cy="50" r="1.5" /><circle cx="50" cy="46" r="1.8" />
          <circle cx="66" cy="52" r="1.7" /><circle cx="40" cy="62" r="1.6" />
          <circle cx="56" cy="64" r="1.5" /><circle cx="50" cy="74" r="1.4" />
          <circle cx="28" cy="62" r="1.3" /><circle cx="70" cy="38" r="1.4" />
        </g>
      </>
    ),
  },
  corn: {
    kind: "veg", score: 160, juice: "#F5C232", w: 0.85,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#E0AC24" />
        {orbit(14, 0, () => <ellipse cx="50" cy="15" rx="5" ry="6.4" fill="#F5C232" />)}
        {orbit(11, 12, () => <ellipse cx="50" cy="27" rx="4.8" ry="5.8" fill="#F8CF4E" />)}
        {orbit(7, 25, () => <ellipse cx="50" cy="37" rx="4.4" ry="5.2" fill="#FADD70" />)}
        <circle cx="50" cy="50" r="9" fill="#F7EBBC" />
      </>
    ),
  },
  garlic: {
    kind: "veg", score: 190, juice: "#FBF6EE", w: 0.75,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#E4D6C2" />
        <circle cx="50" cy="50" r="45" fill="#FBF6EE" />
        {orbit(8, 0, () => (
          <>
            <ellipse cx="50" cy="29" rx="8" ry="15" fill="#F6EEE0" stroke="#DECDB6" strokeWidth="1.1" />
            <ellipse cx="50" cy="27" rx="3.4" ry="7" fill="#FDFAF4" />
          </>
        ))}
        <circle cx="50" cy="50" r="6" fill="#E8DAC6" />
      </>
    ),
  },
  broccoli: {
    kind: "veg", score: 210, juice: "#4A7A33", w: 0.7,
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#35602A" />
        {orbit(11, 0, () => <circle cx="50" cy="18" r="9" fill="#3F6B2C" />)}
        {orbit(9, 16, () => <circle cx="50" cy="30" r="8.5" fill="#4A7A33" />)}
        {orbit(6, 30, () => <circle cx="50" cy="40" r="7.5" fill="#55893A" />)}
        <circle cx="50" cy="50" r="11" fill="#C4D89A" />
      </>
    ),
  },
  sweetPotato: {
    kind: "veg", score: 120, juice: "#E8934A",
    art: (
      <>
        <circle cx="50" cy="50" r="49" fill="#9E3E52" />
        <circle cx="50" cy="50" r="44" fill="#E8934A" />
        <circle cx="50" cy="50" r="34" fill="#F2AE6E" />
        <g stroke="#FAD2A8" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">{spokes(18, 8, 32)}</g>
      </>
    ),
  },

  /* ---- nuts -------------------------------------------------------------
     Drawn to fill the same box as everything else; `scale` is what makes them
     small on screen. Worth more because they spawn small and spawn rarely. */
  cashew: {
    kind: "nut", score: 520, juice: "#E6C89C", scale: 0.66, w: 0.5,
    art: (
      <>
        <path d="M22 76 A 32 32 0 1 1 78 76" fill="none" stroke="#D8B182" strokeWidth="30" strokeLinecap="round" />
        <path d="M22 76 A 32 32 0 1 1 78 76" fill="none" stroke="#F0D7B0" strokeWidth="20" strokeLinecap="round" />
        <path d="M28 68 A 26 26 0 0 1 52 24" fill="none" stroke="#FBEDD8" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      </>
    ),
  },
  almond: {
    kind: "nut", score: 450, juice: "#C98A56", scale: 0.62, w: 0.55,
    art: (
      <>
        <path d="M50 4 C74 24 80 58 62 84 C56 94 44 94 38 84 C20 58 26 24 50 4 Z" fill="#B4794A" />
        <path d="M50 12 C69 29 74 57 59 79 C55 87 45 87 41 79 C26 57 31 29 50 12 Z" fill="#D8A473" />
        <path d="M50 20 L50 78" stroke="#A86E43" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      </>
    ),
  },
  walnut: {
    kind: "nut", score: 560, juice: "#C9A06C", scale: 0.7, w: 0.45,
    art: (
      <>
        <circle cx="50" cy="50" r="47" fill="#A87C4A" />
        <circle cx="50" cy="50" r="43" fill="#D8B584" />
        <path d="M50 10 L50 90" stroke="#A87C4A" strokeWidth="3.4" strokeLinecap="round" />
        <g fill="none" stroke="#A87C4A" strokeWidth="3" strokeLinecap="round" opacity="0.85">
          <path d="M40 18 C24 30 26 48 38 54 C26 62 28 78 40 86" />
          <path d="M60 18 C76 30 74 48 62 54 C74 62 72 78 60 86" />
          <path d="M44 34 C34 40 36 48 44 50" />
          <path d="M56 34 C66 40 64 48 56 50" />
        </g>
      </>
    ),
  },
  pistachio: {
    kind: "nut", score: 600, juice: "#9DBE4A", scale: 0.6, w: 0.42,
    art: (
      <>
        <ellipse cx="50" cy="50" rx="34" ry="46" fill="#E4D5B4" />
        <ellipse cx="50" cy="50" rx="27" ry="39" fill="#F2E7CC" />
        <ellipse cx="50" cy="52" rx="20" ry="32" fill="#8FAE3E" />
        <ellipse cx="50" cy="52" rx="14" ry="25" fill="#B3CE62" />
        <path d="M50 8 L50 92" stroke="#D2BE96" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
      </>
    ),
  },
  hazelnut: {
    kind: "nut", score: 480, juice: "#A97244", scale: 0.6, w: 0.5,
    art: (
      <>
        <circle cx="50" cy="56" r="40" fill="#8E5A31" />
        <circle cx="50" cy="56" r="35" fill="#B4794A" />
        <path d="M14 42 A 40 40 0 0 1 86 42 Z" fill="#DCC8A4" />
        <path d="M50 16 L50 6" stroke="#8E5A31" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="38" cy="52" rx="9" ry="13" fill="#D2A276" opacity="0.5" transform="rotate(-18 38 52)" />
      </>
    ),
  },
  pecan: {
    kind: "nut", score: 540, juice: "#8F5C33", scale: 0.64, w: 0.45,
    art: (
      <>
        <ellipse cx="50" cy="50" rx="31" ry="47" fill="#7A4A28" />
        <ellipse cx="50" cy="50" rx="26" ry="42" fill="#A97148" />
        <path d="M50 8 L50 92" stroke="#6B3E20" strokeWidth="3.2" strokeLinecap="round" />
        <g fill="none" stroke="#6B3E20" strokeWidth="2.2" strokeLinecap="round" opacity="0.7">
          <path d="M38 18 C30 34 30 66 38 82" />
          <path d="M62 18 C70 34 70 66 62 82" />
        </g>
      </>
    ),
  },
  peanut: {
    kind: "nut", score: 430, juice: "#D9B47C", scale: 0.66, w: 0.55,
    art: (
      <>
        <g transform="rotate(-24 50 50)">
          <circle cx="50" cy="26" r="24" fill="#C89E62" />
          <circle cx="50" cy="72" r="27" fill="#C89E62" />
          <rect x="30" y="26" width="40" height="46" fill="#C89E62" />
          <circle cx="50" cy="26" r="19" fill="#E0BC86" />
          <circle cx="50" cy="72" r="22" fill="#E0BC86" />
          <g stroke="#B2884E" strokeWidth="2" strokeLinecap="round" opacity="0.75">
            <path d="M34 22 L66 30" /><path d="M32 40 L68 44" />
            <path d="M34 58 L66 62" /><path d="M34 76 L66 80" />
          </g>
        </g>
      </>
    ),
  },

  /* ---- seeds -------------------------------------------------------------
     Authored as a handful, not a specimen. The highest scores on the board:
     smallest target, rarest spawn. */
  pumpkinSeed: {
    kind: "seed", score: 780, juice: "#C8D48A", scale: 0.56, w: 0.34,
    art: (
      <g>
        {cluster([[30, 30, -22], [66, 36, 14], [40, 66, 8], [70, 70, -34]], () => (
          <>
            <ellipse cx="0" cy="0" rx="15" ry="22" fill="#B8C878" />
            <ellipse cx="0" cy="1" rx="11" ry="18" fill="#DDE6B4" />
          </>
        ))}
      </g>
    ),
  },
  sunflowerSeed: {
    kind: "seed", score: 820, juice: "#4A4438", scale: 0.54, w: 0.32,
    art: (
      <g>
        {cluster([[32, 32, -30], [68, 34, 22], [36, 68, 12], [70, 68, -18]], () => (
          <>
            <ellipse cx="0" cy="0" rx="13" ry="21" fill="#2E2A22" />
            <path d="M-5 -18 L-5 16 M4 -16 L4 17" stroke="#E8E2D2" strokeWidth="3" strokeLinecap="round" />
          </>
        ))}
      </g>
    ),
  },
  flaxSeed: {
    kind: "seed", score: 900, juice: "#8A5E32", scale: 0.5, w: 0.3,
    art: (
      <g>
        {cluster(
          [[26, 28, -34], [50, 22, 12], [72, 32, 40], [30, 52, 18], [54, 48, -20],
           [76, 56, 8], [34, 74, -12], [58, 76, 30], [78, 78, -40]],
          () => (
            <>
              <ellipse cx="0" cy="0" rx="7.5" ry="12" fill="#7A4E28" />
              <ellipse cx="-1" cy="-1" rx="4.6" ry="8" fill="#B08046" />
            </>
          ),
        )}
      </g>
    ),
  },
  sesame: {
    kind: "seed", score: 950, juice: "#EFE2C2", scale: 0.48, w: 0.28,
    art: (
      <g>
        {cluster(
          [[22, 24, -20], [42, 18, 30], [64, 26, -8], [80, 40, 44], [28, 44, 16],
           [50, 40, -34], [70, 48, 10], [22, 66, 38], [44, 62, -14], [66, 68, 26],
           [82, 66, -30], [34, 82, 6], [58, 84, -22], [76, 84, 18]],
          () => (
            <>
              <ellipse cx="0" cy="0" rx="6.5" ry="9.5" fill="#DCC9A0" />
              <ellipse cx="-0.8" cy="-1" rx="4.2" ry="6.6" fill="#F7EEDA" />
            </>
          ),
        )}
      </g>
    ),
  },
  chia: {
    kind: "seed", score: 1100, juice: "#3E3830", scale: 0.46, w: 0.24,
    art: (
      <g>
        {cluster(
          [[24, 22, -18], [44, 16, 26], [66, 24, 8], [82, 36, -32], [20, 42, 14],
           [40, 38, -26], [60, 42, 34], [78, 52, -10], [26, 60, 22], [48, 58, -6],
           [68, 64, 40], [84, 70, -24], [30, 78, 10], [52, 82, 28], [72, 84, -16],
           [40, 70, 44], [58, 26, -40], [34, 50, 2]],
          () => (
            <>
              <ellipse cx="0" cy="0" rx="6" ry="8" fill="#2E2A24" />
              <ellipse cx="-1" cy="-1.4" rx="3" ry="4" fill="#8A8072" opacity="0.75" />
            </>
          ),
        )}
      </g>
    ),
  },
};

/* ═══════════════════════ derived views ═══════════════════════ */

export const ART_KEYS = Object.keys(PRODUCE);

// The drawings alone — what the hero scatter and the symbol sheet consume.
export const SLICE_ART = Object.fromEntries(ART_KEYS.map((k) => [k, PRODUCE[k].art]));

// The juice colour each item throws when it's cut, for the slice splash.
export const JUICE = Object.fromEntries(ART_KEYS.map((k) => [k, PRODUCE[k].juice]));

// Credits per slice.
export const SCORE = Object.fromEntries(ART_KEYS.map((k) => [k, PRODUCE[k].score]));

// Spawn size multiplier — 1 for anything drawn as a round slice.
export const SCALE = Object.fromEntries(ART_KEYS.map((k) => [k, PRODUCE[k].scale ?? 1]));

// fruit | veg | nut | seed — used for grouping in the design system and for the
// "you've sliced 4 of 5 kinds" style copy.
export const KIND = Object.fromEntries(ART_KEYS.map((k) => [k, PRODUCE[k].kind]));

/*
  Weighted pick. Rare items are rare on purpose: a board where dragonfruit and
  chia turned up as often as lemon would pay out the 10,000 in a couple of
  minutes and the reward would stop meaning anything.

  The cumulative table is built once at module load, not per spawn.
*/
const WEIGHTS = ART_KEYS.map((k) => PRODUCE[k].w ?? 1);
const CUMULATIVE = WEIGHTS.reduce((acc, w) => {
  acc.push((acc[acc.length - 1] ?? 0) + w);
  return acc;
}, []);
const WEIGHT_TOTAL = CUMULATIVE[CUMULATIVE.length - 1];

export function pickProduce() {
  const r = Math.random() * WEIGHT_TOTAL;
  for (let i = 0; i < CUMULATIVE.length; i++) {
    if (r < CUMULATIVE[i]) return ART_KEYS[i];
  }
  return ART_KEYS[0];
}

/*
  Every item as a <symbol>, rendered once per page and referenced by <use>.

  This is what lets the falling layer animate without React: each pool slot is a
  <use> whose href is swapped imperatively when a new item spawns, so the
  component renders once at mount and the rAF loop only ever writes transforms.
  Sixty <symbol>s is a lot of markup, but it lives inside <defs> — parsed once,
  never laid out, and drawn only where a <use> references it.
*/
export function FruitSymbols({ idPrefix = "shk-fruit" }) {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        {ART_KEYS.map((k) => (
          <symbol key={k} id={`${idPrefix}-${k}`} viewBox="0 0 100 100">
            {SLICE_ART[k]}
          </symbol>
        ))}
      </defs>
    </svg>
  );
}

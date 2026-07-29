/*
  Fruit drifting down over the whole site, sliceable like Fruit Ninja.

  Three constraints shaped every decision below:

  1. It must never cost a sale. The layer is `pointer-events: none` and sits at
     z-index 20 — above the cards, below the nav (30), the cart (55) and the
     dialog scrims (70). A tap always reaches the dish underneath.
  2. It must not make the phone stutter while someone scrolls a menu. So React
     renders the pool exactly once at mount; after that a single rAF loop writes
     `transform` straight to nodes it holds by ref. No state, no re-renders, no
     layout reads inside the loop.
  3. It must be ignorable. Fruit falls slowly (gravity is a quarter of real) and
     sits at partial opacity, so it reads as movement in the corner of the eye
     rather than something demanding to be played.

  The slot pool is fixed-size and recycled. Each slot is one fruit drawn twice,
  each copy clipped to one half of the box; while whole the two halves sit on
  top of each other and read as one piece. Cutting just moves them apart.
*/

import { useEffect, useRef } from "react";
import { JUICE, SCALE, pickProduce } from "../../lib/fruitArt.jsx";
import { useSlicer } from "../../state/slicer.jsx";

const POOL = 10; // slots; ~5 airborne at once, the rest waiting to respawn
const POPS = 8; // "+N" credit popups; more than can plausibly overlap at once
const GRAVITY = 70; // px/s² — a quarter of real, so a fruit takes ~5s to cross
const SPAWN_MIN = 700; // ms between spawns, lower bound…
const SPAWN_MAX = 2100; // …and upper, picked fresh each time so it never pulses
const SLICE_SPEED = 550; // px/s the pointer must beat before it counts as a blade
const CUT_LIFE = 620; // ms the halves fly before the slot is recycled
const TRAIL_GAP = 120; // ms — a gap longer than this restarts the blade stroke

// Where each juice droplet flies. Fixed rather than random so the burst is one
// authored shape; the eye reads a splash, not ten independent dots.
const DROPS = [
  { a: -90, d: 30 }, { a: -50, d: 24 }, { a: -18, d: 32 },
  { a: 20, d: 26 }, { a: 62, d: 30 }, { a: 110, d: 22 },
  { a: 155, d: 28 }, { a: -140, d: 25 },
];

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// Distance from a point to a line *segment* — not to the infinite line. The
// difference matters: a swipe that stops short of a fruit must not cut it.
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function FruitFall({ idPrefix = "shk-fruit" }) {
  const layerRef = useRef(null);
  const slotsRef = useRef([]);
  const popsRef = useRef([]);

  // The loop is set up once and never re-runs, so it can't close over a live
  // context value. A ref gives it the current one without re-subscribing.
  const { scoreSlice } = useSlicer();
  const scoreRef = useRef(scoreSlice);
  scoreRef.current = scoreSlice;

  useEffect(() => {
    // Someone who asked the OS for less motion gets a still page, not a slower
    // one. Nothing is mounted, so there is no loop to pause either.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = layerRef.current;
    if (!layer) return;

    /* --- the pool ---------------------------------------------------------
       One object per slot carrying its own physics. `mode` is the whole state
       machine: idle (off-screen, waiting), fall (drifting), cut (halves flying
       apart, about to recycle). */
    const slots = slotsRef.current.map((el) => ({
      el,
      cut: el.querySelector(".shk-fruitfall__cut"),
      arts: el.querySelectorAll(".shk-fruitfall__art"),
      uses: el.querySelectorAll("use"),
      mode: "idle",
      x: 0, y: 0, vx: 0, vy: 0, size: 0, spin: 0, vspin: 0, cutAt: 0, key: null,
    }));

    // "+0.06 cal" popups. A tiny ring buffer: eight is more than can plausibly
    // be on screen at once, so the oldest is always safe to reuse.
    const pops = popsRef.current.slice();
    let popNext = 0;
    function popCredit(x, y, value, colour) {
      const el = pops[popNext];
      popNext = (popNext + 1) % pops.length;
      if (!el) return;
      // Two decimals always: a slice is worth hundredths of a calorie, and a
      // bare "+0.1" next to a "+0.06" would look like a rounding bug.
      el.textContent = `+${value.toFixed(2)}`;
      el.style.setProperty("--jc", colour);
      el.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0)`;
      // Restart the animation on a node that may still be mid-flight.
      el.classList.remove("is-live");
      void el.offsetWidth;
      el.classList.add("is-live");
    }

    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const onResize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    function spawn(s) {
      // Weighted: dragonfruit and chia are meant to feel like a find. SCALE
      // shrinks the nuts and seeds, which is what makes them a harder target
      // and justifies what they pay.
      const key = pickProduce();
      // Small on phones, where a 70px fruit would cover a price.
      const size = (vw < 640 ? rand(30, 52) : rand(38, 74)) * SCALE[key];

      s.key = key;
      s.size = size;
      s.x = rand(0, Math.max(0, vw - size));
      s.y = -size - rand(0, 240); // staggered above the fold so they don't line up
      s.vx = rand(-26, 26);
      s.vy = rand(20, 55);
      s.spin = rand(0, 360);
      s.vspin = rand(-38, 38);
      s.mode = "fall";

      s.uses.forEach((u) => u.setAttribute("href", `#${idPrefix}-${key}`));
      s.el.style.setProperty("--jc", JUICE[key]);
      s.el.style.width = `${size}px`;
      s.el.style.height = `${size}px`;
      s.el.classList.remove("is-cut");
      s.cut.style.transform = "";
      s.arts.forEach((a) => (a.style.transform = ""));
      s.el.style.opacity = "";
    }

    function recycle(s) {
      s.mode = "idle";
      s.el.classList.remove("is-cut");
      s.el.style.opacity = "0";
    }

    /* --- the blade --------------------------------------------------------
       We keep only the previous pointer sample. A swipe is tested one segment
       at a time, which is why a slow drag over a fruit does nothing: the speed
       gate is per segment, and only a real flick clears it. */
    let last = null;

    function blade(px, py, t) {
      const prev = last;
      last = { x: px, y: py, t };
      if (!prev) return;

      const dt = t - prev.t;
      if (dt <= 0 || dt > TRAIL_GAP) return;
      const dist = Math.hypot(px - prev.x, py - prev.y);
      if ((dist / dt) * 1000 < SLICE_SPEED) return;

      // Cut angle in world space, from the swipe itself — the fruit splits
      // along the line the finger travelled, not along some fixed axis.
      const swipe = (Math.atan2(py - prev.y, px - prev.x) * 180) / Math.PI;

      for (const s of slots) {
        if (s.mode !== "fall") continue;
        const cx = s.x + s.size / 2;
        const cy = s.y + s.size / 2;
        // 0.86 of the radius: cutting has to feel like you hit the fruit, and a
        // hit registered on the very edge reads as a miss. Because nuts and
        // seeds spawn smaller, this one rule already makes them a harder
        // target — no per-item hit box needed.
        if (distToSegment(cx, cy, prev.x, prev.y, px, py) > s.size * 0.43) continue;
        slice(s, swipe, t);
        // Credit is awarded where the blade crossed, not where the fruit ends
        // up: the number belongs to the swipe you just made.
        popCredit(cx, cy, scoreRef.current(s.key), JUICE[s.key]);
      }
    }

    function slice(s, swipe, t) {
      /* The halves are clipped down the *local* vertical, so to line the cut up
         with the swipe we rotate the pair by (swipe − 90°). Subtracting the
         fruit's own spin expresses that in its local frame, and the drawing
         inside each half counter-rotates by the same amount — so the cut turns
         but the fruit doesn't appear to snap round at the moment it's hit. */
      const rel = swipe - 90 - s.spin;
      s.cut.style.transform = `rotate(${rel}deg)`;
      s.arts.forEach((a) => (a.style.transform = `rotate(${-rel}deg)`));
      s.el.classList.add("is-cut");

      // A cut fruit loses the argument with gravity: it tumbles harder and drops.
      s.vspin = s.vspin * 1.8 + rand(-60, 60);
      s.vy += 40;
      s.mode = "cut";
      s.cutAt = t;
    }

    const onPointer = (e) => blade(e.clientX, e.clientY, e.timeStamp || performance.now());
    // Touch needs its own path: once the browser claims a gesture for scrolling
    // it fires pointercancel and stops sending pointermove, but touchmove keeps
    // coming. So on a phone the fruit is sliced by the same flick that scrolls.
    const onTouch = (e) => {
      const p = e.touches[0];
      if (p) blade(p.clientX, p.clientY, e.timeStamp || performance.now());
    };
    const onLeave = () => { last = null; };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("pointerup", onLeave, { passive: true });
    window.addEventListener("pointercancel", onLeave, { passive: true });

    /* --- the loop --------------------------------------------------------- */
    let raf = 0;
    let prevT = performance.now();
    let spawnIn = 200;

    function frame(now) {
      raf = requestAnimationFrame(frame);
      // Clamped: coming back to a backgrounded tab hands us a multi-second dt,
      // which would teleport every fruit off the bottom at once.
      const dt = Math.min((now - prevT) / 1000, 0.05);
      prevT = now;

      spawnIn -= dt * 1000;
      if (spawnIn <= 0) {
        spawnIn = rand(SPAWN_MIN, SPAWN_MAX);
        const free = slots.find((s) => s.mode === "idle");
        if (free) spawn(free);
      }

      for (const s of slots) {
        if (s.mode === "idle") continue;

        s.vy += GRAVITY * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.spin += s.vspin * dt;

        if (s.mode === "cut" && now - s.cutAt > CUT_LIFE) {
          recycle(s);
          continue;
        }
        if (s.y > vh + s.size) {
          recycle(s);
          continue;
        }

        s.el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) rotate(${s.spin.toFixed(1)}deg)`;
      }
    }

    slots.forEach((s) => (s.el.style.opacity = "0"));
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("pointerup", onLeave);
      window.removeEventListener("pointercancel", onLeave);
    };
  }, [idPrefix]);

  return (
    <div className="shk-fruitfall" ref={layerRef} aria-hidden="true">
      {Array.from({ length: POOL }, (_, i) => (
        <div
          className="shk-fruitfall__item"
          key={i}
          style={{ opacity: 0 }}
          ref={(el) => {
            if (el) slotsRef.current[i] = el;
          }}
        >
          <div className="shk-fruitfall__cut">
            {/* Two copies of the same drawing, each clipped to one half. Whole,
                they overlap into a single fruit; cut, they simply move apart. */}
            <div className="shk-fruitfall__half shk-fruitfall__half--a">
              <svg className="shk-fruitfall__art" viewBox="0 0 100 100">
                <use href={`#${idPrefix}-lemon`} />
              </svg>
            </div>
            <div className="shk-fruitfall__half shk-fruitfall__half--b">
              <svg className="shk-fruitfall__art" viewBox="0 0 100 100">
                <use href={`#${idPrefix}-lemon`} />
              </svg>
            </div>
          </div>
          <div className="shk-fruitfall__splash">
            {DROPS.map((d, j) => (
              <i key={j} style={{ "--a": `${d.a}deg`, "--d": `${d.d}px` }} />
            ))}
          </div>
        </div>
      ))}

      {/* Credit popups live at the layer, not inside a slot: the number should
          stay where you cut, while the two halves fly off. */}
      {Array.from({ length: POPS }, (_, i) => (
        <span
          className="shk-fruitfall__pop"
          key={`pop-${i}`}
          ref={(el) => {
            if (el) popsRef.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}

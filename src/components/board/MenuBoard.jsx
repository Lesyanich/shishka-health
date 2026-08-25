import { useState, useEffect, useMemo, useRef } from "react";
import { useMenu } from "../../hooks/useMenu.js";
import { optimizedSrc } from "../../lib/img.js";
import { pickBoardDishes } from "../../lib/boardPicks.js";

/*
  The in-restaurant TV board: one dish at a time, full screen, landscape.

  This runs unattended on a screen bolted to a wall — nobody is going to notice
  it broke, so every decision here favours "still showing food in a week" over
  cleverness. No interaction, no scroll, no router, no state that grows.
*/

const DEFAULT_SLIDE_SECONDS = 8;
const MIN_SLIDE_SECONDS = 3;
const MAX_SLIDE_SECONDS = 60;

// Full page reload, taken only at the top of a loop so it never interrupts a
// slide. useMenu already subscribes to realtime, but a TV browser left running
// for days drops websockets silently and leaks memory that nothing else here
// can reclaim. Reloading on the hour costs one invisible flash and resets both.
const RELOAD_AFTER_MS = 30 * 60 * 1000;

// The baht sign is the reason this says THB. The brand font stack falls back to
// Albert Sans on anything that isn't Apple hardware — a TV, always — and Albert
// Sans has no ฿ glyph, so the browser substitutes it from an unrelated system
// font. At 6vw that mismatch is the size of a fist. See memory: brand_font_baht_glyph.
const CURRENCY = "THB";

function slideSeconds() {
  // Tuning knob for the wall, not a feature: whoever is standing at the TV can
  // try /board?s=6 without waiting on a redeploy.
  const raw = Number(new URLSearchParams(window.location.search).get("s"));
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_SLIDE_SECONDS;
  return Math.min(MAX_SLIDE_SECONDS, Math.max(MIN_SLIDE_SECONDS, raw));
}

// Keeps the screen awake where the platform supports it. Chrome-based TV boxes
// and desktop browsers honour this; most native smart-TV browsers do not, which
// is why the TV's own sleep timer still has to be turned off by hand.
function useWakeLock() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Denied or unsupported — the TV's own sleep setting governs instead.
      }
    };
    // The lock is dropped whenever the page is hidden, so it has to be retaken.
    const onVisible = () => {
      if (!cancelled && document.visibilityState === "visible") acquire();
    };
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch(() => {});
    };
  }, []);
}

function Facts({ dish }) {
  const facts = [
    dish.calories != null && { label: "kcal", value: Math.round(dish.calories) },
    dish.protein != null && { label: "protein", value: `${Math.round(dish.protein)}g` },
    dish.carbs != null && { label: "carbs", value: `${Math.round(dish.carbs)}g` },
    dish.fat != null && { label: "fat", value: `${Math.round(dish.fat)}g` },
  ].filter(Boolean);
  if (facts.length === 0) return null;
  return (
    <dl className="shk-board__facts">
      {facts.map((f) => (
        <div className="shk-board__fact" key={f.label}>
          <dt className="shk-board__fact-label">{f.label}</dt>
          <dd className="shk-board__fact-value num">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Slide({ dish, on }) {
  const price = dish.priceDefault ?? dish.price;
  const portion =
    dish.portion_size != null
      ? `${Math.round(dish.portion_size)}${dish.portion_unit || "g"}`
      : null;

  return (
    <article className={`shk-board__slide${on ? " is-on" : ""}`} aria-hidden={!on}>
      <div className="shk-board__photo">
        <img
          className="shk-board__img"
          // 1920 is the widest Vercel size we allow; the photo occupies about
          // half a 4K screen, so this is the honest upper bound.
          src={optimizedSrc(dish.cardImage, 1920, 82)}
          alt=""
          decoding="async"
        />
      </div>

      <div className="shk-board__info">
        <p className="shk-board__eyebrow">
          {dish.section_name}
          {portion && <span className="shk-board__portion"> · {portion}</span>}
        </p>

        <h2 className="shk-board__name">{dish.name}</h2>

        {dish.description && <p className="shk-board__desc">{dish.description}</p>}

        {dish.ingredients && <p className="shk-board__ing">{dish.ingredients}</p>}

        <Facts dish={dish} />

        <div className="shk-board__price">
          {dish.priceFrom != null && <span className="shk-board__from">from</span>}
          <span className="shk-board__amount num">{dish.priceFrom ?? price}</span>
          <span className="shk-board__cur">{CURRENCY}</span>
        </div>
      </div>
    </article>
  );
}

export default function MenuBoard() {
  const { data } = useMenu();
  const [idx, setIdx] = useState(0);
  const seconds = useMemo(slideSeconds, []);
  useWakeLock();

  const picks = useMemo(
    () => pickBoardDishes(data?.dishes ?? [], data?.categories ?? []),
    [data],
  );

  /*
    Hold the last reel that actually had dishes in it.

    useMenu drops `data` to null when a fetch fails, which is right for the
    public menu — a guest is better off told the menu is down than shown stale
    prices they might act on. A wall screen is the opposite case: nobody is
    ordering off it, and a black rectangle in the dining room reads as a broken
    restaurant. So the board keeps rotating what it last knew while the network
    is away, and picks up the truth on the next successful fetch or reload.
  */
  const lastGood = useRef([]);
  if (picks.length > 0) lastGood.current = picks;
  const reel = picks.length > 0 ? picks : lastGood.current;

  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (reel.length === 0) return;
    const id = setInterval(() => {
      setIdx((n) => {
        const next = (n + 1) % reel.length;
        // Only at the top of the loop, so a reload never eats a slide midway.
        if (next === 0 && Date.now() - startedAt.current > RELOAD_AFTER_MS) {
          window.location.reload();
        }
        return next;
      });
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [reel.length, seconds]);

  // The reel can shrink between fetches (a dish sells out); never point past it.
  const safeIdx = reel.length > 0 ? idx % reel.length : 0;

  // Warm the image two slides ahead. The neighbours are already in the DOM and
  // decoded; this covers the one after them so a slow TV never fades to a gap.
  useEffect(() => {
    if (reel.length < 3) return;
    const ahead = reel[(safeIdx + 2) % reel.length];
    if (!ahead?.cardImage) return;
    const img = new Image();
    img.src = optimizedSrc(ahead.cardImage, 1920, 82);
  }, [safeIdx, reel]);

  if (reel.length === 0) {
    return (
      <div className="shk-board shk-board--wait">
        <img className="shk-board__wait-logo" src="/assets/logo-mark-white.png" alt="SHISHKA" />
      </div>
    );
  }

  /*
    Only the current slide and its immediate neighbours are mounted. Mounting
    the whole reel — currently ~24 slides, and it grows every time the running
    order does — means that many decoded full-screen photographs resident at all
    times, which is exactly the kind of thing that makes a smart-TV browser fall
    over after an hour. The outgoing slide has to stay mounted for the crossfade,
    hence the previous one rather than just the next.
  */
  const n = reel.length;
  const mounted = new Set([(safeIdx - 1 + n) % n, safeIdx, (safeIdx + 1) % n]);

  return (
    <div className="shk-board">
      <div className="shk-board__stage">
        {reel.map((dish, i) =>
          mounted.has(i) ? <Slide key={dish.id} dish={dish} on={i === safeIdx} /> : null,
        )}
      </div>

      <img className="shk-board__mark" src="/assets/logo-mark-white.png" alt="" aria-hidden="true" />

      {/* Keyed on the index so the fill animation restarts with every slide. */}
      <div className="shk-board__bar" aria-hidden="true">
        <span
          key={safeIdx}
          className="shk-board__bar-fill"
          style={{ animationDuration: `${seconds}s` }}
        />
      </div>
    </div>
  );
}

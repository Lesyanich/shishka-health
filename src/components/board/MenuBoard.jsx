import { useState, useEffect, useMemo, useRef } from "react";

/*
  The in-restaurant TV board: the whole menu on two full-screen pages — food,
  then drinks — each held for 30 seconds (CEO 2026-11-11, down from 1 min).

  The pages are 1920x1080 images built by scripts/tv-board-sample.py in the OS
  repo (the A3 menu style: colour sections, photo cards, price, kcal, protein).
  They are pictures, not live data: a price or dish change means rebuilding them
  and replacing public/board/*.png. The old one-dish-at-a-time reel picker is
  kept in src/lib/boardPicks.js for scripts/board-order-check.mjs.

  This runs unattended on a screen bolted to a wall — nobody is going to notice
  it broke, so every decision here favours "still showing the menu in a week"
  over cleverness. No interaction, no scroll, no network after the first load.
*/

const PAGES = [
  { src: "/board/food.png", alt: "Food menu" },
  { src: "/board/drinks.png", alt: "Drinks menu" },
];

const DEFAULT_SLIDE_SECONDS = 30;
const MIN_SLIDE_SECONDS = 3;
const MAX_SLIDE_SECONDS = 600;

// Full page reload, taken only at the top of a loop so it never interrupts a
// page. A TV browser left running for days leaks memory that nothing else here
// can reclaim, and a reload also picks up new menu images after a deploy.
const RELOAD_AFTER_MS = 30 * 60 * 1000;

function slideSeconds() {
  // Tuning knob for the wall: /board?s=10 to check the swap without waiting.
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

export default function MenuBoard() {
  const [idx, setIdx] = useState(0);
  const seconds = useMemo(slideSeconds, []);
  const startedAt = useRef(Date.now());
  useWakeLock();

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((n) => {
        const next = (n + 1) % PAGES.length;
        if (next === 0 && Date.now() - startedAt.current > RELOAD_AFTER_MS) {
          window.location.reload();
        }
        return next;
      });
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [seconds]);

  // Both pages stay mounted: two images is cheap, and it means the swap is a
  // crossfade between decoded pictures, never a fade to a half-loaded one.
  return (
    <div className="shk-board shk-board--pages">
      {PAGES.map((p, i) => (
        <img
          key={p.src}
          className={`shk-board__page${i === idx ? " is-on" : ""}`}
          src={p.src}
          alt={p.alt}
          aria-hidden={i !== idx}
          decoding="async"
        />
      ))}
    </div>
  );
}

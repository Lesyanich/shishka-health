import { useState, useEffect, useMemo } from "react";
import {
  STYLES,
  STEPS,
  TOPPING_COUNT,
  PICKS_INCLUDED,
  DEFAULT_FLAT_PRICE,
  DEFAULT_PREMIUM_SURCHARGE,
} from "../../data/byoCatalog.js";

/*
  THE BUILD-YOUR-OWN BOARD — the wall screen, rebuilt around the BYO concept.

  The dish board this sits beside answers "what do you sell?". This one answers
  a different and, for BYO, more urgent question: "what do I do?" A guest who
  walks into a build-your-own restaurant for the first time and is handed an
  empty bowl freezes — that is the whole reason Salata puts the four steps on
  the wall rather than a grid of finished plates. So this board is not a menu.
  It is an instruction, paced.

  Five screens on a loop: the style question, then the four steps in the order
  the guest physically walks the counter. By the time someone has queued for
  ninety seconds they have seen the whole journey once, which is roughly one
  loop, which is why the timings are what they are.

  Same operating constraints as the dish board next to it — bolted to a wall,
  nobody watching, must survive a week — so the same defences: wake lock,
  periodic reload, no cursor, everything in vw/vh.

  NOTE ON THE DUPLICATED RUNTIME: `useWakeLock` and the reload counter below are
  a deliberate second copy of the ones in MenuBoard.jsx rather than a shared
  import. That board is in review on its own branch and I am not editing a file
  someone else is being asked to test. When both land, lift them into
  `useBoardRuntime.js` and delete both copies — it is a ten-line refactor and
  the only reason it has not happened yet is branch hygiene.
*/

const DEFAULT_SCREEN_SECONDS = 10;
const MIN_SCREEN_SECONDS = 3;
const MAX_SCREEN_SECONDS = 60;

const RELOAD_AFTER_MS = 30 * 60 * 1000;

// Albert Sans has no ฿ glyph, so the browser substitutes it from an unrelated
// system font and at 6vw the mismatch is the size of a fist. See memory:
// brand_font_baht_glyph. Same reason the dish board says THB.
const CURRENCY = "THB";

// Tuning knobs for whoever is standing at the TV, not features. The price is
// here because it is the one number in the concept the CEO has not fixed yet:
// /board?p=249&x=49 lets him see it at full size on the actual panel before
// committing it to the POS.
function knobs() {
  const q = new URLSearchParams(window.location.search);
  const num = (key, fallback, lo, hi) => {
    const raw = Number(q.get(key));
    if (!Number.isFinite(raw) || raw <= 0) return fallback;
    return Math.min(hi, Math.max(lo, raw));
  };
  return {
    seconds: num("s", DEFAULT_SCREEN_SECONDS, MIN_SCREEN_SECONDS, MAX_SCREEN_SECONDS),
    price: num("p", DEFAULT_FLAT_PRICE, 1, 9999),
    premium: num("x", DEFAULT_PREMIUM_SURCHARGE, 1, 999),
  };
}

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

/* --- the opening question ------------------------------------------------ */

function StyleScreen({ on, price }) {
  return (
    <section className={`shk-byo__screen shk-byo__screen--hero${on ? " is-on" : ""}`} aria-hidden={!on}>
      <p className="shk-board__eyebrow">Build your own · สร้างเมนูของคุณเอง</p>

      <h1 className="shk-byo__hero-title">
        Start with
        <br />
        your style
      </h1>
      <p className="shk-byo__hero-th">เริ่มจากสไตล์ที่คุณชอบ</p>

      <ul className="shk-byo__styles">
        {STYLES.map((s) => (
          <li className="shk-byo__style" key={s.code}>
            <span className="shk-byo__style-en">{s.en}</span>
            <span className="shk-byo__style-th">{s.th}</span>
            <span className="shk-byo__style-note">{s.note}</span>
          </li>
        ))}
      </ul>

      <p className="shk-byo__flat">
        <span className="shk-byo__flat-amount num">{price}</span>
        <span className="shk-byo__flat-cur">{CURRENCY}</span>
        {/* This line used to say "unlimited toppings". It says a number now
            because the offer changed, and a number is the stronger promise of
            the two: "unlimited" is a claim a guest discounts on sight, eleven
            is one they can count. It also happens to be true. */}
        <span className="shk-byo__flat-note">
          any style · {PICKS_INCLUDED} picks included
          <em>ทุกสไตล์ ราคาเดียว เลือกท็อปปิ้งได้ {PICKS_INCLUDED} อย่าง</em>
        </span>
      </p>
    </section>
  );
}

/* --- one of the four steps ----------------------------------------------- */

/* One component name, rendered the same everywhere it appears — inside a plain
   list, inside an allowance group, or in the free strip. Extracted because it
   is now used in three places and a component whose Thai line goes missing in
   one of them is a bug nobody in this room can see. */
function Item({ item }) {
  return (
    <li className={`shk-byo__item${item.premium ? " is-premium" : ""}`}>
      <span className="shk-byo__item-en">
        {item.en}
        {item.tag && <b className="shk-byo__item-tag">{item.tag}</b>}
      </span>
      <span className="shk-byo__item-th">{item.th}</span>
    </li>
  );
}

/* The badge, and the reason this screen was rebuilt. A flat list of forty-five
   names can say "lots"; it cannot say "four of these, one of those". A column
   with a count on top of it says the rule without a sentence, in a script the
   guest does not have to be able to read. */
function Group({ group }) {
  return (
    <section className={`shk-byo__group${group.wide ? " is-wide" : ""}`}>
      <header className="shk-byo__group-head">
        <span className="shk-byo__pick num" aria-hidden="true">
          ×{group.pick}
        </span>
        <span className="shk-byo__group-names">
          <span className="shk-byo__group-en">{group.en}</span>
          <span className="shk-byo__group-th">{group.th}</span>
        </span>
      </header>
      <ul className="shk-byo__group-list">
        {group.items.map((item) => (
          <Item item={item} key={item.en} />
        ))}
      </ul>
    </section>
  );
}

/* What the guest sees when the counting stops. It sits below the rule rather
   than inside it, and it is the widest thing on the screen, because the point
   of an allowance board is that the last thing you read is generous. */
function FreeStrip({ free }) {
  return (
    <section className="shk-byo__free">
      <header className="shk-byo__free-head">
        <span className="shk-byo__free-label">{free.label}</span>
        <span className="shk-byo__free-en">{free.en}</span>
        <span className="shk-byo__free-th">{free.th}</span>
      </header>
      <ul className="shk-byo__free-list">
        {free.items.map((item) => (
          <Item item={item} key={item.en} />
        ))}
      </ul>
    </section>
  );
}

/* Counted, never typed: the badge says what is on the bar, and the bar is this
   list. A board that promises more toppings than the salad bar has is a board
   the guest catches out from three metres away. */
function countOf(step) {
  if (step.items) return step.items.length;
  return (
    step.groups.reduce((n, g) => n + g.items.length, 0) + step.free.items.length
  );
}

function StepScreen({ step, on, premium }) {
  const isGroups = step.layout === "groups";
  // Only the plain lists carry a surcharge now — under the allowance the
  // premium marks came off the toppings entirely (see byoCatalog.js).
  const hasPremium = Boolean(step.items?.some((i) => i.premium));

  return (
    /* data-step drives the type scale: eight bases and forty-three toppings
       cannot share a font size without one screen looking starved and the
       other looking cramped. Four steps, four explicit scales, in the CSS. */
    <section
      className={`shk-byo__screen${on ? " is-on" : ""}`}
      data-step={step.code}
      aria-hidden={!on}
    >
      <header className="shk-byo__head">
        <span className="shk-byo__n" aria-hidden="true">
          {step.n}
        </span>
        <div className="shk-byo__headings">
          <h2 className="shk-byo__title">{step.en}</h2>
          <p className="shk-byo__title-th">{step.th}</p>
        </div>
        <p className="shk-byo__count">
          <span className="shk-byo__count-n num">{countOf(step)}</span>
          <span className="shk-byo__count-label">to choose from</span>
        </p>
      </header>

      {/* Two numbers, deliberately, and only on the topping screen: 45 on the
          bar, 11 in the bowl. Abundance in the header, the rule in the line
          under it — in that order, because a guest who reads the limit before
          the range reads a restriction rather than an offer. */}
      <p className="shk-byo__tag">
        <span>
          {isGroups && (
            <b className="shk-byo__tag-n num">{PICKS_INCLUDED}&nbsp;</b>
          )}
          {step.tagline}
        </span>
        <em>{step.taglineTh}</em>
      </p>

      {isGroups ? (
        <div className="shk-byo__groups">
          {step.groups.map((g) => (
            <Group group={g} key={g.en} />
          ))}
          <FreeStrip free={step.free} />
        </div>
      ) : (
        /* CSS columns rather than a grid: the plain lists are different lengths
           (8 bases, 17 dressings) and columns let each screen fill its own
           width without a bespoke grid definition per step. The topping screen
           is the one that needed real columns, and it has its own branch. */
        <ul className="shk-byo__grid" style={{ columnCount: step.columns }}>
          {step.items.map((item) => (
            <Item item={item} key={item.en} />
          ))}
        </ul>
      )}

      {hasPremium && (
        <p className="shk-byo__legend">
          <span className="shk-byo__dot" aria-hidden="true" />
          add {premium} {CURRENCY}
          <em>คิดเพิ่ม {premium} บาท</em>
        </p>
      )}
    </section>
  );
}

/* --- board --------------------------------------------------------------- */

export default function BuildBoard() {
  const { seconds, price, premium } = useMemo(knobs, []);
  const [idx, setIdx] = useState(0);
  useWakeLock();

  /*
    Screen dwell is not uniform, and that is the point. The style screen is the
    one a guest has to actually decide from, and the topping screen carries
    forty-five names in six counted groups — you cannot read either in the time
    it takes to register "01 Choose your base", which has eight. Weighting the
    loop rather than slowing all of it keeps the whole journey inside the ~90
    seconds someone spends queueing.
  */
  const screens = useMemo(
    () => [
      { key: "hero", hold: 1.6 },
      ...STEPS.map((step) => ({
        key: step.code,
        step,
        hold: step.code === "topping" ? 1.8 : 1,
      })),
    ],
    [],
  );

  const current = screens[idx];
  const ms = Math.round(seconds * current.hold * 1000);

  /*
    A timeout per screen rather than one interval, because the dwell varies.
    Re-running on `idx` is what makes each screen set its own next deadline.
  */
  useEffect(() => {
    const id = setTimeout(() => {
      setIdx((n) => {
        const next = (n + 1) % screens.length;
        // Only at the top of the loop, so a reload never eats a screen midway.
        if (next === 0 && performance.now() > RELOAD_AFTER_MS) {
          window.location.reload();
        }
        return next;
      });
    }, ms);
    return () => clearTimeout(id);
  }, [idx, ms, screens.length]);

  /*
    Unlike the dish board, every screen stays mounted. That board keeps a
    three-slide window because each slide holds a decoded full-screen
    photograph and eighteen of those will take a smart-TV browser down inside
    an hour. This one is text — five screens of it weighs nothing, and mounting
    them all means the crossfade never has to wait on a mount.
  */
  return (
    <div className="shk-board shk-byo">
      <div className="shk-board__stage">
        {screens.map((s, i) =>
          s.key === "hero" ? (
            <StyleScreen key={s.key} on={i === idx} price={price} />
          ) : (
            <StepScreen key={s.key} step={s.step} on={i === idx} premium={premium} />
          ),
        )}
      </div>

      {/* Where you are in the journey. A guest who glances up mid-loop can see
          there are four steps and that this is the second — which is most of
          what the board is trying to communicate. */}
      <ol className="shk-byo__dots" aria-hidden="true">
        {screens.map((s, i) => (
          <li key={s.key} className={`shk-byo__dot-i${i === idx ? " is-on" : ""}`} />
        ))}
      </ol>

      <img
        className="shk-board__mark"
        src="/assets/logo-mark-white.png"
        alt=""
        aria-hidden="true"
      />

      {/* Keyed on the index so the fill restarts with every screen, and given
          this screen's own duration so the bar tells the truth on the long
          topping screen instead of finishing early and sitting full. */}
      <div className="shk-board__bar" aria-hidden="true">
        <span
          key={idx}
          className="shk-board__bar-fill"
          style={{ animationDuration: `${ms}ms` }}
        />
      </div>

      {/* One line of screen-reader text for the whole board. The board is a
          wall fixture with no keyboard and no focus, but /board is a real URL
          that a crawler or a screen reader can land on, and five aria-hidden
          sections would otherwise leave it silent. */}
      <p className="shk-sr-only">
        Build your own salad, bowl, wrap or cup — {TOPPING_COUNT} toppings on the
        bar, {PICKS_INCLUDED} picks included, flat price {price} {CURRENCY}.
      </p>
    </div>
  );
}

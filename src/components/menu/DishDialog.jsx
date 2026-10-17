import { useState, useEffect, useRef } from "react";
import { CalorieDonut } from "../nutrition/CalorieDonut.jsx";
import { MacroBar } from "../nutrition/MacroBar.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { IconButton } from "../primitives/IconButton.jsx";
import { ModifierBuilder } from "./ModifierBuilder.jsx";
import { BenefitPills } from "./BenefitPills.jsx";
import { XIcon, ShareIcon, ClockIcon, PlusIcon, MinusIcon } from "../Icons.jsx";
import { optimizedSrc } from "../../lib/img.js";
import { t, unit } from "../../i18n/index.js";

/*
  There are deliberately NO diet or allergen tags in this dialog. The CEO took
  them off the public site (2026-10-18): the allergen "Contains" chips were
  visual noise, and diet tags are held back until the derivation mechanism in
  shishka-os docs/plans/spec-diet-tags-derivation.md exists and a human has
  reviewed each dish. The dialog's disclaimer still tells a guest to ask the
  team about allergies — that line is the disclosure, and it stays.

  To bring any of it back, do not just re-render `dish.allergens`: 40 of 81
  dishes have unreviewed BOM lines (fn_dish_allergen_status confident:false),
  so an empty list means "unknown", never "free of".
*/

/*
  `sheet` (SPEC §3) turns this dialog into the mobile bottom sheet: it slides up
  to viewport height − 56 px, closes by swipe down as well as by ✕, scrim tap,
  Escape and browser Back, and its Add button moves into a pinned bottom bar
  with a quantity stepper. Desktop never passes it — above 1024 px there is no
  dish pop-up at all (§4.5), the full card carries everything inline.
*/
export function DishDialog({ open, onClose, dish, onShare, onAdd, sheet = false }) {
  const dialogRef = useRef(null);
  // Quantity for the pinned bar. Reset per dish, never per render, so a
  // re-render while the guest is on 3 does not snap it back to 1.
  const [qty, setQty] = useState(1);
  // Live finger offset while a swipe-down is in progress, in px. null = not
  // dragging, which is also what tells the CSS to animate back into place.
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const node = dialogRef.current;
    // preventScroll: focusing the (tall) sheet must not scroll the scrim and bury
    // the photo. Also reset the scrim to the top so every open starts at the photo.
    node?.focus({ preventScroll: true });
    // Which element scrolls depends on the shape: the scrim for the centred
    // dialog, the sheet itself for the bottom sheet (it is a fixed-height box
    // with a pinned bar). Reset both — the other one is a no-op.
    const scroller = node?.parentElement; // .shk-dlg__scrim
    if (scroller) scroller.scrollTop = 0;
    if (node) node.scrollTop = 0;
    const onKey = (e) => {
      if (e.key === "Escape") return onClose?.();
      if (e.key !== "Tab" || !node) return;
      const f = node.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [dish?.image_url]);

  // Current build reported by the ModifierBuilder: selected options, configured
  // total, requiredMet flag, and the add-ons' nutrition (for the live counter).
  // Reset when the dish changes.
  const [build, setBuild] = useState(null);
  useEffect(() => setBuild(null), [dish?.id]);
  useEffect(() => {
    setQty(1);
    setDrag(null);
    dragRef.current = null;
  }, [dish?.id, open]);

  if (!open || !dish) return null;
  const {
    name, description, price, priceDefault = null, priceFrom = null, currency = "฿", image, image_url,
    calories, protein = 0, carbs = 0, fat = 0,
    badges = [], benefits = [],
    category, portion_size, portion_unit, ingredients,
    modifierGroups = [],
  } = dish;
  const photo = image ?? image_url;
  // Build-your-own dishes (a required modifier group) price "from ฿X": the base
  // plus the cheapest mandatory add-ons. The flat base alone isn't orderable.
  const buildYourOwn = priceFrom != null;
  const configurable = modifierGroups.length > 0;
  // A build-your-own dish can only be ordered once its required minimums are met.
  const canAdd = !buildYourOwn || (build?.requiredMet ?? false);
  // Headline price: a dish with a default-configured add-on (e.g. a dip served
  // with a bun) opens at that default total (฿149). Once the guest changes the
  // build, follow the live configured total so the header/CTA stay honest.
  const headlinePrice = build?.total ?? priceDefault ?? price;

  // Base dish nutrition + selected add-ons → live values for the donut/macros.
  const added = build?.nutrition ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const round1 = (n) => Math.round(n * 10) / 10;
  const liveCalories = calories != null ? calories + added.calories : (added.calories || null);
  const liveProtein = round1((protein || 0) + added.protein);
  const liveCarbs = round1((carbs || 0) + added.carbs);
  const liveFat = round1((fat || 0) + added.fat);

  /*
    Swipe down to dismiss (§3). Deliberately narrow: the gesture only arms when
    the sheet is already scrolled to its top, so a flick while reading the
    ingredients scrolls the sheet instead of throwing it off the screen. Pulling
    UP does nothing — the sheet is already as tall as it goes.
  */
  const DISMISS_PX = 110;
  const swipe = !sheet
    ? {}
    : {
        onTouchStart: (e) => {
          const scroller = dialogRef.current;
          if (!scroller || scroller.scrollTop > 0) return;
          dragRef.current = e.touches[0].clientY;
        },
        onTouchMove: (e) => {
          if (dragRef.current == null) return;
          const dy = e.touches[0].clientY - dragRef.current;
          setDrag(dy > 0 ? dy : 0);
        },
        onTouchEnd: () => {
          const dy = drag ?? 0;
          dragRef.current = null;
          setDrag(null);
          if (dy > DISMISS_PX) onClose?.();
        },
      };

  const qtyTotal =
    headlinePrice != null ? `${currency}${Math.round(headlinePrice * qty)}` : null;

  return (
    <div
      className={`shk-dlg__scrim${sheet ? " shk-dlg__scrim--sheet" : ""}`}
      onClick={onClose}
    >
      <div
        className={`shk-dlg${sheet ? " shk-dlg--sheet" : ""}`}
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={name}
        onClick={(e) => e.stopPropagation()}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
        {...swipe}
      >
        {/* Sticky bar: first child so position:sticky pins the Close button to the
            top of the screen through any amount of scroll — the guest can always exit. */}
        <div className="shk-dlg__topbtns">
          <div className="shk-dlg__flags">
            {badges.map((b, i) => (
              <Badge key={i} tone={b.tone || "solid-gold"} icon={b.icon}>{b.label}</Badge>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {onShare && (
              <IconButton label={t("dlg.share")} variant="solid" onClick={onShare}>
                <ShareIcon />
              </IconButton>
            )}
            <IconButton label={t("dlg.close")} variant="solid" onClick={onClose}>
              <XIcon />
            </IconButton>
          </div>
        </div>
        <div className="shk-dlg__media">
          {photo && imgOk ? (
            <>
              <img
                className="shk-dlg__img"
                src={optimizedSrc(photo, 960)}
                alt={name}
                onError={() => setImgOk(false)}
              />
              <span className="shk-dlg__media-scrim" />
            </>
          ) : (
            <div className="shk-dlg__ph" aria-hidden="true">
              <img className="shk-dlg__ph-logo" src="/assets/logo-mark-green.png" alt="" />
              {category && <div className="shk-dlg__ph-word">{category}</div>}
            </div>
          )}
        </div>

        <div className="shk-dlg__body">
          <div className="shk-dlg__head">
            <h2 className="shk-dlg__title">{name}</h2>
            {buildYourOwn ? (
              <span className="shk-dlg__price">
                <span className="shk-dlg__from">{t("card.from")} </span>{currency}{priceFrom}
              </span>
            ) : (
              headlinePrice != null && (
                <span className="shk-dlg__price">{currency}{headlinePrice}</span>
              )
            )}
          </div>

          {portion_size != null && (
            <div className="shk-dlg__meta">
              <ClockIcon />
              {portion_size}{unit(portion_unit)}
            </div>
          )}

          {description && <p className="shk-dlg__desc">{description}</p>}

          {modifierGroups.length > 0 && (
            <ModifierBuilder
              key={dish.id}
              basePrice={price ?? 0}
              currency={currency}
              groups={modifierGroups}
              onChange={setBuild}
            />
          )}

          {/* In sheet mode the Add button lives in the pinned bar below, with the
              quantity stepper (§3). Two Add buttons would be two answers to the
              same question. */}
          {!sheet && onAdd && (
            <button
              type="button"
              className="shk-dlg__add"
              onClick={() => onAdd(build)}
              disabled={!canAdd}
            >
              {configurable
                ? canAdd
                  ? `${t("dlg.addToOrder")} · ${currency}${build?.total ?? priceDefault ?? priceFrom ?? price}`
                  : t("dlg.pickRequired")
                : `${t("dlg.addToOrder")}${price != null ? ` · ${currency}${price}` : ""}`}
            </button>
          )}

          <div className="shk-dlg__nutri">
            <CalorieDonut kcal={liveCalories} protein={liveProtein} carbs={liveCarbs} fat={liveFat} size={104} thickness={11} />
            <div className="shk-dlg__nutri-bars">
              <MacroBar protein={liveProtein} carbs={liveCarbs} fat={liveFat} />
            </div>
          </div>

          {benefits.length > 0 && (
            <div>
              <div className="shk-dlg__section-label">{t("dlg.benefits")}</div>
              <BenefitPills benefits={benefits} />
            </div>
          )}

          {ingredients && (
            <div>
              <div className="shk-dlg__section-label">{t("dlg.ingredients")}</div>
              <p className="shk-dlg__ingredients">{ingredients}</p>
            </div>
          )}

          <p className="shk-dlg__disclaimer">
            {t("dlg.disclaimer")}
          </p>
        </div>

        {/* Pinned bottom bar (§3): quantity stepper + "Add to order · ฿<price ×
            qty>". Sticky inside the sheet's own scroller, so it is reachable
            without scrolling to the end of the allergen list. The stepper caps
            at 20 — past that it is a catering order, which is a phone call. */}
        {sheet && onAdd && (
          <div className="shk-dlg__bar">
            <div className="shk-dlg__step" role="group" aria-label={t("sheet.qty")}>
              <button
                type="button"
                className="shk-dlg__step-btn"
                aria-label={t("sheet.fewer")}
                disabled={qty <= 1}
                onClick={() => setQty((n) => Math.max(1, n - 1))}
              >
                <MinusIcon size={18} />
              </button>
              <span className="shk-dlg__step-num num" aria-live="polite">{qty}</span>
              <button
                type="button"
                className="shk-dlg__step-btn"
                aria-label={t("sheet.more")}
                disabled={qty >= 20}
                onClick={() => setQty((n) => Math.min(20, n + 1))}
              >
                <PlusIcon size={18} />
              </button>
            </div>
            <button
              type="button"
              className="shk-dlg__bar-add"
              onClick={() => onAdd(build, qty)}
              disabled={!canAdd}
            >
              {canAdd
                ? qtyTotal
                  ? t("sheet.addQty", { total: qtyTotal })
                  : t("dlg.addToOrder")
                : t("dlg.pickRequired")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

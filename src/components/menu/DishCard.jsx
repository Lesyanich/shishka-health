import { useState, useEffect } from "react";
import { DietTag } from "../filters/DietTag.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { StarIcon, PlusIcon, CheckIcon } from "../Icons.jsx";
import { PriceSeal } from "./PriceSeal.jsx";
import { KcalSeal } from "./KcalSeal.jsx";
import { optimizedSrc } from "../../lib/img.js";
import { t, unit } from "../../i18n/index.js";

/*
  DishCard renders in two generations at once.

  `variant="legacy"` (the default) is the pre-redesign cut-out tile that
  App.jsx still mounts — untouched, so this PR changes nothing a guest sees.
  It goes away in PR 4, when the app switches to the variants below.

  Redesign variants (spec §5, the `.shk-dish` family):
    grid-compact  mobile 2-col grid — photo, kcal seal, name, price, round "+"
    grid-full     desktop 3-col     — everything inline: description, macro
                  tiles, weight/allergens, a labelled Add button, no dialog
    list-row      drinks and dips   — 76px photo left, name and price right

  `grid-full` has no open target on purpose: desktop has no dish pop-up at all
  (spec §4), so the card is a document, not a control. Only Add is interactive.

  A11y. The legacy tile is a <div role="button"> with the PriceSeal <button>
  nested inside it — a control inside a control, which is why MASTER's "MUST
  stay a real <button>" note never actually held. The redesign splits them: the
  dish name is a real <button> whose ::after is stretched across the card (one
  tab stop, whole-card hit area), and "+" is a sibling layered above it. Two
  controls, no nesting.
*/

// Macros read as whole grams on the tile; the dish dialog keeps the exact figure.
const g = (n) => Math.round(Number(n) || 0);

function Placeholder({ category }) {
  return (
    <div className="shk-card__ph" aria-hidden="true">
      <img className="shk-card__ph-logo" src="/assets/logo-mark-green.png" alt="" />
      {category && <div className="shk-card__ph-cat">{category}</div>}
    </div>
  );
}

export function DishCard({ variant = "legacy", ...props }) {
  if (variant !== "legacy") return <DishCardNext variant={variant} {...props} />;
  return <DishCardLegacy {...props} />;
}

/* ------------------------------------------------------------ redesign card */

function DishCardNext({
  name,
  nameLocal = null,
  description,
  price,
  currency = "฿",
  image = null,
  kcal,
  weight,
  weightUnit = "g",
  protein = 0,
  carbs = 0,
  fat = 0,
  allergens = [],
  highProtein = false,
  category,
  variant,
  comingSoon = false,
  soldOut = false,
  added = false,
  onClick,
  onQuickAdd,
  className = "",
  ...rest
}) {
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [image]);
  const showImg = image && imgOk;

  const full = variant === "grid-full";
  // Only ORDERING is gated for a dish you cannot buy today; reading about it
  // is not (same call the legacy tile makes, see its comment).
  const addable = !comingSoon && !soldOut && typeof onQuickAdd === "function";
  const openable = !full && typeof onClick === "function";

  const cls = [
    "shk-dish",
    `shk-dish--${variant}`,
    added ? "is-added" : "",
    soldOut ? "is-soldout" : "",
    comingSoon ? "is-coming-soon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const addLabel = added
    ? t("dish.inOrder", { name })
    : t("card.addToOrder", { name });

  const addButton = (shape) => (
    <button
      type="button"
      className={`shk-dish__add shk-dish__add--${shape}`}
      aria-label={addLabel}
      aria-pressed={added}
      onClick={onQuickAdd}
    >
      {added ? <CheckIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
      {shape === "pill" && (
        <span>{added ? t("dish.added") : t("dish.add")}</span>
      )}
    </button>
  );

  return (
    <article className={cls} {...rest}>
      <div className="shk-dish__media">
        {showImg ? (
          <img
            className="shk-dish__img"
            src={optimizedSrc(image, 640)}
            alt={name}
            loading="lazy"
            onError={() => setImgOk(false)}
          />
        ) : (
          <Placeholder category={category} />
        )}

        {kcal != null && (
          <KcalSeal className="shk-dish__seal" kcal={kcal} size={full ? "lg" : "md"} />
        )}

        {highProtein && <span className="shk-dish__hp">{t("dish.highProtein")}</span>}
        {soldOut && <span className="shk-dish__soldout">{t("dish.soldOut")}</span>}

        {/* The round "+" rides on the photo (compact and list only). Sibling of
            the open button, never its child, and layered above the stretched
            hit area so it stays independently clickable. */}
        {!full && addable && addButton("fab")}
      </div>

      <div className="shk-dish__head">
        <div className="shk-dish__titles">
          <h3 className="shk-dish__name">
            {openable ? (
              <button type="button" className="shk-dish__open" onClick={onClick}>
                {name}
              </button>
            ) : (
              name
            )}
          </h3>
          {/* The guest's language, small and light, under the English name. Not part of
              the heading: the accessible name of the open button stays the English one. */}
          {nameLocal && <span className="shk-dish__sub">{nameLocal}</span>}
        </div>
        {price != null && (
          <span className="shk-dish__price">
            {currency}
            {price}
          </span>
        )}
      </div>

      {full && description && <p className="shk-dish__desc">{description}</p>}

      {full && (protein > 0 || carbs > 0 || fat > 0) && (
        <div className="shk-dish__macros">
          {[
            ["protein", protein, t("dish.macroProtein")],
            ["carbs", carbs, t("dish.macroCarbs")],
            ["fat", fat, t("dish.macroFat")],
          ].map(([key, value, label]) => (
            <div key={key} className={`shk-dish__macro shk-dish__macro--${key}`}>
              <span className="shk-dish__macro-val">
                {g(value)}
                <small>{unit("g")}</small>
              </span>
              <span className="shk-dish__macro-key">{label}</span>
            </div>
          ))}
        </div>
      )}

      {full && (
        <div className="shk-dish__foot">
          <span className="shk-dish__meta">
            {[
              weight != null ? `${weight}${unit(weightUnit)}` : null,
              allergens.length ? allergens.join(", ") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {addable && addButton("pill")}
        </div>
      )}
    </article>
  );
}

/* ------------------------------- legacy cut-out tile (removed in PR 4) ----- */

function DishCardLegacy({
  name,
  description,
  price,
  priceFrom = null,
  currency = "฿",
  image = null,
  kcal,
  weight,
  weightUnit = "g",
  // The tile shows kcal only; P/C/F live in the dish dialog. These three are
  // still destructured so they do not fall through ...rest onto the DOM node.
  protein: _protein,
  carbs: _carbs,
  fat: _fat,
  diets = [],
  badges = [],
  rating,
  category,
  layout = "tile",
  comingSoon = false,
  added = false,
  onClick,
  onQuickAdd,
  className = "",
  ...rest
}) {
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => setImgOk(true), [image]);
  const showImg = image && imgOk;
  const cls = [
    "shk-card",
    layout === "row" ? "shk-card--row" : "",
    comingSoon ? "shk-card--coming-soon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    /*
      Coming-soon cards open their dialog like any other. Only ORDERING is
      gated (the quick-add seal below) — the description, photo and nutrition
      are information a guest is entitled to whether or not the dish is in
      stock today, and a tile that silently swallows a click reads as broken.
      So: no aria-disabled, no tabIndex -1, no stripped handler.
    */
    <div
      className={cls}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      {...rest}
    >
      <div className="shk-card__media">
        {showImg ? (
          <>
            <img
              className="shk-card__img"
              src={optimizedSrc(image, 640)}
              alt={name}
              loading="lazy"
              onError={() => setImgOk(false)}
            />
            <span className="shk-card__media-scrim" />
          </>
        ) : (
          <Placeholder category={category} />
        )}

        {badges.length > 0 && (
          <div className="shk-card__flags">
            {badges.map((b, i) => (
              <Badge key={i} tone={b.tone || "solid-gold"} icon={b.icon}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {price != null ? (
        <div className="shk-card__corner">
          <PriceSeal
            price={price}
            size={59}
            active={added}
            onClick={!comingSoon && onQuickAdd ? (e) => { e.stopPropagation(); onQuickAdd(); } : undefined}
            label={!comingSoon && onQuickAdd ? t("card.addToOrder", { name }) : t("card.priceLabel", { name, price })}
          />
        </div>
      ) : priceFrom != null ? (
        <div className="shk-card__corner">
          <span className="shk-card__pricefrom">{t("card.from")} {currency}{priceFrom}</span>
        </div>
      ) : null}

      <div className="shk-card__body">
        {kcal != null && (
          <span className="shk-card__kcal-pill">
            <b>{kcal}</b> {t("card.kcal")}
          </span>
        )}

        <div className="shk-card__topline">
          <span className="shk-card__name">{name}</span>
        </div>

        {(kcal != null || weight != null) && (
          <div className="shk-card__meta">
            {kcal != null && (
              <span className="shk-card__meta-item shk-card__meta-item--kcal">
                <b>{kcal}</b> {t("card.kcal")}
              </span>
            )}
            {weight != null && (
              <span className="shk-card__meta-item">
                <b>{weight}</b>{unit(weightUnit)}
              </span>
            )}
          </div>
        )}

        {description && <p className="shk-card__desc">{description}</p>}

        <div className="shk-card__foot">
          <div className="shk-card__diets">
            {diets.slice(0, 3).map((d) => (
              <DietTag key={d} type={d} iconOnly />
            ))}
          </div>
          {rating != null && (
            <span className="shk-card__rating"><StarIcon />{rating}</span>
          )}
        </div>
      </div>
    </div>
  );
}

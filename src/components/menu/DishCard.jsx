import { useState, useEffect } from "react";
import { DietTag } from "../filters/DietTag.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { StarIcon, PlusIcon } from "../Icons.jsx";
import { MacroBar } from "../nutrition/MacroBar.jsx";

function Placeholder({ category }) {
  return (
    <div className="shk-card__ph" aria-hidden="true">
      <img className="shk-card__ph-logo" src="/assets/logo-mark-white.png" alt="" />
      {category && <div className="shk-card__ph-cat">{category}</div>}
    </div>
  );
}

export function DishCard({
  name,
  description,
  price,
  priceFrom = null,
  currency = "฿",
  image = null,
  kcal,
  weight,
  weightUnit = "g",
  protein = 0,
  carbs = 0,
  fat = 0,
  diets = [],
  badges = [],
  rating,
  category,
  layout = "tile",
  comingSoon = false,
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
    <div
      className={cls}
      role="button"
      tabIndex={comingSoon ? -1 : 0}
      onClick={comingSoon ? undefined : onClick}
      onKeyDown={
        comingSoon
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
      }
      aria-disabled={comingSoon || undefined}
      {...rest}
    >
      <div className="shk-card__media">
        {showImg ? (
          <>
            <img
              className="shk-card__img"
              src={image}
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

      <div className="shk-card__body">
        <div className="shk-card__topline">
          <span className="shk-card__name">{name}</span>
          <span className="shk-card__priceblock">
            {priceFrom != null ? (
              <span className="shk-card__price">
                <span className="shk-card__from">from </span>{currency}{priceFrom}
              </span>
            ) : (
              price != null && (
                <span className="shk-card__price">
                  {currency}{price}
                </span>
              )
            )}
            {!comingSoon && onQuickAdd && price != null && (
              <button
                type="button"
                className="shk-quickadd"
                onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
                aria-label={`Add ${name} to order`}
                title={`Add ${name} to order`}
              >
                <PlusIcon size={14} strokeWidth={2.5} />
              </button>
            )}
          </span>
        </div>

        {(kcal != null || weight != null) && (
          <div className="shk-card__meta">
            {kcal != null && (
              <span className="shk-card__meta-item shk-card__meta-item--kcal">
                <b>{kcal}</b> kcal
              </span>
            )}
            {weight != null && (
              <span className="shk-card__meta-item">
                <b>{weight}</b>{weightUnit}
              </span>
            )}
          </div>
        )}

        {(protein > 0 || carbs > 0 || fat > 0) && (
          <MacroBar
            protein={protein}
            carbs={carbs}
            fat={fat}
            compact
            className="shk-card__macro"
          />
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

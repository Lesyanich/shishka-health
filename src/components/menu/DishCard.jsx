import { useState, useEffect } from "react";
import { DietTag } from "../filters/DietTag.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { StarIcon } from "../Icons.jsx";
import { PriceSeal } from "./PriceSeal.jsx";

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

      {price != null ? (
        <div className="shk-card__corner">
          <PriceSeal
            price={price}
            size={59}
            active={added}
            onClick={!comingSoon && onQuickAdd ? (e) => { e.stopPropagation(); onQuickAdd(); } : undefined}
            label={!comingSoon && onQuickAdd ? `Add ${name} to order` : `${name} ${price} thb`}
          />
        </div>
      ) : priceFrom != null ? (
        <div className="shk-card__corner">
          <span className="shk-card__pricefrom">from {currency}{priceFrom}</span>
        </div>
      ) : null}

      <div className="shk-card__body">
        <div className="shk-card__topline">
          <span className="shk-card__name">{name}</span>
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

/*
  CategoryTile — the mobile home screen is a grid of these: one tile per menu
  category, grouped EAT / DRINK / SWEET. Tapping one opens that category.

  Four variants (spec §5, sizes read off docs/redesign/mockups/A2-home-full):
    featured  full width, 156px, two overlapping cut-outs — Salads & Bowls
    regular   half width, 132px, one cut-out top-right — the default
    row       full width, 84px, cut-out left + chevron — short lists
    soon      dashed outline, no photo, NOT clickable — a category that is
              entirely coming soon (today: Fresh juices)

  `band` only changes the wash behind the tile; it does not change the shape.
  DRINK tiles additionally sit shorter (120px) and SWEET rows taller (96px) —
  that is the mockup's own rhythm, carried here as a band-scoped height.

  A tile is navigation, so it renders as <a>. `soon` has no destination, so it
  renders as a plain <div> and stays out of the tab order entirely rather than
  offering a target that does nothing.
*/

import { ChevronRightIcon } from "../Icons.jsx";

export function CategoryTile({
  name,
  meta,
  eyebrow,
  images = [],
  href,
  variant = "regular",
  band = "default",
  className = "",
  ...rest
}) {
  const soon = variant === "soon";
  const cls = [
    "shk-ctile",
    `shk-ctile--${variant}`,
    band !== "default" ? `shk-ctile--${band}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      {/* Decorative food cut-outs: the tile is already labelled by its name,
          so they carry no alt text. `featured` stacks two. */}
      {!soon &&
        images.slice(0, variant === "featured" ? 2 : 1).map((src, i) => (
          <img
            key={src || i}
            className={`shk-ctile__img shk-ctile__img--${i + 1}`}
            src={src}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        ))}

      <span className="shk-ctile__text">
        {eyebrow && <span className="shk-ctile__eyebrow">{eyebrow}</span>}
        <span className="shk-ctile__name">{name}</span>
        {meta && <span className="shk-ctile__meta">{meta}</span>}
      </span>

      {variant === "row" && (
        <ChevronRightIcon className="shk-ctile__chevron" aria-hidden="true" />
      )}
    </>
  );

  if (soon) {
    return (
      <div className={cls} {...rest}>
        {body}
      </div>
    );
  }

  return (
    <a className={cls} href={href} {...rest}>
      {body}
    </a>
  );
}

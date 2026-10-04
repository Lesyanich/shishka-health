/*
  PriceSeal — the price + quick-add rendered as ONE solid-filled circle (see
  colors.css for the --seal-bg palette: default royal-green, with per-section
  overrides like .shk-seal--purple / .shk-seal--honey passed in via
  `className` from the section the dish belongs to). Inside, stacked: a "+"
  (add), the price number, and the currency. The whole seal is the add
  button. When not interactive (no onClick) it renders as a static price
  stamp. "In your order" always wins the fill colour (see .shk-seal--active)
  regardless of section, so the cart-feedback signal stays universal.
*/

export function PriceSeal({ price, currency = "thb", size = 58, fill = false, active = false, onClick, label, className = "" }) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";
  // `fill` lets a parent (e.g. the manakish disc) size the seal via CSS so it
  // matches the food images; otherwise it's a fixed `size` px circle.
  // `active` = the dish is in the order → the circle goes "selected" red.
  return (
    <Tag
      type={interactive ? "button" : undefined}
      className={`shk-seal${active ? " shk-seal--active" : ""}${className ? ` ${className}` : ""}`}
      style={fill ? undefined : { width: size, height: size, fontSize: `${(size * 0.34).toFixed(1)}px` }}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <span className="shk-seal__stack">
        {interactive && <span className="shk-seal__plus">+</span>}
        <span className="shk-seal__num">{price}</span>
        <span className="shk-seal__cur">{currency}</span>
      </span>
    </Tag>
  );
}

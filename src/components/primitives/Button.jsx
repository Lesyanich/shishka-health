export function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  icon = null,
  iconRight = null,
  as: Tag = "button",
  className = "",
  ...rest
}) {
  const cls = [
    "shk-btn",
    `shk-btn--${variant}`,
    `shk-btn--${size}`,
    block ? "shk-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls} {...rest}>
      {icon ? <span className="shk-btn__icon">{icon}</span> : null}
      {children}
      {iconRight ? <span className="shk-btn__icon">{iconRight}</span> : null}
    </Tag>
  );
}

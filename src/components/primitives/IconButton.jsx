export function IconButton({
  children,
  label,
  variant = "plain",
  size = "md",
  className = "",
  ...rest
}) {
  const cls = [
    "shk-iconbtn",
    variant !== "plain" ? `shk-iconbtn--${variant}` : "",
    size !== "md" ? `shk-iconbtn--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

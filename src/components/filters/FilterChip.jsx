export function FilterChip({
  children,
  icon,
  active = false,
  exclude = false,
  onClick,
  className = "",
  ...rest
}) {
  const cls = ["shk-chip", exclude ? "shk-chip--exclude" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={cls}
      aria-pressed={active}
      onClick={onClick}
      {...rest}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

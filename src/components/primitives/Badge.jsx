export function Badge({ children, tone = "neutral", icon = null, className = "", ...rest }) {
  const cls = ["shk-badge", `shk-badge--${tone}`, className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {icon}
      {children}
    </span>
  );
}

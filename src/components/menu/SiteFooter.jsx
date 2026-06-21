export function SiteFooter({ wide = false }) {
  const year = new Date().getFullYear();
  return (
    <footer className={`shk-foot ${wide ? "shk-foot--wide" : ""}`}>
      <div className="shk-foot__inner">
        <img
          className="shk-foot__logo"
          src="/assets/logo-full-white.png"
          alt="Shishka Healthy Kitchen"
        />

        <div className="shk-foot__rule" aria-hidden="true" />

        <p className="shk-foot__fine">Nutrition &amp; prices update live</p>
        <p className="shk-foot__fine shk-foot__copy">
          © {year} Shishka Healthy Kitchen · Phuket
        </p>
      </div>
    </footer>
  );
}

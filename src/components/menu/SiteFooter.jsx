export function SiteFooter({ wide = false, instagramUrl }) {
  const year = new Date().getFullYear();
  return (
    <footer className={`shk-foot ${wide ? "shk-foot--wide" : ""}`}>
      <div className="shk-foot__inner">
        <img
          className="shk-foot__mark"
          src="/assets/logo-mark-white.png"
          alt="Shishka"
          width="48"
          height="48"
        />
        <p className="shk-foot__name">Shishka Healthy Kitchen</p>
        <p className="shk-foot__tagline">from the soil to the soul.</p>

        {instagramUrl && (
          <nav className="shk-foot__links" aria-label="Social">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
          </nav>
        )}

        <div className="shk-foot__rule" aria-hidden="true" />

        <p className="shk-foot__fine">
          Nutrition &amp; prices update live
        </p>
        <p className="shk-foot__fine shk-foot__copy">
          © {year} Shishka Healthy Kitchen · Phuket
        </p>
      </div>
    </footer>
  );
}

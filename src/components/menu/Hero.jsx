export function Hero({ wide = false }) {
  return (
    <section className={`shk-hero ${wide ? "shk-hero--wide" : ""}`} aria-label="Shishka Healthy Kitchen">
      <img className="shk-hero__bg" src="/assets/hero-saladbar.jpg" alt="" aria-hidden="true" />
      <div className="shk-hero__overlay" aria-hidden="true" />
      <div className="shk-hero__inner">
        <p className="shk-hero__eyebrow">SHiSHKA · Healthy Kitchen</p>
        <h1 className="shk-hero__title">
          from the <span>SOIL</span> to the <span>SOUL</span>.
        </h1>
        <p className="shk-hero__sub">
          fresh, unprocessed, scientifically balanced — real food, made daily.
        </p>
      </div>
    </section>
  );
}

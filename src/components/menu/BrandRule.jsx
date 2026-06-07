const RULES = [
  "seed oils",
  "industrial gluten",
  "fake food",
  "fried food",
  "preservatives",
  "toxic",
];

export function BrandRule({ wide = false }) {
  return (
    <section className={`shk-rule ${wide ? "shk-rule--wide" : ""}`} aria-label="The Rule">
      <div className="shk-rule__inner">
        <p className="shk-rule__eyebrow">the rule</p>
        <h2 className="shk-rule__title">no compromises.</h2>
        <p className="shk-rule__lead">
          we eliminate the noise that harms the human machine, and replace it with
          powerful nutrition that resonates with your DNA.
        </p>
        <ul className="shk-rule__grid">
          {RULES.map((r) => (
            <li key={r} className="shk-rule__pill">
              <span className="shk-rule__no">NO</span>
              <span className="shk-rule__what">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

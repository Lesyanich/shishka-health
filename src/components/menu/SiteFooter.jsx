import { t } from "../../i18n/index.js";
export function SiteFooter({ wide = false }) {
  const year = new Date().getFullYear();
  return (
    <footer className={`shk-foot ${wide ? "shk-foot--wide" : ""}`}>
      <div className="shk-foot__inner">
        <img
          className="shk-foot__logo"
          src="/assets/logo-full-color.png"
          alt="Shishka Healthy Kitchen"
        />

        <div className="shk-foot__rule" aria-hidden="true" />

        <p className="shk-foot__fine">{t("footer.live")}</p>
        <p className="shk-foot__fine shk-foot__copy">
          {t("footer.copy", { year })}
        </p>
      </div>
    </footer>
  );
}

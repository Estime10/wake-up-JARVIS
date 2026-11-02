import { t } from "@/lib/i18n";
import { theme } from "@/lib/theme/tokens";

const COLOR_SWATCHES = [
  { name: "bg", value: theme.color.bg, className: "bg-bg" },
  { name: "surface", value: theme.color.surface, className: "bg-surface" },
  { name: "surface2", value: theme.color.surface2, className: "bg-surface-2" },
  { name: "text", value: theme.color.text, className: "bg-text" },
  {
    name: "textMuted",
    value: theme.color.textMuted,
    className: "bg-text-muted",
  },
  { name: "line", value: theme.color.line, className: "bg-line" },
  { name: "accent", value: theme.color.accent, className: "bg-accent" },
  {
    name: "attention",
    value: theme.color.attention,
    className: "bg-attention",
  },
  { name: "danger", value: theme.color.danger, className: "bg-danger" },
  { name: "success", value: theme.color.success, className: "bg-success" },
] as const;

/** Bloc Tokens — captures Playwright `id="dev-tokens"`. */
export function TokensBlock() {
  return (
    <section id="dev-tokens" className="flex flex-col gap-6">
      <h2 className="t-title text-lg text-accent">{t("dev.tokensTitle")}</h2>

      <div>
        <h3 className="t-label text-sm text-text-muted">
          {t("dev.tokensColors")}
        </h3>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {COLOR_SWATCHES.map((swatch) => (
            <li key={swatch.name} className="flex flex-col gap-1">
              <div
                className={`h-12 rounded-md border border-line-subtle ${swatch.className}`}
              />
              <p className="t-mono text-sm text-text-muted">
                {swatch.name}
                <br />
                {swatch.value}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="t-label text-sm text-text-muted">
          {t("dev.tokensRadii")}
        </h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="size-12 rounded-sm border border-accent bg-surface-2" />
          <div className="size-12 rounded-md border border-accent bg-surface-2" />
          <div className="size-12 rounded-lg border border-accent bg-surface-2" />
        </div>
      </div>

      <div>
        <h3 className="t-label text-sm text-text-muted">
          {t("dev.tokensType")}
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          <p className="t-wordmark text-wordmark text-accent">
            {t("app.name")}
          </p>
          <p className="t-title text-base text-text">
            {t("dev.tokensSampleTitle")}
          </p>
          <p className="t-label text-sm text-text-muted">
            {t("dev.tokensSampleLabel")}
          </p>
          <p className="t-body text-base text-text">
            {t("dev.tokensSampleBody")}
          </p>
          <p className="t-mono text-sm text-text">
            {t("dev.tokensSampleMono")}
          </p>
        </div>
      </div>

      <div>
        <h3 className="t-label text-sm text-text-muted">
          {t("dev.tokensTouch")}
        </h3>
        <div className="mt-3 flex min-h-touch min-w-touch items-center justify-center rounded-md border border-accent bg-surface-2 text-sm text-text">
          {t("dev.tokensSampleTouch")}
        </div>
      </div>
    </section>
  );
}

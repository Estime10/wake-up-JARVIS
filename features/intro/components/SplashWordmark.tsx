import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { t } from "@/lib/i18n";

/** Wordmark — opacity/y via GSAP ; texte via i18n. */
export function SplashWordmark() {
  const label = t("intro.wordmark");

  return (
    <p
      data-intro="wordmark"
      className="t-wordmark text-center text-wordmark-display text-text opacity-0 will-change-transform"
    >
      <span aria-hidden>{label}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </p>
  );
}

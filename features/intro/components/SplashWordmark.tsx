import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { FLIP_ID } from "@/features/jarvis/model/markDom";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type SplashWordmarkProps = {
  /**
   * Visible en CSS. Pendant le boot, laisser `false` : GSAP gère l’opacité
   * des lettres ; après boot → `true` pour figer le nom sous le mark.
   */
  settled?: boolean;
  /** Pendant le boot : pas de `opacity-0` parent (sinon les lettres restent invisibles). */
  bootActive?: boolean;
  /** Taille : display (briefing/splash) → home (sous le slot). */
  size?: "display" | "home";
};

/** Wordmark E.L.S.A. — persiste sous le mark sur home (même logique que le ring). */
export function SplashWordmark({
  settled = false,
  bootActive = false,
  size = "display",
}: SplashWordmarkProps) {
  const label = t("intro.wordmark");
  const letters = Array.from(label);

  return (
    <p
      data-intro="wordmark"
      data-flip-id={FLIP_ID.wordmark}
      className={cn(
        "t-wordmark text-center text-text will-change-transform",
        size === "display" ? "text-wordmark-display" : "text-wordmark",
        bootActive ? null : settled ? "opacity-100" : "opacity-0",
      )}
    >
      <span aria-hidden className="inline-flex">
        {letters.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            data-wordmark-letter
            className="inline-block"
          >
            {letter === " " ? "\u00a0" : letter}
          </span>
        ))}
      </span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </p>
  );
}

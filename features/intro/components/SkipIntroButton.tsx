import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

type SkipIntroButtonProps = {
  onSkip: () => void;
};

/**
 * « Passer » — hors du HUD `aria-hidden`, premier dans l'ordre de tabulation.
 * Visible dès le départ (y compris reduced motion). Skip idempotent.
 */
export function SkipIntroButton({ onSkip }: SkipIntroButtonProps) {
  return (
    <Button
      variant="ghost"
      size="md"
      aria-label={t("intro.skipLabel")}
      className="absolute right-6 bottom-16 z-20 sm:right-8 sm:bottom-20"
      onClick={(event) => {
        event.stopPropagation();
        onSkip();
      }}
    >
      {t("intro.skip")}
    </Button>
  );
}

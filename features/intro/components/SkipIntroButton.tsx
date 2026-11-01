import { Button } from "@/components/ui/Button";
import { t } from "@/lib/i18n";

type SkipIntroButtonProps = {
  onSkip: () => void;
};

/** Bouton « Passer » — primitive `Button`, libellé i18n. */
export function SkipIntroButton({ onSkip }: SkipIntroButtonProps) {
  return (
    <Button
      variant="ghost"
      className="absolute top-4 right-4 z-20"
      onClick={(event) => {
        event.stopPropagation();
        onSkip();
      }}
    >
      {t("intro.skip")}
    </Button>
  );
}

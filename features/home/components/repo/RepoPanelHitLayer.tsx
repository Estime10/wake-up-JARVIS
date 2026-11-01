import { Button } from "@/components/ui/Button";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type RepoPanelHitLayerProps = {
  visible: boolean;
  previewActive: boolean;
  onClick: () => void;
};

/** Hit plein écran — ferme aperçu puis panneau. */
export function RepoPanelHitLayer({
  visible,
  previewActive,
  onClick,
}: RepoPanelHitLayerProps) {
  return (
    <Button
      variant="ghost"
      size="bare"
      tabIndex={visible ? 0 : -1}
      aria-label={
        previewActive
          ? t("home.repoPreviewCloseLabel")
          : t("home.repoCloseLabel")
      }
      className={cn(
        "fixed inset-0 block h-full w-full cursor-default rounded-none bg-transparent",
        REPO_LAYER_CLASS.hit,
        !visible && "pointer-events-none",
      )}
      onClick={onClick}
    >
      <span className="sr-only">{t("home.repoClose")}</span>
    </Button>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import {
  mainSectionBoxStyle,
  useMainSectionBox,
} from "@/features/home/hooks/useMainSectionBox";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type RepoPanelHitLayerProps = {
  visible: boolean;
  previewActive: boolean;
  onClick: () => void;
};

/** Hit borné à `main` — visible = `open` (comme le terminal), ferme aperçu puis panneau. */
export function RepoPanelHitLayer({
  visible,
  previewActive,
  onClick,
}: RepoPanelHitLayerProps) {
  const box = useMainSectionBox(visible);

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
        "fixed block cursor-default rounded-none bg-transparent",
        REPO_LAYER_CLASS.hit,
        !visible && "pointer-events-none",
      )}
      style={mainSectionBoxStyle(box)}
      onClick={onClick}
    >
      <span className="sr-only">{t("home.repoClose")}</span>
    </Button>
  );
}

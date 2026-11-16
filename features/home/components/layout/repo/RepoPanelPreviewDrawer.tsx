"use client";

import type { RepoFilePreviewModel } from "@/features/home/components/ui/repo/preview/RepoFilePreview";
import { RepoFilePreview } from "@/features/home/components/ui/repo/preview/RepoFilePreview";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

type RepoPanelPreviewDrawerProps = {
  visible: boolean;
  model: RepoFilePreviewModel;
  onClose: () => void;
  onRetry: () => void;
};

/** Aperçu fichier — couvre la liste dans le même liquid-glass. */
export function RepoPanelPreviewDrawer({
  visible,
  model,
  onClose,
  onRetry,
}: RepoPanelPreviewDrawerProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col",
        HUD_OVERLAY_MOTION_CLASS,
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
      data-scroll-lock-allow="true"
      aria-label={t("home.repoPreviewLabel", { path: model.path })}
      aria-hidden={!visible || undefined}
      inert={!visible ? true : undefined}
    >
      <RepoFilePreview model={model} onClose={onClose} onRetry={onRetry} />
    </div>
  );
}

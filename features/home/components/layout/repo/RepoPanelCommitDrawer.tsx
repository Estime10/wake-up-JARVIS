"use client";

import type { RepoCommitPreviewModel } from "@/features/home/components/ui/repo/preview/RepoCommitPreview";
import { RepoCommitPreview } from "@/features/home/components/ui/repo/preview/RepoCommitPreview";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

type RepoPanelCommitDrawerProps = {
  visible: boolean;
  model: RepoCommitPreviewModel;
  onClose: () => void;
};

/** Détail commit — couvre la liste dans le même liquid-glass. */
export function RepoPanelCommitDrawer({
  visible,
  model,
  onClose,
}: RepoPanelCommitDrawerProps) {
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
      aria-label={t("home.repoCommitPreviewLabel", { sha: model.commit.sha })}
      aria-hidden={!visible || undefined}
      inert={!visible ? true : undefined}
    >
      <RepoCommitPreview model={model} onClose={onClose} />
    </div>
  );
}

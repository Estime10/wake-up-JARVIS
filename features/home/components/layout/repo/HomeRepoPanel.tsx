"use client";

import { useEffect } from "react";

import {
  LiveRepoPreviewProvider,
  useLiveRepoPreview,
} from "@/features/github/context/liveRepoPreviewContext";
import { RepoPanelCommitDrawer } from "@/features/home/components/layout/repo/RepoPanelCommitDrawer";
import { RepoPanelFilesDrawer } from "@/features/home/components/layout/repo/RepoPanelFilesDrawer";
import { RepoPanelPreviewDrawer } from "@/features/home/components/layout/repo/RepoPanelPreviewDrawer";
import { useRepoPanel } from "@/features/home/context/repoPanelContext";
import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { usePreviewSnapshot } from "@/features/home/hooks/usePreviewSnapshot";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";

type HomeRepoPanelProps = {
  open: boolean;
};

/**
 * GitHub — même cadre liquid-glass que messages / terminal / mail (`side-left`).
 */
export function HomeRepoPanel({ open }: HomeRepoPanelProps) {
  return (
    <LiveRepoPreviewProvider>
      <HomeRepoPanelView open={open} />
    </LiveRepoPreviewProvider>
  );
}

function HomeRepoPanelView({ open }: HomeRepoPanelProps) {
  const { close } = useRepoPanel();
  const livePreview = useLiveRepoPreview();
  const fileActive = open && Boolean(livePreview.preview);
  const commitActive = open && Boolean(livePreview.commitPreview);

  const fileMotion = usePresenceMotion(fileActive, REPO_MOTION_MS);
  const commitMotion = usePresenceMotion(commitActive, REPO_MOTION_MS);
  const fileSnapshot = usePreviewSnapshot(
    livePreview.preview,
    fileMotion.mounted,
  );
  const commitSnapshot = usePreviewSnapshot(
    livePreview.commitPreview,
    commitMotion.mounted,
  );

  const closePreview = livePreview.closePreview;
  const previewVisible = fileMotion.visible || commitMotion.visible;

  useEffect(() => {
    if (open) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      closePreview();
    }, REPO_MOTION_MS);
    return () => window.clearTimeout(id);
  }, [open, closePreview]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        TERMINAL_LAYER_CLASS.panel,
        HUD_OVERLAY_MOTION_CLASS,
        open ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!open || undefined}
    >
      <div
        className={cn(
          "relative flex h-full w-full flex-col",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-col",
            previewVisible && "pointer-events-none opacity-0",
          )}
          aria-hidden={previewVisible || undefined}
        >
          <RepoPanelFilesDrawer onDismiss={close} />
        </div>
        {fileMotion.mounted && fileSnapshot ? (
          <RepoPanelPreviewDrawer
            visible={fileMotion.visible}
            model={fileSnapshot}
            onClose={livePreview.closePreview}
            onRetry={livePreview.retryPreview}
          />
        ) : null}
        {commitMotion.mounted && commitSnapshot ? (
          <RepoPanelCommitDrawer
            visible={commitMotion.visible}
            model={commitSnapshot}
            onClose={livePreview.closePreview}
          />
        ) : null}
      </div>
    </div>
  );
}

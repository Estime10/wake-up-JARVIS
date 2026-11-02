"use client";

import {
  LiveRepoPreviewProvider,
  useLiveRepoPreview,
} from "@/features/github/context/liveRepoPreviewContext";
import { RepoPanelFilesDrawer } from "@/features/home/components/repo/RepoPanelFilesDrawer";
import { RepoPanelHitLayer } from "@/features/home/components/repo/RepoPanelHitLayer";
import { RepoPanelMask } from "@/features/home/components/repo/RepoPanelMask";
import { RepoPanelPreviewDrawer } from "@/features/home/components/repo/RepoPanelPreviewDrawer";
import { useRepoPanel } from "@/features/home/context";
import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { usePreviewSnapshot } from "@/features/home/hooks/usePreviewSnapshot";

/**
 * Orchestrateur panneau REPO — live GitHub + chrome animé.
 * Aperçu rendu en frère du tiroir fichiers (hors transform).
 */
export function HomeRepoPanel() {
  const { open, close } = useRepoPanel();

  return (
    <LiveRepoPreviewProvider>
      <HomeRepoPanelView open={open} close={close} />
    </LiveRepoPreviewProvider>
  );
}

function HomeRepoPanelView({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const livePreview = useLiveRepoPreview();
  const previewActive = Boolean(livePreview.preview);

  const panelMotion = usePresenceMotion(open, REPO_MOTION_MS);
  const previewMotion = usePresenceMotion(previewActive, REPO_MOTION_MS);
  const previewSnapshot = usePreviewSnapshot(
    livePreview.preview,
    previewMotion.mounted,
  );

  function dismissPanel(): void {
    livePreview.closePreview();
    close();
  }

  function onBackdropClick(): void {
    if (previewActive) {
      livePreview.closePreview();
      return;
    }
    dismissPanel();
  }

  return (
    <>
      <RepoPanelMask visible={open} />
      <RepoPanelHitLayer
        visible={open}
        previewActive={previewActive}
        onClick={onBackdropClick}
      />
      {panelMotion.mounted ? (
        <RepoPanelFilesDrawer
          visible={panelMotion.visible}
          onDismiss={dismissPanel}
        />
      ) : null}
      {previewMotion.mounted && previewSnapshot ? (
        <RepoPanelPreviewDrawer
          visible={previewMotion.visible}
          model={previewSnapshot}
          onClose={livePreview.closePreview}
          onRetry={livePreview.retryPreview}
        />
      ) : null}
    </>
  );
}

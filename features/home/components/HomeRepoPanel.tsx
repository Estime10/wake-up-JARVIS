"use client";

import {
  LiveRepoPreviewProvider,
  useLiveRepoPreview,
} from "@/features/github/context/liveRepoPreviewContext";
import { RepoPanelCommitDrawer } from "@/features/home/components/repo/RepoPanelCommitDrawer";
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
  const fileActive = Boolean(livePreview.preview);
  const commitActive = Boolean(livePreview.commitPreview);
  const previewActive = fileActive || commitActive;

  const panelMotion = usePresenceMotion(open, REPO_MOTION_MS);
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
    </>
  );
}

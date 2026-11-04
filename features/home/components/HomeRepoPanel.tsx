"use client";

import { useEffect } from "react";

import {
  LiveRepoPreviewProvider,
  useLiveRepoPreview,
} from "@/features/github/context/liveRepoPreviewContext";
import { RepoPanelCommitDrawer } from "@/features/home/components/repo/RepoPanelCommitDrawer";
import { RepoPanelFilesDrawer } from "@/features/home/components/repo/RepoPanelFilesDrawer";
import { RepoPanelPreviewDrawer } from "@/features/home/components/repo/RepoPanelPreviewDrawer";
import { useRepoPanel } from "@/features/home/context";
import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { usePreviewSnapshot } from "@/features/home/hooks/usePreviewSnapshot";

/**
 * Orchestrateur panneau REPO — live GitHub + chrome animé.
 * Pas d’overlay / hit-layer : tiroirs seuls dans la colonne gauche.
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
  // Lié à `open` pour outro synchronisée liste + aperçu.
  const fileActive = open && Boolean(livePreview.preview);
  const commitActive = open && Boolean(livePreview.commitPreview);

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

  const closePreview = livePreview.closePreview;

  useEffect(() => {
    if (open) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      closePreview();
    }, REPO_MOTION_MS);
    return () => window.clearTimeout(id);
  }, [open, closePreview]);

  function dismissPanel(): void {
    close();
  }

  return (
    <>
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

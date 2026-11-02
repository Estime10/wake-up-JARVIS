"use client";

import { useId, useRef, type KeyboardEvent } from "react";

import {
  LiveRepoPreviewProvider,
  useLiveRepoPreview,
} from "@/features/github/context/liveRepoPreviewContext";
import { RepoPanelFilesDrawer } from "@/features/home/components/repo/RepoPanelFilesDrawer";
import { RepoPanelHitLayer } from "@/features/home/components/repo/RepoPanelHitLayer";
import { RepoPanelMask } from "@/features/home/components/repo/RepoPanelMask";
import { RepoPanelPreviewDrawer } from "@/features/home/components/repo/RepoPanelPreviewDrawer";
import {
  RepoSessionProvider,
  useRepoPanel,
  useRepoSession,
} from "@/features/home/context";
import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { usePreviewSnapshot } from "@/features/home/hooks/usePreviewSnapshot";
import { REPO_TABS, type RepoTab } from "@/features/home/model/repoTab";
import { nextTabIndex } from "@/features/home/model/tabKeyboard";

/**
 * Orchestrateur panneau REPO — provider session + chrome animé.
 * Aperçu live rendu en frère du tiroir fichiers (hors transform).
 */
export function HomeRepoPanel() {
  const { open, close } = useRepoPanel();

  return (
    <RepoSessionProvider panelOpen={open}>
      <LiveRepoPreviewProvider>
        <HomeRepoPanelView open={open} close={close} />
      </LiveRepoPreviewProvider>
    </RepoSessionProvider>
  );
}

function HomeRepoPanelView({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const session = useRepoSession();
  const livePreview = useLiveRepoPreview();
  const idPrefix = useId();
  const tabRefs = useRef<Partial<Record<RepoTab, HTMLButtonElement>>>({});

  const activePreview = livePreview.preview ?? session.preview;
  const previewActive = Boolean(activePreview);
  const isLivePreview = Boolean(livePreview.preview);

  const panelMotion = usePresenceMotion(open, REPO_MOTION_MS);
  const previewMotion = usePresenceMotion(previewActive, REPO_MOTION_MS);
  const previewSnapshot = usePreviewSnapshot(
    activePreview,
    previewMotion.mounted,
  );

  const tabId = (value: RepoTab) => `${idPrefix}-tab-${value}`;
  const panelId = `${idPrefix}-panel`;

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const next = nextTabIndex(
      event.key,
      REPO_TABS.indexOf(session.tab),
      REPO_TABS.length,
    );
    const nextTab = next === null ? undefined : REPO_TABS[next];
    if (!nextTab) {
      return;
    }
    event.preventDefault();
    session.setTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }

  function closeActivePreview(): void {
    if (isLivePreview) {
      livePreview.closePreview();
      return;
    }
    session.closePreview();
  }

  function dismissPanel(): void {
    livePreview.closePreview();
    session.closePreview();
    close();
  }

  function onBackdropClick(): void {
    if (previewActive) {
      closeActivePreview();
      return;
    }
    dismissPanel();
  }

  if (!panelMotion.mounted) {
    return null;
  }

  return (
    <>
      <RepoPanelMask visible={panelMotion.visible} />
      <RepoPanelHitLayer
        visible={panelMotion.visible}
        previewActive={previewActive}
        onClick={onBackdropClick}
      />
      <RepoPanelFilesDrawer
        visible={panelMotion.visible}
        idPrefix={idPrefix}
        tabId={tabId}
        panelId={panelId}
        tabRefs={tabRefs}
        onTabKeyDown={handleTabKeyDown}
        onDismiss={dismissPanel}
      />
      {previewMotion.mounted && previewSnapshot ? (
        <RepoPanelPreviewDrawer
          visible={previewMotion.visible}
          model={previewSnapshot}
          onClose={closeActivePreview}
          onRetry={() => {
            if (isLivePreview) {
              livePreview.retryPreview();
              return;
            }
            session.retryPreview();
          }}
        />
      ) : null}
    </>
  );
}

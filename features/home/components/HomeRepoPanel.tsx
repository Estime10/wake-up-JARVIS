"use client";

import { useId, useRef, type KeyboardEvent } from "react";

import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { usePreviewSnapshot } from "@/features/home/hooks/usePreviewSnapshot";
import { RepoPanelFilesDrawer } from "@/features/home/components/repo/RepoPanelFilesDrawer";
import { RepoPanelHitLayer } from "@/features/home/components/repo/RepoPanelHitLayer";
import { RepoPanelMask } from "@/features/home/components/repo/RepoPanelMask";
import { RepoPanelPreviewDrawer } from "@/features/home/components/repo/RepoPanelPreviewDrawer";
import {
  RepoSessionProvider,
  useRepoPanel,
  useRepoSession,
} from "@/features/home/context";
import { REPO_TABS, type RepoTab } from "@/features/home/model/repoTab";
import { nextTabIndex } from "@/features/home/model/tabKeyboard";

/**
 * Orchestrateur panneau REPO — provider session + chrome animé.
 */
export function HomeRepoPanel() {
  const { open, close } = useRepoPanel();

  return (
    <RepoSessionProvider panelOpen={open}>
      <HomeRepoPanelView open={open} close={close} />
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
  const idPrefix = useId();
  const tabRefs = useRef<Partial<Record<RepoTab, HTMLButtonElement>>>({});
  const previewActive = Boolean(session.preview);

  const panelMotion = usePresenceMotion(open, REPO_MOTION_MS);
  const previewMotion = usePresenceMotion(previewActive, REPO_MOTION_MS);
  const previewSnapshot = usePreviewSnapshot(
    session.preview,
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

  function dismissPanel(): void {
    session.closePreview();
    close();
  }

  function onBackdropClick(): void {
    if (previewActive) {
      session.closePreview();
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
        />
      ) : null}
    </>
  );
}

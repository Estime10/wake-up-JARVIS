"use client";

import { useEffect } from "react";

import { MailListDrawer } from "@/features/home/components/mail/MailListDrawer";
import { MailPreviewDrawer } from "@/features/home/components/mail/MailPreviewDrawer";
import { useMailPanel } from "@/features/home/context";
import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { usePreviewSnapshot } from "@/features/home/hooks/usePreviewSnapshot";
import {
  MailPreviewProvider,
  useMailPreview,
} from "@/features/mail/context/mailPreviewContext";

/**
 * Orchestrateur panneau mails — liste (1re moitié) + aperçu (2e moitié).
 */
export function HomeMailDrawer() {
  const { open, close } = useMailPanel();

  return (
    <MailPreviewProvider>
      <HomeMailDrawerView open={open} close={close} />
    </MailPreviewProvider>
  );
}

function HomeMailDrawerView({
  open,
  close,
}: {
  open: boolean;
  close: () => void;
}) {
  const { selected, clear } = useMailPreview();
  const listMotion = usePresenceMotion(open, REPO_MOTION_MS);
  const previewMotion = usePresenceMotion(
    open && Boolean(selected),
    REPO_MOTION_MS,
  );
  const previewSnapshot = usePreviewSnapshot(selected, previewMotion.mounted);

  // Attendre l’outro avant de vider la sélection (sinon le 2ᵉ tiroir disparaît à sec).
  useEffect(() => {
    if (open) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      clear();
    }, REPO_MOTION_MS);
    return () => window.clearTimeout(id);
  }, [open, clear]);

  function dismissPanel(): void {
    close();
  }

  return (
    <>
      {listMotion.mounted ? (
        <MailListDrawer visible={listMotion.visible} onDismiss={dismissPanel} />
      ) : null}
      {previewMotion.mounted && previewSnapshot ? (
        <MailPreviewDrawer
          visible={previewMotion.visible}
          mail={previewSnapshot}
          onClose={clear}
        />
      ) : null}
    </>
  );
}

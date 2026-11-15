"use client";

import { useEffect } from "react";

import { MailListDrawer } from "@/features/home/components/layout/mail/MailListDrawer";
import { MailPreviewDrawer } from "@/features/home/components/layout/mail/MailPreviewDrawer";
import { useMailPanel } from "@/features/home/context/mailPanelContext";
import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { usePreviewSnapshot } from "@/features/home/hooks/usePreviewSnapshot";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import {
  MailPreviewProvider,
  useMailPreview,
} from "@/features/mail/context/mailPreviewContext";
import { cn } from "@/lib/cn";

type HomeMailPanelProps = {
  open: boolean;
};

/**
 * Mails — même cadre liquid-glass que messages / terminal (`side-left`).
 */
export function HomeMailPanel({ open }: HomeMailPanelProps) {
  return (
    <MailPreviewProvider>
      <HomeMailPanelView open={open} />
    </MailPreviewProvider>
  );
}

function HomeMailPanelView({ open }: HomeMailPanelProps) {
  const { close } = useMailPanel();
  const { selected, clear } = useMailPreview();
  const previewMotion = usePresenceMotion(
    open && Boolean(selected),
    REPO_MOTION_MS,
  );
  const previewSnapshot = usePreviewSnapshot(selected, previewMotion.mounted);

  useEffect(() => {
    if (open) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      clear();
    }, REPO_MOTION_MS);
    return () => window.clearTimeout(id);
  }, [open, clear]);

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
            previewMotion.visible && "pointer-events-none opacity-0",
          )}
          aria-hidden={previewMotion.visible || undefined}
        >
          <MailListDrawer onDismiss={close} />
        </div>
        {previewMotion.mounted && previewSnapshot ? (
          <MailPreviewDrawer
            visible={previewMotion.visible}
            mail={previewSnapshot}
            onClose={clear}
          />
        ) : null}
      </div>
    </div>
  );
}

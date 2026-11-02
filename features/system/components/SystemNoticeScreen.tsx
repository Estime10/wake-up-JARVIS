import type { ReactNode } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { HudModal } from "@/components/ui/HudModal";
import { cn } from "@/lib/cn";

type SystemNoticeScreenProps = {
  title: string;
  body: string;
  action: ReactNode;
  className?: string;
};

/**
 * Écran système plein viewport — 404 / error.
 * Même chrome HUD que auth (ambient + HudModal), sans logique métier.
 */
export function SystemNoticeScreen({
  title,
  body,
  action,
  className,
}: SystemNoticeScreenProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10 text-text",
        className,
      )}
    >
      <HudAmbient />
      <HudModal
        aria-labelledby="system-notice-title"
        aria-describedby="system-notice-body"
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative z-10 flex flex-col gap-5 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-2">
            <h1 id="system-notice-title" className="t-title text-text">
              {title}
            </h1>
            <p
              id="system-notice-body"
              className="t-body text-sm text-text-muted"
            >
              {body}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">{action}</div>
        </div>
      </HudModal>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";

type SidePanelMessageProps = {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "muted" | "danger";
};

/** Message d’état panneau latéral — empty / error uniquement (pas de loading). */
export function SidePanelMessage({
  text,
  actionLabel,
  onAction,
  tone = "muted",
}: SidePanelMessageProps) {
  return (
    <div className="flex flex-col items-start gap-3 px-1">
      <p
        className={
          tone === "danger"
            ? "t-mono text-sm text-danger"
            : "t-mono text-sm text-text-muted"
        }
        role={tone === "danger" ? "alert" : "status"}
      >
        {text}
      </p>
      {actionLabel && onAction ? (
        <Button type="button" variant="hud" size="bare" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

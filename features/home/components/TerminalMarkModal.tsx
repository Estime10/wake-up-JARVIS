"use client";

import type { Ref } from "react";

import { HudModal } from "@/components/ui/HudModal";
import { TerminalShell } from "@/features/home/components/TerminalShell";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

/**
 * Modale terminal — chrome HudModal + shell au-dessus du mark.
 */
export function TerminalMarkModal({
  modalRef,
  active,
}: {
  modalRef: Ref<HTMLDivElement | null>;
  active: boolean;
}) {
  return (
    <HudModal
      ref={modalRef}
      data-terminal-modal
      aria-label={t("home.terminalShellLabel")}
      className={cn("fixed opacity-0", TERMINAL_LAYER_CLASS.modal)}
    >
      <TerminalShell active={active} />
    </HudModal>
  );
}

import type { Ref } from "react";

import { Button } from "@/components/ui/Button";
import type { ActionStatus } from "@/lib/actions/lifecycle";
import { requiresSignature, type RiskLevel } from "@/lib/actions/risk";
import { t } from "@/lib/i18n";

type ActionButtonsProps = {
  risk: RiskLevel;
  status: ActionStatus;
  onConfirm: () => void;
  onCancel: () => void;
  executeRef?: Ref<HTMLButtonElement>;
  cancelRef?: Ref<HTMLButtonElement>;
};

/** Boutons principaux selon risque + état. */
export function ActionButtons({
  risk,
  status,
  onConfirm,
  onCancel,
  executeRef,
  cancelRef,
}: ActionButtonsProps) {
  const awaiting = status === "awaiting_signature";
  const pending = status === "pending";
  const running = status === "running";

  if (!pending && !awaiting && !running) {
    return null;
  }

  const primaryLabel = requiresSignature(risk)
    ? t("actions.signAndExecute")
    : t("actions.execute");

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {awaiting || running ? null : (
        <Button
          ref={executeRef}
          type="button"
          variant="light"
          size="md"
          onClick={onConfirm}
        >
          {primaryLabel}
        </Button>
      )}
      <Button
        ref={cancelRef}
        type="button"
        variant="ghost"
        size="md"
        onClick={onCancel}
      >
        {t("actions.cancel")}
      </Button>
    </div>
  );
}

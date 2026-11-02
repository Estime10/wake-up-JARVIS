import type { ActionStatus } from "@/lib/actions/lifecycle";
import type { MessageKey } from "@/lib/i18n/types";

const STATUS_KEYS: Record<ActionStatus, MessageKey> = {
  pending: "actions.statusPending",
  awaiting_signature: "actions.statusAwaiting",
  running: "actions.statusRunning",
  succeeded: "actions.statusSucceeded",
  failed: "actions.statusFailed",
  cancelled: "actions.statusCancelled",
  expired: "actions.statusExpired",
};

export function actionStatusMessageKey(status: ActionStatus): MessageKey {
  return STATUS_KEYS[status];
}

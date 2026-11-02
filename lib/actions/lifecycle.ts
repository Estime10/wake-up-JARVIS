import { requiresSignature, type RiskLevel } from "@/lib/actions/risk";

export type ActionStatus =
  | "pending"
  | "awaiting_signature"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired";

export type ActionCardEvent =
  | { type: "CONFIRM" }
  | { type: "SIGNATURE_OK" }
  | { type: "SIGNATURE_REFUSED" }
  | { type: "CANCEL" }
  | { type: "SUCCEED" }
  | { type: "FAIL" }
  | { type: "EXPIRE" };

const TERMINAL: ReadonlySet<ActionStatus> = new Set([
  "succeeded",
  "failed",
  "cancelled",
  "expired",
]);

export function isTerminalActionStatus(status: ActionStatus): boolean {
  return TERMINAL.has(status);
}

/**
 * Transitions de la carte d'action (domaine pur).
 * Refus de signature → `pending` (pas `cancelled`).
 */
export function transitionAction(
  status: ActionStatus,
  event: ActionCardEvent,
  risk: RiskLevel,
): ActionStatus {
  if (TERMINAL.has(status) && event.type !== "EXPIRE") {
    return status;
  }

  switch (status) {
    case "pending":
      if (event.type === "CONFIRM") {
        return requiresSignature(risk) ? "awaiting_signature" : "running";
      }
      if (event.type === "CANCEL") {
        return "cancelled";
      }
      if (event.type === "EXPIRE") {
        return "expired";
      }
      return status;
    case "awaiting_signature":
      if (event.type === "SIGNATURE_OK") {
        return "running";
      }
      if (event.type === "SIGNATURE_REFUSED") {
        return "pending";
      }
      if (event.type === "CANCEL") {
        return "cancelled";
      }
      if (event.type === "EXPIRE") {
        return "expired";
      }
      return status;
    case "running":
      if (event.type === "SUCCEED") {
        return "succeeded";
      }
      if (event.type === "FAIL") {
        return "failed";
      }
      if (event.type === "CANCEL") {
        return "cancelled";
      }
      return status;
    default:
      return status;
  }
}

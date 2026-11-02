import { jcsStringify } from "@/lib/actions/jcs";
import type { ActionProposal } from "@/lib/schemas";

const MOCK_NONCE = "Xk3vQ9pL2mT7wR4yZ8nB1c";

/**
 * Payload signé v1 (factice UI) — JCS, champs PLAN-UI §6.10.
 * argv : commande en `-lc` zsh si pas déjà un chemin absolu d'exécutable.
 */
export function buildSignedPayloadV1(proposal: ActionProposal): string {
  const argv = proposal.command.startsWith("/")
    ? proposal.command.split(/\s+/)
    : ["/bin/zsh", "-lc", proposal.command];

  return jcsStringify({
    action: proposal.id,
    argv,
    cwd: proposal.cwd,
    expires_at: proposal.expiresAt,
    machine_id: proposal.machine.id,
    nonce: MOCK_NONCE,
    order_id: proposal.id,
    params: {},
    v: 1,
  });
}

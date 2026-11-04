import { z } from "zod";

import { actionProposalSchema, type ActionProposal } from "@/lib/schemas";

const expiresAt = "2026-11-02T12:00:00.000Z";

/** Propositions factices — un par niveau de risque (+ CRASH TEST). */
export const MOCK_ACTION_PROPOSALS: {
  read: ActionProposal;
  modify: ActionProposal;
  danger: ActionProposal;
  crashTest: ActionProposal;
} = {
  read: actionProposalSchema.parse({
    id: "action_read_ls",
    command: "ls -la /Users/devinchat/code",
    cwd: "/Users/devinchat/code",
    machine: { id: "mac-studio-1", name: "Mac Studio" },
    explanation: "Liste le contenu du dossier code.",
    risk: 1,
    expiresAt,
  }),
  modify: actionProposalSchema.parse({
    id: "action_mod_pull",
    command: "git -C /Users/devinchat/code/demo pull",
    cwd: "/Users/devinchat/code/demo",
    machine: { id: "mac-studio-1", name: "Mac Studio" },
    explanation: "Récupère les derniers commits du dépôt demo.",
    risk: 2,
    expiresAt,
  }),
  danger: actionProposalSchema.parse({
    id: "action_risk_rm",
    command: "rm -rf /Users/devinchat/code/demo/build",
    cwd: "/Users/devinchat/code/demo",
    machine: { id: "mac-studio-1", name: "Mac Studio" },
    explanation: "Supprime le dossier de build du dépôt demo.",
    risk: 3,
    expiresAt,
  }),
  crashTest: actionProposalSchema.parse({
    id: "action_crash_test",
    command: `echo "\u202E\u200B\u007F\u0085"`,
    cwd: "/Users/devinchat/code/demo",
    machine: { id: "mac-studio-1", name: "Mac Studio" },
    explanation: "Cas CRASH TEST — caractères invisibles / contrôle.",
    risk: 2,
    expiresAt,
  }),
};

export const MOCK_ACTION_LIST: readonly ActionProposal[] = z
  .array(actionProposalSchema)
  .parse(Object.values(MOCK_ACTION_PROPOSALS));

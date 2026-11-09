import { type ActionStatus, transitionAction } from "@/lib/actions/lifecycle";
import { requiresSignature } from "@/lib/actions/risk";
import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { t } from "@/lib/i18n/t";
import type { ActionProposal } from "@/lib/schemas";
import type { ActionPort } from "@/ports/action-port";

const ACTION_TTL_MS = 120_000;

type SetMessages = (
  updater: (prev: ConversationMessage[]) => ConversationMessage[],
) => void;

export type AssistantActionCards = {
  clearActionTimer: (messageId: string) => void;
  scheduleActionExpiry: (messageId: string) => void;
  confirmAction: (messageId: string) => void;
  cancelAction: (messageId: string) => void;
  dispose: () => void;
};

/**
 * Cartes d’action conversation — expiry, signature, exécution, annulation.
 */
export function createAssistantActionCards(args: {
  getAction: () => ActionPort;
  getMessages: () => ConversationMessage[];
  setMessages: SetMessages;
}): AssistantActionCards {
  const { getAction, getMessages, setMessages } = args;
  const timers = new Map<string, number>();
  const aborts = new Map<string, AbortController>();

  function clearActionTimer(messageId: string): void {
    const timer = timers.get(messageId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.delete(messageId);
    }
  }

  function patchAction(
    messageId: string,
    patch: (
      status: ActionStatus,
      proposal: ActionProposal,
    ) => {
      status: ActionStatus;
      notice?: string | undefined;
      clearNotice?: boolean;
      outputLines?: string[];
      exitCode?: number;
    },
  ): void {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.action) {
          return msg;
        }
        const result = patch(msg.action.status, msg.action.proposal);
        const nextNotice = result.clearNotice
          ? undefined
          : (result.notice ?? msg.action.notice);
        return {
          ...msg,
          action: {
            proposal: msg.action.proposal,
            status: result.status,
            outputLines: result.outputLines ?? msg.action.outputLines,
            ...(nextNotice !== undefined ? { notice: nextNotice } : {}),
            ...(result.exitCode !== undefined
              ? { exitCode: result.exitCode }
              : msg.action.exitCode !== undefined
                ? { exitCode: msg.action.exitCode }
                : {}),
          },
        };
      }),
    );
  }

  function scheduleActionExpiry(messageId: string): void {
    clearActionTimer(messageId);
    const timer = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId || !msg.action) {
            return msg;
          }
          const next = transitionAction(
            msg.action.status,
            { type: "EXPIRE" },
            msg.action.proposal.risk,
          );
          return {
            ...msg,
            action: { ...msg.action, status: next },
          };
        }),
      );
      timers.delete(messageId);
    }, ACTION_TTL_MS);
    timers.set(messageId, timer);
  }

  async function runExecute(
    messageId: string,
    proposal: ActionProposal,
  ): Promise<void> {
    clearActionTimer(messageId);
    const ac = new AbortController();
    aborts.set(messageId, ac);
    const lines: string[] = [];
    const action = getAction();

    patchAction(messageId, () => ({
      status: "running",
      outputLines: [],
      clearNotice: true,
    }));

    try {
      for await (const event of action.execute(proposal.id, ac.signal)) {
        if (event.type === "stdout" || event.type === "stderr") {
          lines.push(event.line);
          patchAction(messageId, () => ({
            status: "running",
            outputLines: [...lines],
          }));
        }
        if (event.type === "done") {
          const ok = event.exitCode === 0;
          patchAction(messageId, (status) => ({
            status: transitionAction(
              status,
              { type: ok ? "SUCCEED" : "FAIL" },
              proposal.risk,
            ),
            outputLines: [...lines],
            exitCode: event.exitCode,
          }));
        }
      }
    } catch {
      patchAction(messageId, (status) => ({
        status: transitionAction(status, { type: "FAIL" }, proposal.risk),
        exitCode: 1,
        outputLines: [...lines],
      }));
    } finally {
      aborts.delete(messageId);
    }
  }

  function confirmAction(messageId: string): void {
    const msg = getMessages().find((m) => m.id === messageId);
    const card = msg?.action;
    if (!card || card.status !== "pending") {
      return;
    }
    const action = getAction();

    if (requiresSignature(card.proposal.risk)) {
      patchAction(messageId, (status) => ({
        status: transitionAction(
          status,
          { type: "CONFIRM" },
          card.proposal.risk,
        ),
        clearNotice: true,
      }));

      const ac = new AbortController();
      aborts.set(messageId, ac);
      void action
        .requestSignature(card.proposal.id, ac.signal)
        .then((result) => {
          if (result === "refused") {
            patchAction(messageId, (status) => ({
              status: transitionAction(
                status,
                { type: "SIGNATURE_REFUSED" },
                card.proposal.risk,
              ),
              notice: t("actions.signatureRefused"),
            }));
            return;
          }
          patchAction(messageId, (status) => ({
            status: transitionAction(
              status,
              { type: "SIGNATURE_OK" },
              card.proposal.risk,
            ),
            clearNotice: true,
          }));
          void runExecute(messageId, card.proposal);
        });
      return;
    }

    void runExecute(messageId, card.proposal);
  }

  function cancelAction(messageId: string): void {
    const msg = getMessages().find((m) => m.id === messageId);
    const card = msg?.action;
    if (!card) {
      return;
    }
    clearActionTimer(messageId);
    aborts.get(messageId)?.abort();
    aborts.delete(messageId);
    void getAction().cancel(card.proposal.id);
    patchAction(messageId, (status) => ({
      status: transitionAction(status, { type: "CANCEL" }, card.proposal.risk),
    }));
  }

  function dispose(): void {
    for (const id of timers.values()) {
      window.clearTimeout(id);
    }
    timers.clear();
    for (const ac of aborts.values()) {
      ac.abort();
    }
    aborts.clear();
  }

  return {
    clearActionTimer,
    scheduleActionExpiry,
    confirmAction,
    cancelAction,
    dispose,
  };
}

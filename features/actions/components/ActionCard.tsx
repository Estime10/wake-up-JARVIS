"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";

import { ActionButtons } from "@/features/actions/components/ActionButtons";
import { ActionOutput } from "@/features/actions/components/ActionOutput";
import { CommandBlock } from "@/features/actions/components/CommandBlock";
import { RiskBadge } from "@/features/actions/components/RiskBadge";
import { SignaturePayload } from "@/features/actions/components/SignaturePayload";
import { actionStatusMessageKey } from "@/features/actions/model/statusLabel";
import { formatMessageTime } from "@/features/home/model/conversationMessage";
import { buildSignedPayloadV1 } from "@/lib/actions/buildSignedPayload";
import type { ActionStatus } from "@/lib/actions/lifecycle";
import {
  enterSubmits,
  initialFocusTarget,
  requiresSignature,
} from "@/lib/actions/risk";
import { t } from "@/lib/i18n";
import type { ActionProposal } from "@/lib/schemas";

export type ActionCardProps = {
  proposal: ActionProposal;
  status: ActionStatus;
  outputLines?: readonly string[];
  exitCode?: number | undefined;
  notice?: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
};

function formatExpires(iso: string): string {
  return formatMessageTime(new Date(iso));
}

/** Carte de confirmation inline — commande exacte, risque, signature. */
export function ActionCard({
  proposal,
  status,
  outputLines = [],
  exitCode,
  notice,
  onConfirm,
  onCancel,
}: ActionCardProps) {
  const executeRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current || status !== "pending") {
      return;
    }
    focusedRef.current = true;
    const target = initialFocusTarget(proposal.risk);
    const node = target === "cancel" ? cancelRef.current : executeRef.current;
    node?.focus();
  }, [proposal.risk, status]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.key !== "Enter" || event.metaKey || event.ctrlKey) {
      return;
    }
    if (status !== "pending") {
      return;
    }
    if (!enterSubmits(proposal.risk)) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    onConfirm();
  }

  const showPayload =
    requiresSignature(proposal.risk) &&
    (status === "pending" || status === "awaiting_signature");

  const statusKey = actionStatusMessageKey(status);
  const statusText =
    status === "failed"
      ? t("actions.statusFailed", { code: exitCode ?? "?" })
      : t(statusKey);

  return (
    <article
      className="w-full max-w-xl rounded-lg border border-line bg-surface/90 p-4 shadow-glass backdrop-blur-md"
      aria-label={t("actions.cardLabel")}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RiskBadge risk={proposal.risk} />
        <p className="t-label text-sm text-text-muted" aria-live="polite">
          {statusText}
        </p>
      </div>

      {status === "awaiting_signature" ? (
        <p className="t-body mt-3 text-sm text-attention" role="status">
          {t("actions.awaitingSignature")}
        </p>
      ) : null}

      {notice ? (
        <p className="t-body mt-2 text-sm text-text-muted" role="status">
          {notice}
        </p>
      ) : null}

      <div className="mt-3">
        <CommandBlock command={proposal.command} />
      </div>

      <dl className="mt-3 grid gap-2 text-sm">
        <div>
          <dt className="t-label text-text-muted">{t("actions.cwd")}</dt>
          <dd className="t-mono text-text" dir="ltr">
            {proposal.cwd}
          </dd>
        </div>
        <div>
          <dt className="t-label text-text-muted">{t("actions.machine")}</dt>
          <dd className="t-mono text-text">{proposal.machine.name}</dd>
        </div>
        <div>
          <dt className="t-label text-text-muted">
            {t("actions.explanation")}
          </dt>
          <dd className="t-body text-text">{proposal.explanation}</dd>
        </div>
      </dl>

      <p className="t-label mt-3 text-sm text-text-muted">
        {t("actions.expiresAt", { time: formatExpires(proposal.expiresAt) })}
      </p>

      {showPayload ? (
        <SignaturePayload raw={buildSignedPayloadV1(proposal)} />
      ) : null}

      <ActionOutput
        lines={outputLines}
        running={status === "running"}
        exitCode={exitCode}
      />

      <ActionButtons
        risk={proposal.risk}
        status={status}
        onConfirm={onConfirm}
        onCancel={onCancel}
        executeRef={executeRef}
        cancelRef={cancelRef}
      />
    </article>
  );
}

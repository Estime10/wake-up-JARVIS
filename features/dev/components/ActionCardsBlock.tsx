"use client";

import { ActionCard } from "@/features/actions/components/ActionCard";
import type { ActionStatus } from "@/lib/actions/lifecycle";
import { MOCK_ACTION_PROPOSALS } from "@/fixtures/actionProposals";
import { t } from "@/lib/i18n";

const STATUSES: ActionStatus[] = [
  "pending",
  "awaiting_signature",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "expired",
];

const PROPOSALS = [
  MOCK_ACTION_PROPOSALS.read,
  MOCK_ACTION_PROPOSALS.modify,
  MOCK_ACTION_PROPOSALS.danger,
] as const;

/** Bloc cartes d'action — 7 états × 3 niveaux (+ crash test). */
export function ActionCardsBlock() {
  return (
    <section id="dev-actions" className="flex flex-col gap-8">
      <h2 className="t-title text-lg text-accent">{t("dev.actionsTitle")}</h2>

      {PROPOSALS.map((proposal) => (
        <div key={proposal.id} className="flex flex-col gap-4">
          <h3 className="t-label text-sm text-text-muted">
            risk {proposal.risk}
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {STATUSES.map((status) => {
              if (status === "awaiting_signature" && proposal.risk === 1) {
                return null;
              }
              return (
                <div
                  key={`${proposal.id}-${status}`}
                  id={`dev-action-${proposal.risk}-${status}`}
                >
                  <ActionCard
                    proposal={proposal}
                    status={status}
                    outputLines={
                      status === "running" || status === "succeeded"
                        ? ["ok"]
                        : status === "failed"
                          ? ["error: mock"]
                          : []
                    }
                    exitCode={
                      status === "failed"
                        ? 1
                        : status === "succeeded"
                          ? 0
                          : undefined
                    }
                    notice={
                      status === "pending" && proposal.risk >= 2
                        ? undefined
                        : undefined
                    }
                    onConfirm={() => {}}
                    onCancel={() => {}}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div id="dev-action-crash-test">
        <h3 className="t-label mb-3 text-sm text-text-muted">CRASH TEST</h3>
        <ActionCard
          proposal={MOCK_ACTION_PROPOSALS.crashTest}
          status="pending"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </div>

      <div id="dev-action-signature-refused">
        <h3 className="t-label mb-3 text-sm text-text-muted">
          signature refused → pending
        </h3>
        <ActionCard
          proposal={MOCK_ACTION_PROPOSALS.modify}
          status="pending"
          notice={t("actions.signatureRefused")}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      </div>
    </section>
  );
}

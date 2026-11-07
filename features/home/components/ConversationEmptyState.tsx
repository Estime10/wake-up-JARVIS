import { t } from "@/lib/i18n";

/**
 * Empty state conversation — mémoire prête, aucun message encore.
 * Pas de carte : texte seul, ton E.L.S.A.
 */
export function ConversationEmptyState() {
  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col items-start justify-end gap-2 px-4 py-6 sm:px-5"
      role="status"
      data-home="conversation-empty"
    >
      <p className="t-mono text-sm tracking-wide text-text-muted uppercase">
        {t("home.conversationEmptyTitle")}
      </p>
      <p className="t-body max-w-[22rem] text-sm text-text-muted">
        {t("home.conversationEmptyHint")}
      </p>
    </div>
  );
}

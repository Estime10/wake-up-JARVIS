"use client";

import { Button } from "@/components/ui/Button/Button";
import { ConversationSkeleton } from "@/features/home/components/ui/conversation/thread/ConversationSkeleton";
import { t } from "@/lib/i18n/t";

type ConversationLoadStateProps = {
  status: "loading" | "error";
  onRetry: () => void;
};

/** Mémoire conversation — skeleton + libellé si loading ; texte + retry si error. */
export function ConversationLoadState({
  status,
  onRetry,
}: ConversationLoadStateProps) {
  if (status === "loading") {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <ConversationSkeleton />
        <p
          className="t-mono pb-2 text-center text-sm tracking-wide text-text uppercase"
          aria-hidden
        >
          {t("home.conversationLoading")}
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4"
      role="alert"
    >
      <p className="t-body text-sm text-danger">
        {t("home.conversationError")}
      </p>
      <Button type="button" variant="hud" size="bare" onClick={onRetry}>
        {t("home.conversationRetry")}
      </Button>
    </div>
  );
}

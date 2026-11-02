"use client";

import { Button } from "@/components/ui/Button";
import { ConversationSkeleton } from "@/features/home/components/ConversationSkeleton";
import { t } from "@/lib/i18n";

type ConversationLoadStateProps = {
  status: "loading" | "error";
  onRetry: () => void;
};

/** Mémoire conversation — skeleton si loading ; texte + retry si error. */
export function ConversationLoadState({
  status,
  onRetry,
}: ConversationLoadStateProps) {
  if (status === "loading") {
    return <ConversationSkeleton />;
  }

  return (
    <div
      className="flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-4"
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

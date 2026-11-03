import { ActionCard } from "@/features/actions/components/ActionCard";
import { AssistantMessageBody } from "@/features/home/components/AssistantMessageBody";
import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type ConversationMessageBubbleProps = {
  message: ConversationMessage;
  onConfirmAction?: ((messageId: string) => void) | undefined;
  onCancelAction?: ((messageId: string) => void) | undefined;
};

/** Bulle fil — assistant à gauche, utilisateur à droite (+ carte d'action). */
export function ConversationMessageBubble({
  message,
  onConfirmAction,
  onCancelAction,
}: ConversationMessageBubbleProps) {
  const isUser = message.role === "user";

  if (message.action) {
    return (
      <div
        data-conversation-bubble
        data-entrance-side="left"
        className="flex w-full flex-col items-start gap-1"
      >
        <header className="t-mono flex items-baseline gap-2 text-sm text-text-muted">
          <span>{t("app.name")}</span>
          <time>{message.time}</time>
        </header>
        <ActionCard
          proposal={message.action.proposal}
          status={message.action.status}
          outputLines={message.action.outputLines}
          exitCode={message.action.exitCode}
          notice={message.action.notice}
          onConfirm={() => onConfirmAction?.(message.id)}
          onCancel={() => onCancelAction?.(message.id)}
        />
      </div>
    );
  }

  if (message.text.length === 0) {
    return null;
  }

  return (
    <article
      data-conversation-bubble
      data-entrance-side={isUser ? "right" : "left"}
      aria-hidden={message.streaming || undefined}
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <header className="t-mono flex items-baseline gap-2 text-sm text-text-muted">
        <span>{isUser ? t("home.you") : t("app.name")}</span>
        <time>{message.time}</time>
        {message.streaming ? (
          <span className="text-accent">{t("home.replying")}</span>
        ) : null}
      </header>
      <div
        className={cn(
          "t-body max-w-[min(100%,36rem)] whitespace-pre-wrap rounded-md px-3.5 py-3 text-lg leading-relaxed",
          isUser
            ? "bg-surface-2 text-text"
            : "border border-line/60 bg-surface/50 text-text",
          message.streaming && "border-accent/40",
        )}
      >
        {isUser ? (
          <>
            {message.text}
            {message.streaming ? (
              <span className="greeting-cursor ml-0.5 text-accent" aria-hidden>
                |
              </span>
            ) : null}
          </>
        ) : (
          <AssistantMessageBody
            text={message.text}
            streaming={Boolean(message.streaming)}
          />
        )}
      </div>
    </article>
  );
}

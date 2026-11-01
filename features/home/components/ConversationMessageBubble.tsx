import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type ConversationMessageBubbleProps = {
  message: ConversationMessage;
};

/** Bulle fil — assistant à gauche, utilisateur à droite. */
export function ConversationMessageBubble({
  message,
}: ConversationMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
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
          "t-body max-w-[min(100%,28rem)] rounded-md px-3 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-surface-2 text-text"
            : "border border-line/60 bg-surface/50 text-text",
          message.streaming && "border-accent/40",
        )}
      >
        {message.text}
        {message.streaming ? (
          <span className="greeting-cursor ml-0.5 text-accent" aria-hidden>
            |
          </span>
        ) : null}
      </div>
    </article>
  );
}

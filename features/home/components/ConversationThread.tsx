"use client";

import { useEffect, useRef } from "react";

import { ConversationMessageBubble } from "@/features/home/components/ConversationMessageBubble";
import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { t } from "@/lib/i18n";

type ConversationThreadProps = {
  messages: ConversationMessage[];
  onConfirmAction?: ((messageId: string) => void) | undefined;
  onCancelAction?: ((messageId: string) => void) | undefined;
};

/**
 * Fil de conversation — scroll bas auto.
 * `role="log"` n'annonce que des messages terminés : la bulle en streaming est
 * masquée aux lecteurs d'écran, puis remontée (clé changée) une fois finie.
 */
export function ConversationThread({
  messages,
  onConfirmAction,
  onCancelAction,
}: ConversationThreadProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div
      className="flex min-h-0 w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-4"
      role="log"
      aria-label={t("home.conversationLabel")}
      aria-live="polite"
    >
      {messages.map((message) => (
        <ConversationMessageBubble
          key={message.streaming ? `${message.id}:streaming` : message.id}
          message={message}
          onConfirmAction={onConfirmAction}
          onCancelAction={onCancelAction}
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}

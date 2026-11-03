"use client";

import { useEffect, useRef } from "react";

import { ConversationMessageBubble } from "@/features/home/components/ConversationMessageBubble";
import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { t } from "@/lib/i18n";

type ConversationThreadProps = {
  messages: ConversationMessage[];
  onConfirmAction?: ((messageId: string) => void) | undefined;
  onCancelAction?: ((messageId: string) => void) | undefined;
  /** Coupe le scroll auto (ex. terminal ouvert) — évite un slide vers le bas. */
  scrollLock?: boolean;
};

/**
 * Fil de conversation — scroll bas auto (conteneur seul, jamais scrollIntoView).
 * `role="log"` n'annonce que des messages terminés : la bulle en streaming est
 * masquée aux lecteurs d'écran, puis remontée (clé changée) une fois finie.
 */
export function ConversationThread({
  messages,
  onConfirmAction,
  onCancelAction,
  scrollLock = false,
}: ConversationThreadProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastPinnedIdRef = useRef<string | null>(null);

  const lastMessage = messages[messages.length - 1];
  const pinKey = lastMessage
    ? `${lastMessage.id}:${lastMessage.streaming ? "1" : "0"}`
    : "";

  useEffect(() => {
    if (scrollLock) {
      return;
    }
    if (!pinKey || pinKey === lastPinnedIdRef.current) {
      return;
    }
    lastPinnedIdRef.current = pinKey;
    const list = listRef.current;
    if (!list) {
      return;
    }
    // Conteneur uniquement — `scrollIntoView` scrollait les ancêtres (home)
    // et faisait « descendre » le fil à l’ouverture du terminal.
    list.scrollTop = list.scrollHeight;
  }, [pinKey, scrollLock]);

  return (
    <div
      ref={listRef}
      className="flex max-h-full w-full max-w-xl flex-col gap-4 overflow-y-auto px-6 py-4"
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
    </div>
  );
}

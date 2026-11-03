"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

import { ConversationMessageBubble } from "@/features/home/components/ConversationMessageBubble";
import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";
import { t } from "@/lib/i18n";

gsap.registerPlugin(useGSAP);

type ConversationThreadProps = {
  messages: ConversationMessage[];
  onConfirmAction?: ((messageId: string) => void) | undefined;
  onCancelAction?: ((messageId: string) => void) | undefined;
  /** Coupe le scroll auto (ex. terminal ouvert) — évite un slide vers le bas. */
  scrollLock?: boolean;
  /** Entrée initiale : bulles une par une (user ← droite, assistant ← gauche). */
  animateEntrance?: boolean;
};

/**
 * Fil de conversation — scroll bas auto + entrée staggered optionnelle.
 */
export function ConversationThread({
  messages,
  onConfirmAction,
  onCancelAction,
  scrollLock = false,
  animateEntrance = false,
}: ConversationThreadProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastPinnedIdRef = useRef<string | null>(null);
  const entranceDoneRef = useRef(false);

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
    list.scrollTop = list.scrollHeight;
  }, [pinKey, scrollLock]);

  useGSAP(
    (owner) => {
      const list = listRef.current;
      if (!list || !animateEntrance || entranceDoneRef.current) {
        return undefined;
      }

      return matchReducedMotion(owner, (reducedMotion) => {
        const bubbles = list.querySelectorAll<HTMLElement>(
          "[data-conversation-bubble]",
        );
        if (bubbles.length === 0) {
          entranceDoneRef.current = true;
          return undefined;
        }

        if (reducedMotion) {
          gsap.set(bubbles, { clearProps: "opacity,transform" });
          entranceDoneRef.current = true;
          return undefined;
        }

        gsap.set(bubbles, { opacity: 0 });
        const tl = gsap.timeline({
          onComplete: () => {
            entranceDoneRef.current = true;
          },
        });

        bubbles.forEach((bubble, index) => {
          const fromRight = bubble.dataset.entranceSide === "right";
          tl.fromTo(
            bubble,
            { opacity: 0, x: fromRight ? 56 : -56 },
            {
              opacity: 1,
              x: 0,
              duration: 0.42,
              ease: "power2.out",
            },
            index * 0.14,
          );
        });

        return () => {
          tl.kill();
        };
      });
    },
    {
      scope: listRef,
      dependencies: [animateEntrance, messages.length],
    },
  );

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

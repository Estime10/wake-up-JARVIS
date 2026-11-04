"use client";

import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import { ConversationMessageBubble } from "@/features/home/components/ConversationMessageBubble";
import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type ConversationThreadProps = {
  messages: ConversationMessage[];
  onConfirmAction?: ((messageId: string) => void) | undefined;
  onCancelAction?: ((messageId: string) => void) | undefined;
  scrollLock?: boolean;
  animateEntrance?: boolean;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void | Promise<void>;
};

const LOAD_OLDER_THRESHOLD_PX = 56;
const ENTRANCE_STAGGER_MS = 140;
const ENTRANCE_DURATION_MS = 420;

/**
 * Fil de conversation — scroll bas auto + load older ancré.
 * Monté seulement quand le 1er lot de messages est prêt (`showThread`).
 */
export function ConversationThread({
  messages,
  onConfirmAction,
  onCancelAction,
  scrollLock = false,
  animateEntrance = false,
  hasMoreOlder = false,
  loadingOlder = false,
  onLoadOlder,
}: ConversationThreadProps): ReactElement {
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastPinnedIdRef = useRef<string | null>(null);
  const scrollAnchorRef = useRef<{ height: number; top: number } | null>(null);
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    loadingOlderRef.current = loadingOlder;
  }, [loadingOlder]);

  /** Lot initial figé au mount (pas de setState dans un effect). */
  const [entranceIds] = useState(() =>
    animateEntrance ? messages.map((message) => message.id) : null,
  );
  const [entranceLive, setEntranceLive] = useState(() =>
    Boolean(animateEntrance && messages.length > 0),
  );

  useEffect(() => {
    if (!entranceLive || !entranceIds || entranceIds.length === 0) {
      return undefined;
    }
    const ms =
      (entranceIds.length - 1) * ENTRANCE_STAGGER_MS +
      ENTRANCE_DURATION_MS +
      50;
    const id = window.setTimeout(() => {
      setEntranceLive(false);
    }, ms);
    return () => {
      window.clearTimeout(id);
    };
  }, [entranceLive, entranceIds]);

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

  useLayoutEffect(() => {
    const list = listRef.current;
    const anchor = scrollAnchorRef.current;
    if (!list || !anchor) {
      return;
    }
    list.scrollTop = list.scrollHeight - anchor.height + anchor.top;
    scrollAnchorRef.current = null;
  }, [messages]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !onLoadOlder) {
      return undefined;
    }

    let frame = 0;
    const maybeLoadOlder = () => {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (scrollLock || !hasMoreOlder || loadingOlderRef.current) {
          return;
        }
        if (list.scrollTop > LOAD_OLDER_THRESHOLD_PX) {
          return;
        }
        scrollAnchorRef.current = {
          height: list.scrollHeight,
          top: list.scrollTop,
        };
        void onLoadOlder();
      });
    };

    list.addEventListener("scroll", maybeLoadOlder, { passive: true });
    return () => {
      list.removeEventListener("scroll", maybeLoadOlder);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [hasMoreOlder, onLoadOlder, scrollLock]);

  return (
    <div
      ref={listRef}
      data-scroll-lock-target
      className={cn(
        "flex max-h-full w-full max-w-xl flex-col gap-4 overflow-y-auto px-6 py-4",
      )}
      role="log"
      aria-label={t("home.conversationLabel")}
      aria-live="polite"
      aria-busy={loadingOlder || undefined}
    >
      {hasMoreOlder || loadingOlder ? (
        <div
          className="t-mono flex min-h-8 items-center justify-center text-xs text-text-muted"
          aria-live="polite"
        >
          {loadingOlder ? (
            t("home.conversationLoadingOlder")
          ) : (
            <button
              type="button"
              className="text-text-muted underline-offset-2 hover:text-text hover:underline"
              onClick={() => {
                const list = listRef.current;
                if (list) {
                  scrollAnchorRef.current = {
                    height: list.scrollHeight,
                    top: list.scrollTop,
                  };
                }
                void onLoadOlder?.();
              }}
            >
              {t("home.conversationLoadOlder")}
            </button>
          )}
        </div>
      ) : null}
      {messages.map((message) => {
        const entranceIndex =
          entranceLive && entranceIds ? entranceIds.indexOf(message.id) : -1;
        const useEntrance = entranceIndex >= 0;

        return (
          <MemoConversationMessageBubble
            key={message.id}
            message={message}
            onConfirmAction={onConfirmAction}
            onCancelAction={onCancelAction}
            {...(useEntrance ? { entranceIndex } : {})}
          />
        );
      })}
    </div>
  );
}

const MemoConversationMessageBubble = memo(ConversationMessageBubble);

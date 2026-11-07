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
  const scrollLockRef = useRef(scrollLock);
  const hasMoreOlderRef = useRef(hasMoreOlder);
  const onLoadOlderRef = useRef(onLoadOlder);

  useEffect(() => {
    loadingOlderRef.current = loadingOlder;
  }, [loadingOlder]);

  useEffect(() => {
    scrollLockRef.current = scrollLock;
  }, [scrollLock]);

  useEffect(() => {
    hasMoreOlderRef.current = hasMoreOlder;
  }, [hasMoreOlder]);

  useEffect(() => {
    onLoadOlderRef.current = onLoadOlder;
  }, [onLoadOlder]);

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

  function requestOlder(): void {
    if (
      scrollLockRef.current ||
      !hasMoreOlderRef.current ||
      loadingOlderRef.current ||
      !onLoadOlderRef.current
    ) {
      return;
    }
    const list = listRef.current;
    if (list) {
      scrollAnchorRef.current = {
        height: list.scrollHeight,
        top: list.scrollTop,
      };
    }
    void onLoadOlderRef.current();
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return undefined;
    }

    let frame = 0;
    const maybeLoadOlder = () => {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (list.scrollTop > LOAD_OLDER_THRESHOLD_PX) {
          return;
        }
        requestOlder();
      });
    };

    list.addEventListener("scroll", maybeLoadOlder, { passive: true });
    return () => {
      list.removeEventListener("scroll", maybeLoadOlder);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  // Contenu trop court pour scroller → charger l’historique jusqu’à remplir / épuiser.
  useEffect(() => {
    if (scrollLock || !hasMoreOlder || loadingOlder) {
      return;
    }
    const list = listRef.current;
    if (!list) {
      return;
    }
    if (list.scrollHeight > list.clientHeight + LOAD_OLDER_THRESHOLD_PX) {
      return;
    }
    requestOlder();
  }, [hasMoreOlder, loadingOlder, messages.length, scrollLock]);

  return (
    <div
      ref={listRef}
      data-scroll-lock-target
      className={cn(
        // Pleine largeur section + padding. `mt-auto` sur le corps : fil collé en bas.
        "flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 py-4 sm:px-5",
      )}
      role="log"
      aria-label={t("home.conversationLabel")}
      aria-live="polite"
      aria-busy={loadingOlder || undefined}
    >
      <div className="mt-auto flex flex-col gap-4">
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
                  requestOlder();
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
    </div>
  );
}

const MemoConversationMessageBubble = memo(ConversationMessageBubble);

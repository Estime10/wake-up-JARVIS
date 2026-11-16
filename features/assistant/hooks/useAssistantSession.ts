"use client";

import { useEffect, useEffectEvent, useReducer, useRef, useState } from "react";

import { usePorts } from "@/app/ports-context";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { shouldPersistAssistantReply } from "@/features/assistant/model/shouldPersistAssistantReply";
import { takeConversationPage } from "@/features/assistant/model/takeConversationPage";
import type { AssistantUiPending } from "@/features/assistant/services/applyAssistantUiIntent";
import { createAssistantActionCards } from "@/features/assistant/session/createAssistantActionCards";
import { createAssistantReplyRunner } from "@/features/assistant/session/createAssistantReplyRunner";
import { createAssistantSpeakRing } from "@/features/assistant/session/createAssistantSpeakRing";
import {
  type AssistantEvent,
  type AssistantState,
  transition,
} from "@/features/home/model/assistantMachine";
import {
  createMessageId,
  formatMessageTime,
  type ConversationMessage,
} from "@/features/home/model/conversationMessage";
import {
  CONVERSATION_INITIAL_PAGE,
  CONVERSATION_OLDER_PAGE,
} from "@/features/home/model/conversationPagination";
import { isMicShortcut } from "@/features/home/model/micShortcut";
import { toConversationMessage } from "@/features/home/model/toConversationMessage";
import { useLatestRef } from "@/lib/hooks/useLatestRef";
import type { Message } from "@/lib/schemas";

function sessionReducer(
  state: AssistantState,
  event: AssistantEvent,
): AssistantState {
  return transition(state, event);
}

export type MemoryLoadStatus = "loading" | "ready" | "error";

type UseAssistantSessionResult = {
  state: AssistantState;
  messages: ConversationMessage[];
  memoryStatus: MemoryLoadStatus;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  loadOlderMessages: () => Promise<void>;
  retryMemory: () => void;
  listenSeed: string | undefined;
  toggleListen: () => void;
  submit: (text: string) => void;
  speakWelcome: (text: string) => Promise<boolean>;
  speakAlert: (text: string) => Promise<boolean>;
  confirmAction: (messageId: string) => void;
  cancelAction: (messageId: string) => void;
};

type UseAssistantSessionArgs = {
  onUnrecognized?: (phrase: string) => void;
  onUiIntent?: (args: {
    intent: AssistantIntent | null;
    text: string;
    pending: AssistantUiPending;
  }) => Promise<{
    intent: AssistantIntent | null;
    pending: AssistantUiPending;
    spokenReply?: string;
  }>;
};

/**
 * Session assistant — machine + ports (LLM / mémoire / voix / actions).
 * Orchestrateur : mémoire, écoute, submit ; cards / reply / speak délégués.
 */
export function useAssistantSession(
  args: UseAssistantSessionArgs = {},
): UseAssistantSessionResult {
  const { onUnrecognized, onUiIntent } = args;
  const { status: authStatus } = useAuth();
  const { llm, memory, voice, action } = usePorts();
  const [assistant, dispatch] = useReducer(sessionReducer, "idle");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const messagesRef = useLatestRef(messages);
  const [memoryStatus, setMemoryStatus] = useState<MemoryLoadStatus>("loading");
  const [memoryAttempt, setMemoryAttempt] = useState(0);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [listenSeed, setListenSeed] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const speakIdRef = useRef<string | null>(null);
  const welcomeSpokenRef = useRef(false);
  const welcomeInFlightRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const assistantRef = useLatestRef(assistant);
  const uiPendingRef = useRef<AssistantUiPending>(null);

  const portsRef = useRef({ llm, memory, voice, action });
  portsRef.current = { llm, memory, voice, action };

  const actionCardsRef = useRef(
    createAssistantActionCards({
      getAction: () => portsRef.current.action,
      getMessages: () => messagesRef.current,
      setMessages,
    }),
  );
  const replyRunnerRef = useRef(
    createAssistantReplyRunner({
      getLlm: () => portsRef.current.llm,
      getMemory: () => portsRef.current.memory,
      getVoice: () => portsRef.current.voice,
      dispatch,
      setMessages,
      abortRef,
      speakIdRef,
      scheduleActionExpiry: (id) =>
        actionCardsRef.current.scheduleActionExpiry(id),
    }),
  );
  const speakRingRef = useRef(
    createAssistantSpeakRing({
      getVoice: () => portsRef.current.voice,
      getAssistantState: () => assistantRef.current,
      dispatch,
      abortRef,
      welcomeInFlightRef,
      welcomeSpokenRef,
      stopVoiceListen: () => {
        stopListenRef.current?.();
        stopListenRef.current = null;
      },
    }),
  );

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      if (authStatus !== "authenticated") {
        setMessages([]);
        setHasMoreOlder(false);
        setMemoryStatus("ready");
        return;
      }

      setMemoryStatus("loading");
      try {
        const list = await memory.listMessages({
          limit: CONVERSATION_INITIAL_PAGE + 1,
        });
        if (cancelled) {
          return;
        }
        const { page, hasMore } = takeConversationPage(
          list,
          CONVERSATION_INITIAL_PAGE,
        );
        setMessages(page.map(toConversationMessage));
        setHasMoreOlder(hasMore);
        setMemoryStatus("ready");
      } catch {
        if (!cancelled) {
          setHasMoreOlder(false);
          setMemoryStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memory, memoryAttempt, authStatus]);

  useEffect(() => {
    const actionCards = actionCardsRef.current;
    return () => {
      // Intentionnel : lire l’état au unmount (pas à l’install de l’effect).
      // eslint-disable-next-line react-hooks/exhaustive-deps -- welcome in-flight au cleanup
      if (!welcomeInFlightRef.current) {
        abortRef.current?.abort();
      }
      stopListenRef.current?.();
      actionCards.dispose();
    };
  }, []);

  function stopVoiceListen(): void {
    stopListenRef.current?.();
    stopListenRef.current = null;
  }

  function interrupt(): void {
    abortRef.current?.abort();
    abortRef.current = null;
    stopVoiceListen();
    const streamingId = speakIdRef.current;
    speakIdRef.current = null;
    if (streamingId) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === streamingId ? { ...msg, streaming: false } : msg,
        ),
      );
    }
    dispatch({ type: "INTERRUPT" });
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const busy = assistant === "speaking" || assistant === "thinking";
    if (event.key === "Escape" && busy) {
      event.preventDefault();
      interrupt();
      return;
    }
    if (isMicShortcut(event) && !event.repeat && !busy) {
      event.preventDefault();
      toggleListen();
    }
  });

  useEffect(() => {
    function listener(event: KeyboardEvent): void {
      onKeyDown(event);
    }
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  function toggleListen(): void {
    if (assistant === "listening") {
      stopVoiceListen();
      dispatch({ type: "STOP_LISTEN" });
      return;
    }
    if (assistant === "idle") {
      dispatch({ type: "START_LISTEN" });
      const session = voice.startListening({
        onTranscript: (partial) => {
          setListenSeed(partial);
        },
        onLevel: () => {},
      });
      stopListenRef.current = session.stop;
    }
  }

  function retryMemory(): void {
    setMemoryStatus("loading");
    setMemoryAttempt((value) => value + 1);
  }

  async function loadOlderMessages(): Promise<void> {
    if (loadingOlderRef.current || !hasMoreOlder) {
      return;
    }
    const oldest = messagesRef.current[0];
    if (!oldest?.createdAt) {
      setHasMoreOlder(false);
      return;
    }

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const list = await memory.listMessages({
        limit: CONVERSATION_OLDER_PAGE + 1,
        before: { createdAt: oldest.createdAt, id: oldest.id },
      });
      const { page, hasMore } = takeConversationPage(
        list,
        CONVERSATION_OLDER_PAGE,
      );
      if (page.length === 0) {
        setHasMoreOlder(false);
        return;
      }
      const older = page.map(toConversationMessage);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const unique = older.filter((m) => !existingIds.has(m.id));
        return unique.length === 0 ? prev : [...unique, ...prev];
      });
      setHasMoreOlder(hasMore);
    } catch {
      // Échec charge historique : réessayer au prochain scroll.
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }

  function submit(text: string): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    stopVoiceListen();
    abortRef.current?.abort();
    if (
      assistantRef.current === "speaking" ||
      assistantRef.current === "thinking"
    ) {
      dispatch({ type: "INTERRUPT" });
    }

    const parsed = parseAssistantIntent(trimmed);
    if (!parsed && uiPendingRef.current !== "supabase.studio") {
      onUnrecognized?.(trimmed);
    }

    const userMessage: Message = {
      id: createMessageId(),
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [
      ...prev,
      {
        id: userMessage.id,
        role: "user",
        text: trimmed,
        time: formatMessageTime(new Date(userMessage.createdAt)),
        createdAt: userMessage.createdAt,
      },
    ]);
    dispatch({ type: "SUBMIT" });
    setListenSeed(undefined);

    void replyRunnerRef.current.persist(userMessage);

    void (async () => {
      let replyText = trimmed;
      let replyIntent: AssistantIntent | null = parsed;
      if (onUiIntent) {
        const result = await onUiIntent({
          intent: parsed,
          text: trimmed,
          pending: uiPendingRef.current,
        });
        uiPendingRef.current = result.pending;
        replyIntent = result.intent ?? parsed;
        const persistReply = shouldPersistAssistantReply(replyIntent);
        if (result.spokenReply !== undefined) {
          await replyRunnerRef.current.runDirectReply(result.spokenReply, {
            persistReply,
          });
          return;
        }
        if (result.intent?.kind === "supabase.studio_stop") {
          replyText = "arrête le studio";
        } else if (result.intent?.kind === "supabase.studio") {
          replyText = result.intent.projectQuery
            ? `lance supabase studio sur ${result.intent.projectQuery}`
            : "lance le studio";
        }
        await replyRunnerRef.current.runReply(replyText, { persistReply });
        return;
      }
      await replyRunnerRef.current.runReply(replyText, {
        persistReply: shouldPersistAssistantReply(parsed),
      });
    })();
  }

  return {
    state: assistant,
    messages,
    memoryStatus,
    hasMoreOlder,
    loadingOlder,
    loadOlderMessages,
    retryMemory,
    listenSeed,
    toggleListen,
    submit,
    speakWelcome: speakRingRef.current.speakWelcome,
    speakAlert: speakRingRef.current.speakAlert,
    confirmAction: actionCardsRef.current.confirmAction,
    cancelAction: actionCardsRef.current.cancelAction,
  };
}

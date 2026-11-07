"use client";

import { useEffect, useEffectEvent, useReducer, useRef, useState } from "react";

import { usePorts } from "@/app/ports-context";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { type ActionStatus, transitionAction } from "@/lib/actions/lifecycle";
import { requiresSignature } from "@/lib/actions/risk";
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
import { isMicShortcut } from "@/features/home/model/micShortcut";
import { toConversationMessage } from "@/features/home/model/toConversationMessage";
import {
  CONVERSATION_INITIAL_PAGE,
  CONVERSATION_OLDER_PAGE,
} from "@/features/home/model/conversationPagination";
import { useLatestRef } from "@/lib/hooks/useLatestRef";
import { t } from "@/lib/i18n";
import { createLogger } from "@/lib/logger";
import type { ActionProposal, Message } from "@/lib/schemas";
import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import type { AssistantUiPending } from "@/features/assistant/services/applyAssistantUiIntent";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { shouldPersistAssistantReply } from "@/features/assistant/model/shouldPersistAssistantReply";
import { prepareConversationSpeakText } from "@/features/home/model/prepareConversationSpeakText";
import { markWelcomeSpeakPlayed } from "@/lib/voice/welcomeSpeak";

const log = createLogger("assistant.session");

/** Probe limit+1 pour savoir s’il reste de l’historique. */
function takePageTail<T>(
  items: T[],
  pageSize: number,
): {
  page: T[];
  hasMore: boolean;
} {
  if (items.length > pageSize) {
    return { page: items.slice(-pageSize), hasMore: true };
  }
  return { page: items, hasMore: false };
}

function sessionReducer(
  state: AssistantState,
  event: AssistantEvent,
): AssistantState {
  return transition(state, event);
}

const ACTION_TTL_MS = 120_000;

export type MemoryLoadStatus = "loading" | "ready" | "error";

type UseAssistantSessionResult = {
  state: AssistantState;
  messages: ConversationMessage[];
  memoryStatus: MemoryLoadStatus;
  /** Historique plus ancien disponible (scroll up). */
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  loadOlderMessages: () => Promise<void>;
  retryMemory: () => void;
  listenSeed: string | undefined;
  toggleListen: () => void;
  submit: (text: string) => void;
  /** Salut vocal (landing) — idle → speaking → idle. `true` si audio joué. */
  speakWelcome: (text: string) => Promise<boolean>;
  /** Alerte proactive (mails / CPU) — idle → speaking → idle, réutilisable. */
  speakAlert: (text: string) => Promise<boolean>;
  confirmAction: (messageId: string) => void;
  cancelAction: (messageId: string) => void;
};

type UseAssistantSessionArgs = {
  /** Phrase non reconnue → ouvrir le catalogue. */
  onUnrecognized?: (phrase: string) => void;
  /** Side-effects UI (terminal, GitHub, Studio) + follow-up pending. */
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
 * Session assistant home — machine + ports (LLM / mémoire / voix / actions).
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
  const loadingOlderRef = useRef(false);
  const assistantRef = useLatestRef(assistant);
  const actionTimersRef = useRef<Map<string, number>>(new Map());
  const actionAbortRef = useRef<Map<string, AbortController>>(new Map());
  const uiPendingRef = useRef<AssistantUiPending>(null);

  useEffect(() => {
    // Attendre la session : sinon list/append tournent sans user → fil fantôme.
    if (authStatus === "loading") {
      return;
    }

    let cancelled = false;
    void (async () => {
      // Différé : évite setState sync dans le corps de l’effect (react-hooks).
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
        const { page, hasMore } = takePageTail(list, CONVERSATION_INITIAL_PAGE);
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

  const welcomeInFlightRef = useRef(false);

  useEffect(() => {
    const timers = actionTimersRef.current;
    const aborts = actionAbortRef.current;
    return () => {
      // Ne pas abort le salut home : Strict Mode / remount couperait le TTS.
      if (!welcomeInFlightRef.current) {
        abortRef.current?.abort();
      }
      stopListenRef.current?.();
      for (const id of timers.values()) {
        window.clearTimeout(id);
      }
      for (const ac of aborts.values()) {
        ac.abort();
      }
    };
  }, []);

  function stopVoiceListen(): void {
    stopListenRef.current?.();
    stopListenRef.current = null;
  }

  function clearActionTimer(messageId: string): void {
    const timer = actionTimersRef.current.get(messageId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      actionTimersRef.current.delete(messageId);
    }
  }

  function scheduleActionExpiry(messageId: string): void {
    clearActionTimer(messageId);
    const timer = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId || !msg.action) {
            return msg;
          }
          const next = transitionAction(
            msg.action.status,
            { type: "EXPIRE" },
            msg.action.proposal.risk,
          );
          return {
            ...msg,
            action: { ...msg.action, status: next },
          };
        }),
      );
      actionTimersRef.current.delete(messageId);
    }, ACTION_TTL_MS);
    actionTimersRef.current.set(messageId, timer);
  }

  function patchAction(
    messageId: string,
    patch: (
      status: ActionStatus,
      proposal: ActionProposal,
    ) => {
      status: ActionStatus;
      notice?: string | undefined;
      clearNotice?: boolean;
      outputLines?: string[];
      exitCode?: number;
    },
  ): void {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.action) {
          return msg;
        }
        const result = patch(msg.action.status, msg.action.proposal);
        const nextNotice = result.clearNotice
          ? undefined
          : (result.notice ?? msg.action.notice);
        return {
          ...msg,
          action: {
            proposal: msg.action.proposal,
            status: result.status,
            outputLines: result.outputLines ?? msg.action.outputLines,
            ...(nextNotice !== undefined ? { notice: nextNotice } : {}),
            ...(result.exitCode !== undefined
              ? { exitCode: result.exitCode }
              : msg.action.exitCode !== undefined
                ? { exitCode: msg.action.exitCode }
                : {}),
          },
        };
      }),
    );
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

  async function persist(message: Message): Promise<void> {
    try {
      await memory.appendMessage(message);
    } catch (error) {
      // UI garde le fil local ; sans log on croit à tort que c’est enregistré.
      log.error("persist_failed", {
        role: message.role,
        message: error instanceof Error ? error.message : "unknown",
      });
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
      const { page, hasMore } = takePageTail(list, CONVERSATION_OLDER_PAGE);
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
      // Échec charge historique : on laisse réessayer au prochain scroll.
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }

  async function runExecute(
    messageId: string,
    proposal: ActionProposal,
  ): Promise<void> {
    clearActionTimer(messageId);
    const ac = new AbortController();
    actionAbortRef.current.set(messageId, ac);
    const lines: string[] = [];

    patchAction(messageId, () => ({
      status: "running",
      outputLines: [],
      clearNotice: true,
    }));

    try {
      for await (const event of action.execute(proposal.id, ac.signal)) {
        if (event.type === "stdout" || event.type === "stderr") {
          lines.push(event.line);
          patchAction(messageId, () => ({
            status: "running",
            outputLines: [...lines],
          }));
        }
        if (event.type === "done") {
          const ok = event.exitCode === 0;
          patchAction(messageId, (status) => ({
            status: transitionAction(
              status,
              { type: ok ? "SUCCEED" : "FAIL" },
              proposal.risk,
            ),
            outputLines: [...lines],
            exitCode: event.exitCode,
          }));
        }
      }
    } catch {
      patchAction(messageId, (status) => ({
        status: transitionAction(status, { type: "FAIL" }, proposal.risk),
        exitCode: 1,
        outputLines: [...lines],
      }));
    } finally {
      actionAbortRef.current.delete(messageId);
    }
  }

  function confirmAction(messageId: string): void {
    const msg = messagesRef.current.find((m) => m.id === messageId);
    const card = msg?.action;
    if (!card || card.status !== "pending") {
      return;
    }

    if (requiresSignature(card.proposal.risk)) {
      patchAction(messageId, (status) => ({
        status: transitionAction(
          status,
          { type: "CONFIRM" },
          card.proposal.risk,
        ),
        clearNotice: true,
      }));

      const ac = new AbortController();
      actionAbortRef.current.set(messageId, ac);
      void action
        .requestSignature(card.proposal.id, ac.signal)
        .then((result) => {
          if (result === "refused") {
            patchAction(messageId, (status) => ({
              status: transitionAction(
                status,
                { type: "SIGNATURE_REFUSED" },
                card.proposal.risk,
              ),
              notice: t("actions.signatureRefused"),
            }));
            return;
          }
          patchAction(messageId, (status) => ({
            status: transitionAction(
              status,
              { type: "SIGNATURE_OK" },
              card.proposal.risk,
            ),
            clearNotice: true,
          }));
          void runExecute(messageId, card.proposal);
        });
      return;
    }

    void runExecute(messageId, card.proposal);
  }

  function cancelAction(messageId: string): void {
    const msg = messagesRef.current.find((m) => m.id === messageId);
    const card = msg?.action;
    if (!card) {
      return;
    }
    clearActionTimer(messageId);
    actionAbortRef.current.get(messageId)?.abort();
    actionAbortRef.current.delete(messageId);
    void action.cancel(card.proposal.id);
    patchAction(messageId, (status) => ({
      status: transitionAction(status, { type: "CANCEL" }, card.proposal.risk),
    }));
  }

  /** Réponse figée (ex. Studio lancé) — sans re-parse LLM. */
  async function runDirectReply(
    fullText: string,
    options?: { persistReply?: boolean },
  ): Promise<void> {
    const trimmedReply = fullText.trim();
    if (trimmedReply.length === 0) {
      dispatch({ type: "REPLY_DONE" });
      return;
    }

    const persistReply = options?.persistReply !== false;
    const ac = new AbortController();
    abortRef.current = ac;
    const id = createMessageId();
    const createdAt = new Date().toISOString();
    speakIdRef.current = id;
    const time = formatMessageTime(new Date(createdAt));

    try {
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "assistant",
          text: trimmedReply,
          time,
          createdAt,
          streaming: false,
        },
      ]);
      dispatch({ type: "REPLY_START" });

      const toSpeak = prepareConversationSpeakText(trimmedReply);
      const speakPromise =
        toSpeak.length > 0 && !ac.signal.aborted
          ? voice.speak(toSpeak, { onLevel: () => {} }, ac.signal).catch(() => {
              /* TTS non bloquant */
            })
          : Promise.resolve();

      await Promise.all([
        persistReply
          ? persist({
              id,
              role: "assistant",
              text: trimmedReply,
              createdAt,
            })
          : Promise.resolve(),
        speakPromise,
      ]);

      speakIdRef.current = null;
      if (!ac.signal.aborted) {
        dispatch({ type: "SPEAK_END" });
      }
    } catch {
      if (ac.signal.aborted) {
        return;
      }
      speakIdRef.current = null;
      dispatch({ type: "FAIL" });
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
      }
    }
  }

  async function runReply(
    userText: string,
    options?: { persistReply?: boolean },
  ): Promise<void> {
    const persistReply = options?.persistReply !== false;
    const ac = new AbortController();
    abortRef.current = ac;
    const id = createMessageId();
    const createdAt = new Date().toISOString();
    speakIdRef.current = id;
    let started = false;
    let fullText = "";
    let proposal: ActionProposal | null = null;

    try {
      for await (const chunk of llm.reply({ text: userText }, ac.signal)) {
        if (ac.signal.aborted) {
          break;
        }
        if (chunk.type === "text") {
          fullText += chunk.text;
          if (!started) {
            started = true;
            const time = formatMessageTime(new Date(createdAt));
            setMessages((prev) => [
              ...prev,
              {
                id,
                role: "assistant",
                text: chunk.text,
                time,
                createdAt,
                streaming: true,
              },
            ]);
            dispatch({ type: "REPLY_START" });
          } else {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === id ? { ...msg, text: msg.text + chunk.text } : msg,
              ),
            );
          }
        }
        if (chunk.type === "action-proposal") {
          proposal = chunk.proposal;
        }
        if (chunk.type === "done") {
          break;
        }
      }

      if (ac.signal.aborted) {
        return;
      }

      if (!started && !proposal) {
        dispatch({ type: "REPLY_DONE" });
        return;
      }

      if (started) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, streaming: false } : msg,
          ),
        );

        const toSpeak = prepareConversationSpeakText(fullText);
        // TTS en parallèle de la persistance — bulle déjà à l’écran.
        const speakPromise =
          toSpeak.length > 0 && !ac.signal.aborted
            ? voice
                .speak(
                  toSpeak,
                  {
                    onLevel: () => {},
                  },
                  ac.signal,
                )
                .catch(() => {
                  /* TTS non bloquant */
                })
            : Promise.resolve();

        await Promise.all([
          persistReply
            ? persist({
                id,
                role: "assistant",
                text: fullText,
                createdAt,
              })
            : Promise.resolve(),
          speakPromise,
        ]);
      }

      if (proposal) {
        const confirmedProposal = proposal;
        const actionId = createMessageId();
        const actionCreatedAt = new Date().toISOString();
        const time = formatMessageTime(new Date(actionCreatedAt));
        setMessages((prev) => [
          ...prev,
          {
            id: actionId,
            role: "assistant",
            text: "",
            time,
            createdAt: actionCreatedAt,
            action: {
              proposal: confirmedProposal,
              status: "pending",
              outputLines: [],
            },
          },
        ]);
        scheduleActionExpiry(actionId);
      }

      speakIdRef.current = null;
      if (!ac.signal.aborted) {
        dispatch({ type: "SPEAK_END" });
      }
    } catch {
      if (ac.signal.aborted) {
        return;
      }
      speakIdRef.current = null;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, streaming: false } : msg)),
      );
      dispatch({ type: "FAIL" });
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null;
      }
    }
  }

  function submit(text: string): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    stopVoiceListen();
    abortRef.current?.abort();
    // Coupe stream/TTS en cours — sinon SPEAK_END manqué et SUBMIT ignoré en speaking.
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

    void persist(userMessage);

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
          await runDirectReply(result.spokenReply, { persistReply });
          return;
        }
        if (result.intent?.kind === "supabase.studio_stop") {
          replyText = "arrête le studio";
        } else if (result.intent?.kind === "supabase.studio") {
          replyText = result.intent.projectQuery
            ? `lance supabase studio sur ${result.intent.projectQuery}`
            : "lance le studio";
        }
        await runReply(replyText, { persistReply });
        return;
      }
      await runReply(replyText, {
        persistReply: shouldPersistAssistantReply(parsed),
      });
    })();
  }

  async function speakRing(
    text: string,
    opts: { markWelcomePlayed: boolean },
  ): Promise<boolean> {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return false;
    }
    if (assistantRef.current !== "idle") {
      return false;
    }
    if (welcomeInFlightRef.current) {
      return false;
    }

    stopVoiceListen();
    const ac = new AbortController();
    abortRef.current = ac;
    welcomeInFlightRef.current = true;

    let ringStarted = false;

    try {
      await voice.speak(
        trimmed,
        {
          onLevel: () => {},
          onStart: () => {
            if (ringStarted || ac.signal.aborted) {
              return;
            }
            ringStarted = true;
            dispatch({ type: "SPEAK_START" });
          },
        },
        ac.signal,
      );
      if (ac.signal.aborted) {
        return false;
      }
      if (ringStarted) {
        if (opts.markWelcomePlayed) {
          welcomeSpokenRef.current = true;
          markWelcomeSpeakPlayed();
        }
        return true;
      }
      return false;
    } finally {
      welcomeInFlightRef.current = false;
      if (abortRef.current === ac) {
        abortRef.current = null;
      }
      if (ringStarted) {
        dispatch({ type: "SPEAK_END" });
      }
    }
  }

  async function speakWelcome(text: string): Promise<boolean> {
    if (welcomeSpokenRef.current) {
      return false;
    }
    // Toujours tenter le TTS — ne plus court-circuiter sur wasWelcomeSpeakPlayed
    // (faux positif → settle sans voix ; les alertes passaient encore via speakAlert).
    const ok = await speakRing(text, { markWelcomePlayed: true });
    if (ok) {
      welcomeSpokenRef.current = true;
    }
    return ok;
  }

  async function speakAlert(text: string): Promise<boolean> {
    return speakRing(text, { markWelcomePlayed: false });
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
    speakWelcome,
    speakAlert,
    confirmAction,
    cancelAction,
  };
}

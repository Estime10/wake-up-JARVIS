"use client";

import { useEffect, useEffectEvent, useReducer, useRef, useState } from "react";

import { usePorts } from "@/app/ports-context";
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
import { useLatestRef } from "@/lib/hooks/useLatestRef";
import { t } from "@/lib/i18n";
import type { ActionProposal, Message } from "@/lib/schemas";
import {
  isWelcomeSpeaking,
  wasWelcomeSpeakPlayed,
} from "@/lib/voice/welcomeSpeak";

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

/**
 * Session assistant home — machine + ports (LLM / mémoire / voix / actions).
 */
export function useAssistantSession(): UseAssistantSessionResult {
  const { llm, memory, voice, action } = usePorts();
  const [assistant, dispatch] = useReducer(sessionReducer, "idle");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const messagesRef = useLatestRef(messages);
  const [memoryStatus, setMemoryStatus] = useState<MemoryLoadStatus>("loading");
  const [memoryAttempt, setMemoryAttempt] = useState(0);
  const [listenSeed, setListenSeed] = useState<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const stopListenRef = useRef<(() => void) | null>(null);
  const speakIdRef = useRef<string | null>(null);
  const welcomeSpokenRef = useRef(false);
  const assistantRef = useLatestRef(assistant);
  const actionTimersRef = useRef<Map<string, number>>(new Map());
  const actionAbortRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    let cancelled = false;
    void memory
      .listMessages()
      .then((list) => {
        if (cancelled) {
          return;
        }
        setMessages(list.map(toConversationMessage));
        setMemoryStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setMemoryStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [memory, memoryAttempt]);

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
    } catch {
      // Écriture mémoire : ne pas faire planter la session UI.
    }
  }

  function retryMemory(): void {
    setMemoryStatus("loading");
    setMemoryAttempt((value) => value + 1);
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

  async function runReply(userText: string): Promise<void> {
    const ac = new AbortController();
    abortRef.current = ac;
    const id = createMessageId();
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
            const time = formatMessageTime(new Date());
            setMessages((prev) => [
              ...prev,
              {
                id,
                role: "assistant",
                text: chunk.text,
                time,
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
        await persist({
          id,
          role: "assistant",
          text: fullText,
          createdAt: new Date().toISOString(),
        });
      }

      if (proposal) {
        const confirmedProposal = proposal;
        const actionId = createMessageId();
        const time = formatMessageTime(new Date());
        setMessages((prev) => [
          ...prev,
          {
            id: actionId,
            role: "assistant",
            text: "",
            time,
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
      dispatch({ type: "SPEAK_END" });
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
      },
    ]);
    dispatch({ type: "SUBMIT" });
    setListenSeed(undefined);

    void persist(userMessage);
    void runReply(trimmed);
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
    if (wasWelcomeSpeakPlayed() && !isWelcomeSpeaking()) {
      welcomeSpokenRef.current = true;
      return true;
    }
    return speakRing(text, { markWelcomePlayed: true });
  }

  async function speakAlert(text: string): Promise<boolean> {
    return speakRing(text, { markWelcomePlayed: false });
  }

  return {
    state: assistant,
    messages,
    memoryStatus,
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

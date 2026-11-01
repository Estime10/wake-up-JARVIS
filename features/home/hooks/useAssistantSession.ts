"use client";

import { useEffect, useReducer, useRef, useState } from "react";

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
  MOCK_ASSISTANT_GREETING,
  MOCK_ASSISTANT_REPLY,
} from "@/fixtures/assistantReply";

type SessionAction =
  | { type: "event"; event: AssistantEvent }
  | { type: "setMuted"; muted: boolean };

type SessionState = {
  assistant: AssistantState;
  muted: boolean;
};

function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  if (action.type === "setMuted") {
    return { ...state, muted: action.muted };
  }
  return {
    ...state,
    assistant: transition(state.assistant, action.event),
  };
}

const THINKING_MS = 1400;
const SPEAK_CHAR_MS = 28;

type UseAssistantSessionResult = {
  state: AssistantState;
  muted: boolean;
  messages: ConversationMessage[];
  startListen: () => void;
  stopListen: () => void;
  toggleListen: () => void;
  submit: (text: string) => void;
  interrupt: () => void;
  toggleMute: () => void;
};

/**
 * Session assistant home — machine + fil mock (thinking → speak stream).
 */
export function useAssistantSession(): UseAssistantSessionResult {
  const [session, dispatch] = useReducer(sessionReducer, {
    assistant: "idle",
    muted: false,
  });
  const [messages, setMessages] = useState<ConversationMessage[]>(() => [
    {
      id: "seed-greeting",
      role: "assistant",
      text: MOCK_ASSISTANT_GREETING,
      time: formatMessageTime(new Date()),
    },
  ]);
  const timersRef = useRef<number[]>([]);
  const speakIdRef = useRef<string | null>(null);

  function clearTimers(): void {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
      window.clearInterval(id);
    }
    timersRef.current = [];
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      if (
        session.assistant !== "speaking" &&
        session.assistant !== "thinking"
      ) {
        return;
      }
      event.preventDefault();
      clearTimers();
      speakIdRef.current = null;
      dispatch({ type: "event", event: { type: "INTERRUPT" } });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [session.assistant]);

  function startListen(): void {
    dispatch({ type: "event", event: { type: "START_LISTEN" } });
  }

  function stopListen(): void {
    dispatch({ type: "event", event: { type: "STOP_LISTEN" } });
  }

  function toggleListen(): void {
    if (session.assistant === "listening") {
      stopListen();
      return;
    }
    if (session.assistant === "idle") {
      startListen();
    }
  }

  function toggleMute(): void {
    dispatch({ type: "setMuted", muted: !session.muted });
  }

  function interrupt(): void {
    clearTimers();
    speakIdRef.current = null;
    dispatch({ type: "event", event: { type: "INTERRUPT" } });
  }

  function beginSpeakStream(fullText: string): void {
    const id = createMessageId();
    speakIdRef.current = id;
    const time = formatMessageTime(new Date());
    setMessages((prev) => [
      ...prev,
      { id, role: "assistant", text: "", time, streaming: true },
    ]);
    dispatch({ type: "event", event: { type: "REPLY_START" } });

    let index = 0;
    const tick = window.setInterval(() => {
      index += 1;
      const next = fullText.slice(0, index);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? {
                ...msg,
                text: next,
                streaming: index < fullText.length,
              }
            : msg,
        ),
      );
      if (index >= fullText.length) {
        window.clearInterval(tick);
        timersRef.current = timersRef.current.filter((t) => t !== tick);
        speakIdRef.current = null;
        const endId = window.setTimeout(() => {
          dispatch({ type: "event", event: { type: "SPEAK_END" } });
        }, 600);
        timersRef.current.push(endId);
      }
    }, SPEAK_CHAR_MS);
    timersRef.current.push(tick);
  }

  function submit(text: string): void {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    clearTimers();
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        role: "user",
        text: trimmed,
        time: formatMessageTime(new Date()),
      },
    ]);
    dispatch({ type: "event", event: { type: "SUBMIT" } });

    const thinkId = window.setTimeout(() => {
      beginSpeakStream(MOCK_ASSISTANT_REPLY);
    }, THINKING_MS);
    timersRef.current.push(thinkId);
  }

  return {
    state: session.assistant,
    muted: session.muted,
    messages,
    startListen,
    stopListen,
    toggleListen,
    submit,
    interrupt,
    toggleMute,
  };
}

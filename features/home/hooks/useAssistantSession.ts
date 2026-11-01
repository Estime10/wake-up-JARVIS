"use client";

import { useEffect, useEffectEvent, useReducer, useRef, useState } from "react";

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
import {
  MOCK_ASSISTANT_GREETING,
  MOCK_ASSISTANT_REPLY,
} from "@/fixtures/assistantReply";

function sessionReducer(
  state: AssistantState,
  event: AssistantEvent,
): AssistantState {
  return transition(state, event);
}

const THINKING_MS = 1400;
const SPEAK_CHAR_MS = 28;

type UseAssistantSessionResult = {
  state: AssistantState;
  messages: ConversationMessage[];
  toggleListen: () => void;
  submit: (text: string) => void;
};

/**
 * Session assistant home — machine + fil mock (thinking → speak stream).
 */
export function useAssistantSession(): UseAssistantSessionResult {
  const [assistant, dispatch] = useReducer(sessionReducer, "idle");
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

  // Seul écouteur clavier global de la home : Échap + Ctrl+Maj+Espace.
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
      dispatch({ type: "STOP_LISTEN" });
      return;
    }
    if (assistant === "idle") {
      dispatch({ type: "START_LISTEN" });
    }
  }

  /**
   * Coupe la réponse : le message en cours garde son texte partiel
   * et n'est plus marqué « en train de répondre ».
   */
  function interrupt(): void {
    clearTimers();
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

  function beginSpeakStream(fullText: string): void {
    const id = createMessageId();
    speakIdRef.current = id;
    const time = formatMessageTime(new Date());
    setMessages((prev) => [
      ...prev,
      { id, role: "assistant", text: "", time, streaming: true },
    ]);
    dispatch({ type: "REPLY_START" });

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
          dispatch({ type: "SPEAK_END" });
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
    dispatch({ type: "SUBMIT" });

    const thinkId = window.setTimeout(() => {
      beginSpeakStream(MOCK_ASSISTANT_REPLY);
    }, THINKING_MS);
    timersRef.current.push(thinkId);
  }

  return {
    state: assistant,
    messages,
    toggleListen,
    submit,
  };
}

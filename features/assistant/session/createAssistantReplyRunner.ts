import {
  createMessageId,
  formatMessageTime,
  type ConversationMessage,
} from "@/features/home/model/conversationMessage";
import type { AssistantEvent } from "@/features/home/model/assistantMachine";
import { prepareConversationSpeakText } from "@/features/home/model/prepareConversationSpeakText";
import { createLogger } from "@/lib/logger";
import type { ActionProposal, Message } from "@/lib/schemas";
import type { LlmPort } from "@/ports/llm-port";
import type { MemoryPort } from "@/ports/memory-port";
import type { VoicePort } from "@/ports/voice-port";

const log = createLogger("assistant.session");

type SetMessages = (
  updater: (prev: ConversationMessage[]) => ConversationMessage[],
) => void;

export type AssistantReplyRunner = {
  persist: (message: Message) => Promise<void>;
  runDirectReply: (
    fullText: string,
    options?: { persistReply?: boolean },
  ) => Promise<void>;
  runReply: (
    userText: string,
    options?: { persistReply?: boolean },
  ) => Promise<void>;
};

/**
 * Réponses LLM / directes — stream, TTS, persistance, cartes d’action.
 */
export function createAssistantReplyRunner(args: {
  getLlm: () => LlmPort;
  getMemory: () => MemoryPort;
  getVoice: () => VoicePort;
  dispatch: (event: AssistantEvent) => void;
  setMessages: SetMessages;
  abortRef: { current: AbortController | null };
  speakIdRef: { current: string | null };
  scheduleActionExpiry: (messageId: string) => void;
}): AssistantReplyRunner {
  const {
    getLlm,
    getMemory,
    getVoice,
    dispatch,
    setMessages,
    abortRef,
    speakIdRef,
    scheduleActionExpiry,
  } = args;

  async function persist(message: Message): Promise<void> {
    try {
      await getMemory().appendMessage(message);
    } catch (error) {
      log.error("persist_failed", {
        role: message.role,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }

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
          ? getVoice()
              .speak(toSpeak, { onLevel: () => {} }, ac.signal)
              .catch(() => {
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
      for await (const chunk of getLlm().reply({ text: userText }, ac.signal)) {
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
        const speakPromise =
          toSpeak.length > 0 && !ac.signal.aborted
            ? getVoice()
                .speak(toSpeak, { onLevel: () => {} }, ac.signal)
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

  return { persist, runDirectReply, runReply };
}

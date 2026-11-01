"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";

import {
  canSubmitComposerDraft,
  normalizeComposerDraft,
} from "@/features/home/model/normalizeComposerDraft";

type UseHomeComposerArgs = {
  onSubmit?: ((text: string) => void) | undefined;
  listening: boolean;
  onToggleListening: () => void;
  disabled?: boolean;
  /** Texte injecté au démarrage de l'écoute (transcription mock). */
  listenSeed?: string | undefined;
};

type UseHomeComposerResult = {
  draft: string;
  setDraft: (value: string) => void;
  canSubmit: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  handleSubmit: (event?: FormEvent) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleMicClick: () => void;
};

const TEXTAREA_MAX_PX = 160;

function isMicShortcut(
  event: KeyboardEvent | globalThis.KeyboardEvent,
): boolean {
  return (
    event.code === "Space" &&
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey
  );
}

/**
 * Composer contrôlé — micro / disabled viennent de la session assistant.
 */
export function useHomeComposer({
  onSubmit,
  listening,
  onToggleListening,
  disabled = false,
  listenSeed,
}: UseHomeComposerArgs): UseHomeComposerResult {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const canSubmit = !disabled && canSubmitComposerDraft(draft);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }, [draft]);

  function beginOrEndListen(): void {
    if (disabled) {
      return;
    }
    if (!listening && listenSeed) {
      setDraft(listenSeed);
    }
    onToggleListening();
  }

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent): void {
      if (disabled || !isMicShortcut(event) || event.repeat) {
        return;
      }
      event.preventDefault();
      if (!listening && listenSeed) {
        setDraft(listenSeed);
      }
      onToggleListening();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, listening, listenSeed, onToggleListening]);

  function handleMicClick(): void {
    beginOrEndListen();
  }

  function handleSubmit(event?: FormEvent): void {
    event?.preventDefault();
    if (disabled) {
      return;
    }
    const text = normalizeComposerDraft(draft);
    if (text.length === 0) {
      return;
    }
    onSubmit?.(text);
    setDraft("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (disabled) {
      return;
    }
    if (isMicShortcut(event)) {
      event.preventDefault();
      beginOrEndListen();
      return;
    }
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    handleSubmit();
  }

  return {
    draft,
    setDraft,
    canSubmit,
    textareaRef,
    handleSubmit,
    handleKeyDown,
    handleMicClick,
  };
}

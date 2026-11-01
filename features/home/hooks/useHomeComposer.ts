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
};

type UseHomeComposerResult = {
  draft: string;
  setDraft: (value: string) => void;
  canSubmit: boolean;
  listening: boolean;
  toggleListening: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  handleSubmit: (event?: FormEvent) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
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
 * État + clavier du composer home.
 * Entrée = envoyer · Maj+Entrée = ligne · Ctrl+Maj+Espace = micro.
 */
export function useHomeComposer({
  onSubmit,
}: UseHomeComposerArgs = {}): UseHomeComposerResult {
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const canSubmit = canSubmitComposerDraft(draft);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }, [draft]);

  function toggleListening(): void {
    setListening((prev) => !prev);
  }

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent): void {
      if (!isMicShortcut(event) || event.repeat) {
        return;
      }
      event.preventDefault();
      setListening((prev) => !prev);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSubmit(event?: FormEvent): void {
    event?.preventDefault();
    const text = normalizeComposerDraft(draft);
    if (text.length === 0) {
      return;
    }
    onSubmit?.(text);
    setDraft("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (isMicShortcut(event)) {
      event.preventDefault();
      toggleListening();
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
    listening,
    toggleListening,
    textareaRef,
    handleSubmit,
    handleKeyDown,
  };
}

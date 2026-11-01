"use client";

import {
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

/**
 * Composer contrôlé — micro / disabled viennent de la session assistant.
 * Le raccourci Ctrl+Maj+Espace est écouté par la session (un seul écouteur) ;
 * le composer réagit à l'entrée en écoute, quelle qu'en soit l'origine.
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

  // Entrée en écoute (clic ou raccourci) → transcription mock injectée.
  // Ajustement pendant le rendu (pas d'effet) : pattern React « prev prop ».
  const [wasListening, setWasListening] = useState(listening);
  if (listening !== wasListening) {
    setWasListening(listening);
    if (listening && listenSeed) {
      setDraft(listenSeed);
    }
  }

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_PX)}px`;
  }, [draft]);

  function handleMicClick(): void {
    if (!disabled) {
      onToggleListening();
    }
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

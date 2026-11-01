"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";

import { buildTerminalPrompt } from "@/features/home/model/buildTerminalPrompt";
import { formatTerminalLastLogin } from "@/features/home/model/formatTerminalLastLogin";
import { completeShellInput } from "@/features/home/model/terminal/completeShellInput";
import { TERMINAL_HOME } from "@/features/home/model/terminal/mockFs";
import { runShellCommand } from "@/features/home/model/terminal/runShellCommand";

type UseTerminalShellResult = {
  lines: string[];
  draft: string;
  setDraft: (value: string) => void;
  prompt: string;
  inputRef: RefObject<HTMLInputElement | null>;
  scrollerRef: RefObject<HTMLDivElement | null>;
  handleSubmit: (event?: FormEvent) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
};

/** Session zsh mock — FS local, cd/ls/tab (pas le vrai disque Mac). */
export function useTerminalShell(active: boolean): UseTerminalShellResult {
  const [cwd, setCwd] = useState(TERMINAL_HOME);
  const [lines, setLines] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bootedRef = useRef(false);
  const prompt = buildTerminalPrompt(cwd);

  useEffect(() => {
    if (!active) {
      bootedRef.current = false;
      return;
    }
    if (!bootedRef.current) {
      bootedRef.current = true;
      setCwd(TERMINAL_HOME);
      setLines([formatTerminalLastLogin(new Date()), ""]);
      setDraft("");
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [active]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [lines, draft]);

  function commit(): void {
    const command = draft;
    const result = runShellCommand({ cwd }, command);
    if (result.clear) {
      setLines([""]);
      setDraft("");
      return;
    }
    setCwd(result.cwd);
    setLines((prev) => [
      ...prev,
      `${buildTerminalPrompt(cwd)}${command}`,
      ...result.lines,
      "",
    ]);
    setDraft("");
  }

  function complete(): void {
    const result = completeShellInput(cwd, draft);
    setDraft(result.draft);
    const listing = result.listing;
    if (listing && listing.length > 0) {
      setLines((prev) => [
        ...prev,
        `${buildTerminalPrompt(cwd)}${draft}`,
        listing.join("  "),
        "",
      ]);
    }
  }

  function handleSubmit(event?: FormEvent): void {
    event?.preventDefault();
    commit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Tab") {
      event.preventDefault();
      complete();
      return;
    }
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      commit();
    }
  }

  return {
    lines,
    draft,
    setDraft,
    prompt,
    inputRef,
    scrollerRef,
    handleSubmit,
    handleKeyDown,
  };
}

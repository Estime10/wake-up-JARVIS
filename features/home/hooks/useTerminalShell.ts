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
import {
  terminalHomeViaTauri,
  terminalRunViaTauri,
} from "@/features/home/tauri/terminalRun";
import { isTauri } from "@/lib/runtime/isTauri";

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

/**
 * Session terminal — web = FS mock ; Tauri = builtins réels sur $HOME|/tmp.
 * Pas d’agent LLM (ADR 0006).
 */
export function useTerminalShell(active: boolean): UseTerminalShellResult {
  const [cwd, setCwd] = useState(TERMINAL_HOME);
  const [lines, setLines] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bootedRef = useRef(false);
  const prompt = buildTerminalPrompt(cwd);

  useEffect(() => {
    if (!active) {
      bootedRef.current = false;
      return;
    }
    if (bootedRef.current) {
      const focusId = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(focusId);
    }
    bootedRef.current = true;

    let cancelled = false;
    const bootId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      setDraft("");
      if (isTauri()) {
        void terminalHomeViaTauri()
          .then((home) => {
            if (cancelled) {
              return;
            }
            setCwd(home);
            setLines([formatTerminalLastLogin(new Date()), ""]);
          })
          .catch(() => {
            if (cancelled) {
              return;
            }
            setCwd(TERMINAL_HOME);
            setLines([formatTerminalLastLogin(new Date()), ""]);
          });
      } else {
        setCwd(TERMINAL_HOME);
        setLines([formatTerminalLastLogin(new Date()), ""]);
      }
    }, 0);

    const focusId = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      cancelled = true;
      window.clearTimeout(bootId);
      window.clearTimeout(focusId);
    };
  }, [active]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [lines, draft]);

  async function commit(): Promise<void> {
    if (busy) {
      return;
    }
    const command = draft;
    const currentCwd = cwd;

    if (isTauri()) {
      setBusy(true);
      setDraft("");
      try {
        const result = await terminalRunViaTauri(currentCwd, command);
        if (result.clear) {
          setLines([""]);
          return;
        }
        setCwd(result.cwd);
        setLines((prev) => [
          ...prev,
          `${buildTerminalPrompt(currentCwd)}${command}`,
          ...result.lines,
          "",
        ]);
      } catch (error) {
        const message =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "terminal_error";
        setLines((prev) => [
          ...prev,
          `${buildTerminalPrompt(currentCwd)}${command}`,
          message,
          "",
        ]);
      } finally {
        setBusy(false);
      }
      return;
    }

    const result = runShellCommand({ cwd: currentCwd }, command);
    if (result.clear) {
      setLines([""]);
      setDraft("");
      return;
    }
    setCwd(result.cwd);
    setLines((prev) => [
      ...prev,
      `${buildTerminalPrompt(currentCwd)}${command}`,
      ...result.lines,
      "",
    ]);
    setDraft("");
  }

  function complete(): void {
    if (isTauri()) {
      return;
    }
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
    void commit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Tab") {
      event.preventDefault();
      complete();
      return;
    }
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void commit();
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

"use client";

import { TerminalPtyShell } from "@/features/home/components/TerminalPtyShell";
import { useIsTauriClient } from "@/features/home/hooks/useIsTauriClient";
import { useTerminalShell } from "@/features/home/hooks/useTerminalShell";
import { t } from "@/lib/i18n";

type TerminalShellProps = {
  active: boolean;
};

/**
 * Shell — Tauri = vrai zsh (PTY) ; web = FS mock.
 */
export function TerminalShell({ active }: TerminalShellProps) {
  const isTauriClient = useIsTauriClient();

  if (isTauriClient) {
    return <TerminalPtyShell active={active} />;
  }

  return <TerminalMockShell active={active} />;
}

function TerminalMockShell({ active }: TerminalShellProps) {
  const {
    lines,
    draft,
    setDraft,
    prompt,
    inputRef,
    scrollerRef,
    handleSubmit,
    handleKeyDown,
  } = useTerminalShell(active);

  return (
    <form
      className="relative z-10 flex h-full min-h-0 flex-col px-5 py-5 sm:px-6 sm:py-6"
      onSubmit={handleSubmit}
      aria-label={t("home.terminalShellLabel")}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollerRef}
        data-scroll-lock-allow="true"
        className="t-mono min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden text-left text-xs leading-loose tracking-wide text-text sm:text-sm"
      >
        {lines.map((line, index) => (
          <p key={`line-${index}`} className="whitespace-pre-wrap break-all">
            {line.length === 0 ? "\u00A0" : line}
          </p>
        ))}
        <label className="flex min-w-0 flex-wrap items-baseline gap-x-1 pt-0.5">
          <span className="shrink-0 select-none">{prompt}</span>
          <input
            ref={inputRef}
            type="text"
            name="terminal-cmd"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            aria-label={t("home.terminalInputLabel")}
            className="t-mono min-w-[8ch] flex-1 border-0 bg-transparent p-0 text-xs leading-loose tracking-wide text-text caret-accent outline-hidden sm:text-sm"
          />
        </label>
      </div>
    </form>
  );
}

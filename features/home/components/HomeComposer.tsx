"use client";

import { Button } from "@/components/ui/Button";
import { MicIcon } from "@/features/home/components/MicIcon";
import { useHomeComposer } from "@/features/home/hooks/useHomeComposer";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeComposerProps = {
  onSubmit?: (text: string) => void;
};

/** Barre de saisie home — textarea, micro, envoi. */
export function HomeComposer({ onSubmit }: HomeComposerProps) {
  const {
    draft,
    setDraft,
    canSubmit,
    listening,
    toggleListening,
    textareaRef,
    handleSubmit,
    handleKeyDown,
  } = useHomeComposer({ onSubmit });

  return (
    <form
      className="w-full max-w-xl px-6"
      onSubmit={handleSubmit}
      aria-label={t("home.composerLabel")}
    >
      <label htmlFor="composer" className="sr-only">
        {t("home.composerLabel")}
      </label>
      <div className="flex items-end gap-2 rounded-md border border-line bg-surface/80 px-3 py-2 shadow-glass backdrop-blur-md">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("home.composerMic")}
          aria-pressed={listening}
          onClick={toggleListening}
          className={cn(
            "mb-0.5 shrink-0 text-text-muted hover:text-text",
            listening && "text-accent hover:text-accent",
          )}
        >
          <MicIcon className="size-5" />
        </Button>
        <textarea
          ref={textareaRef}
          id="composer"
          name="composer"
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            listening
              ? t("home.composerListening")
              : t("home.composerPlaceholder")
          }
          autoComplete="off"
          enterKeyHint="send"
          className="t-body max-h-40 min-h-touch w-full resize-none bg-transparent py-2.5 text-text placeholder:text-text-muted outline-none"
        />
        <Button
          type="submit"
          variant="light"
          size="icon"
          disabled={!canSubmit}
          aria-label={t("home.composerSend")}
          className="mb-0.5 shrink-0"
        >
          <span aria-hidden>→</span>
        </Button>
      </div>
      <p className="t-mono mt-2 text-center text-xs text-text-muted">
        {t("home.composerHints")}
      </p>
    </form>
  );
}

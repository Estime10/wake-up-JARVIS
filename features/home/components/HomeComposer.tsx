"use client";

import { Button } from "@/components/ui/Button";
import { MicIcon } from "@/features/home/components/MicIcon";
import { useHomeComposer } from "@/features/home/hooks/useHomeComposer";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeComposerProps = {
  onSubmit?: (text: string) => void;
  listening: boolean;
  onToggleListening: () => void;
  disabled?: boolean;
  ghost?: boolean;
  listenSeed?: string | undefined;
};

/** Barre de saisie home — textarea, micro, envoi. */
export function HomeComposer({
  onSubmit,
  listening,
  onToggleListening,
  disabled = false,
  ghost = false,
  listenSeed,
}: HomeComposerProps) {
  const {
    draft,
    setDraft,
    canSubmit,
    textareaRef,
    handleSubmit,
    handleKeyDown,
    handleMicClick,
  } = useHomeComposer({
    onSubmit,
    listening,
    onToggleListening,
    disabled,
    listenSeed,
  });

  // Légende unique (l'ancien prop `hint` dupliquait ce ternaire).
  const caption = listening
    ? t("home.composerMicActive")
    : ghost
      ? t("home.composerVoiceOver")
      : t("home.composerHints");

  return (
    <form
      className={cn("w-full max-w-xl px-6", ghost && "opacity-45")}
      onSubmit={handleSubmit}
      aria-label={t("home.composerLabel")}
    >
      <label htmlFor="composer" className="sr-only">
        {t("home.composerLabel")}
      </label>
      {/* aria-disabled (pas disabled) : le focus reste dans le composer
          pendant réflexion/parole ; les handlers ignorent l'action. */}
      {/* Textarea sans outline propre : l'anneau de focus est porté par le
          conteneur (même token que les Button). */}
      <div className="flex items-end gap-2 rounded-md border border-line bg-surface/80 px-3 py-2 shadow-glass backdrop-blur-md has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-accent has-[textarea:focus-visible]:outline-solid">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            listening ? t("home.composerMicStop") : t("home.composerMic")
          }
          aria-pressed={listening}
          aria-disabled={disabled || undefined}
          onClick={handleMicClick}
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
          readOnly={disabled}
          aria-disabled={disabled || undefined}
          autoComplete="off"
          enterKeyHint="send"
          className="t-body max-h-40 min-h-touch w-full resize-none bg-transparent py-2.5 text-text placeholder:text-text-muted outline-hidden aria-disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          variant="light"
          size="icon"
          aria-disabled={!canSubmit || undefined}
          aria-label={t("home.composerSend")}
          className="mb-0.5 shrink-0"
        >
          <span aria-hidden>→</span>
        </Button>
      </div>
      <p
        className="t-mono mt-2 text-center text-sm text-text-muted"
        aria-hidden={listening || undefined}
      >
        {caption}
      </p>
    </form>
  );
}

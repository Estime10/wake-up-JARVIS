"use client";

import { useRef } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { AssistantStage } from "@/features/home/components/AssistantStage";
import { ConversationThread } from "@/features/home/components/ConversationThread";
import { HomeComposer } from "@/features/home/components/HomeComposer";
import { HomeStatusHeader } from "@/features/home/components/HomeStatusHeader";
import { StatusAnnouncer } from "@/features/home/components/StatusAnnouncer";
import { TerminalMarkModal } from "@/features/home/components/TerminalMarkModal";
import { useAssistantSession } from "@/features/home/hooks/useAssistantSession";
import { useHomeChromeReveal } from "@/features/home/hooks/useHomeChromeReveal";
import { useTerminalSession } from "@/features/home/hooks/useTerminalSession";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { MARK_SLOT_SIZE } from "@/features/jarvis/model/markSlotSizes";
import { SplashGreeting } from "@/features/intro/components/SplashGreeting";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { useIntroGreeting } from "@/features/intro/hooks/useIntroGreeting";
import { MOCK_LISTEN_DRAFT } from "@/fixtures/listenDraft";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

/**
 * Home — idle / écoute / réfléchit / parole + fil conversation.
 * Fermeture terminal : mark revient → puis UI home visible.
 */
export function HomeScreen() {
  const greetingText = useIntroGreeting();
  const chromeRef = useRef<HTMLDivElement | null>(null);
  useHomeChromeReveal(chromeRef);

  const terminal = useTerminalSession();
  const { state, messages, toggleListen, submit } = useAssistantSession();

  useVoiceRingMotion(state);

  const listening = state === "listening";
  const busy = state === "thinking" || state === "speaking";
  const showIdleBrand = state === "idle" && messages.length <= 1;

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <HudAmbient />

      <div
        ref={chromeRef}
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0",
          terminal.homeUiHidden && TERMINAL_LAYER_CLASS.chrome,
        )}
      >
        <SplashHudChrome
          settled
          showWake={false}
          terminalOpen={terminal.homeUiHidden}
          terminalTriggerRef={terminal.triggerRef}
          onTerminalClick={terminal.toggle}
        />
      </div>

      {terminal.layer ? (
        <>
          {terminal.open ? (
            <button
              type="button"
              aria-label={t("home.terminalCloseLabel")}
              className={cn(
                "fixed inset-0 cursor-default bg-transparent",
                TERMINAL_LAYER_CLASS.backdrop,
              )}
              onClick={terminal.close}
            />
          ) : null}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center",
              TERMINAL_LAYER_CLASS.slot,
            )}
          >
            <MarkSlot name="terminal" className={MARK_SLOT_SIZE.splash} />
          </div>
          <TerminalMarkModal
            modalRef={terminal.modalRef}
            active={terminal.open}
          />
        </>
      ) : null}

      <div className="relative z-10 flex h-full flex-col">
        <h1 id={MAIN_TITLE_ID} className="sr-only">
          {t("home.title")}
        </h1>
        <HomeStatusHeader listening={listening} />
        <StatusAnnouncer state={state} />
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col items-center px-6 pt-10 transition-[opacity,visibility] duration-[var(--duration-base)] sm:pt-12",
            terminal.homeUiHidden && "pointer-events-none invisible opacity-0",
          )}
          aria-hidden={terminal.homeUiHidden || undefined}
        >
          <AssistantStage state={state} />

          {showIdleBrand ? (
            <div className="mt-5 flex min-h-16 flex-col items-center justify-center gap-2">
              <SplashWordmark settled />
              <SplashGreeting text={greetingText} settled />
            </div>
          ) : null}

          {!showIdleBrand ? (
            <ConversationThread messages={messages} />
          ) : (
            <div className="min-h-0 flex-1" />
          )}

          <div
            data-home="composer"
            className="mb-5 flex w-full justify-center sm:mb-6"
          >
            <HomeComposer
              onSubmit={submit}
              listening={listening}
              onToggleListening={toggleListen}
              disabled={busy}
              ghost={state === "speaking"}
              listenSeed={MOCK_LISTEN_DRAFT}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

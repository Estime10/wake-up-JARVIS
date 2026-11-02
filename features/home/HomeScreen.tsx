"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/Button";
import { HudAmbient } from "@/components/ui/HudAmbient";
import { AssistantStage } from "@/features/home/components/AssistantStage";
import { ConversationLoadState } from "@/features/home/components/ConversationLoadState";
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
import { useRepoPanel } from "@/features/home/context";
import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { MARK_SLOT_SIZE } from "@/features/jarvis/model/markSlotSizes";
import { SplashGreeting } from "@/features/intro/components/SplashGreeting";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { useIntroGreeting } from "@/features/intro/hooks/useIntroGreeting";
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

  const {
    open: terminalOpen,
    layer: terminalLayer,
    homeUiHidden,
    modalRef,
    backdropRef,
    triggerRef,
    toggle: toggleTerminal,
    close: closeTerminal,
  } = useTerminalSession();
  const { open: repoOpen, toggle: toggleRepo } = useRepoPanel();
  const {
    state,
    messages,
    memoryStatus,
    retryMemory,
    listenSeed,
    toggleListen,
    submit,
    confirmAction,
    cancelAction,
  } = useAssistantSession();

  useVoiceRingMotion(state);

  const listening = state === "listening";
  const busy = state === "thinking" || state === "speaking";
  const memoryBlocked = memoryStatus !== "ready";
  const showIdleBrand =
    memoryStatus === "ready" && state === "idle" && messages.length <= 1;

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <HudAmbient />

      <div
        ref={chromeRef}
        data-home="chrome"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0",
          homeUiHidden && TERMINAL_LAYER_CLASS.chrome,
        )}
      >
        <SplashHudChrome
          settled
          showWake={false}
          terminalOpen={homeUiHidden}
          terminalDisabled={repoOpen}
          terminalTriggerRef={triggerRef}
          onTerminalClick={toggleTerminal}
          githubOpen={repoOpen}
          githubDisabled={homeUiHidden}
          onGithubClick={toggleRepo}
        />
      </div>

      {terminalLayer ? (
        <>
          <Button
            ref={backdropRef}
            variant="ghost"
            size="bare"
            tabIndex={terminalOpen ? 0 : -1}
            aria-hidden={!terminalOpen || undefined}
            aria-label={t("home.terminalCloseLabel")}
            className={cn(
              "fixed inset-0 block h-full w-full cursor-default rounded-none bg-bg/85 opacity-0 backdrop-blur-[var(--blur-glass)]",
              !terminalOpen && "pointer-events-none",
              TERMINAL_LAYER_CLASS.backdrop,
            )}
            onClick={closeTerminal}
          >
            <span className="sr-only">{t("home.terminalClose")}</span>
          </Button>
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center",
              TERMINAL_LAYER_CLASS.slot,
            )}
          >
            <MarkSlot name="terminal" className={MARK_SLOT_SIZE.splash} />
          </div>
          <TerminalMarkModal modalRef={modalRef} active={terminalOpen} />
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
            homeUiHidden && "pointer-events-none invisible opacity-0",
          )}
          aria-hidden={homeUiHidden || undefined}
        >
          <AssistantStage state={state} />

          {showIdleBrand ? (
            <div className="mt-5 flex min-h-16 flex-col items-center justify-center gap-2">
              {/* opacity-0 initiale : révélés avec le chrome au landing du mark. */}
              <SplashWordmark />
              <SplashGreeting text={greetingText} />
            </div>
          ) : null}

          {memoryBlocked ? (
            <ConversationLoadState
              status={memoryStatus === "error" ? "error" : "loading"}
              onRetry={retryMemory}
            />
          ) : !showIdleBrand ? (
            <ConversationThread
              messages={messages}
              onConfirmAction={confirmAction}
              onCancelAction={cancelAction}
            />
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
              disabled={busy || memoryBlocked}
              ghost={state === "speaking"}
              listenSeed={listenSeed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

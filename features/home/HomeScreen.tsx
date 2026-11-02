"use client";

import { useRef } from "react";

import { AssistantStage } from "@/features/home/components/AssistantStage";
import { ConversationLoadState } from "@/features/home/components/ConversationLoadState";
import { ConversationThread } from "@/features/home/components/ConversationThread";
import { HomeComposer } from "@/features/home/components/HomeComposer";
import { HomeStatusHeader } from "@/features/home/components/HomeStatusHeader";
import { HomeTerminalPanel } from "@/features/home/components/HomeTerminalPanel";
import { StatusAnnouncer } from "@/features/home/components/StatusAnnouncer";
import { TerminalBackdrop } from "@/features/home/components/TerminalBackdrop";
import { useAssistantSession } from "@/features/home/hooks/useAssistantSession";
import { useHomeChromeReveal } from "@/features/home/hooks/useHomeChromeReveal";
import { useTerminalSession } from "@/features/home/hooks/useTerminalSession";
import { useRepoPanel } from "@/features/home/context";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { SplashGreeting } from "@/features/intro/components/SplashGreeting";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { useIntroGreeting } from "@/features/intro/hooks/useIntroGreeting";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

/**
 * Home — idle / écoute / réfléchit / parole + fil conversation.
 * Terminal / GitHub : même fade du contenu sous l’overlay (blur comparable).
 */
export function HomeScreen() {
  const greetingText = useIntroGreeting();
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const terminalAnchorRef = useRef<HTMLDivElement | null>(null);
  useHomeChromeReveal(chromeRef);

  const {
    open: terminalOpen,
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
  /** Contenu home masqué — sinon le blur GitHub paraît plus fort (fond net). */
  const homeContentHidden = terminalOpen || repoOpen;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={chromeRef}
        data-home="chrome"
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0",
          terminalOpen && TERMINAL_LAYER_CLASS.chrome,
        )}
      >
        <SplashHudChrome
          settled
          showWake={false}
          terminalOpen={terminalOpen}
          terminalDisabled={repoOpen}
          terminalTriggerRef={triggerRef}
          onTerminalClick={toggleTerminal}
          githubOpen={repoOpen}
          githubDisabled={terminalOpen}
          onGithubClick={toggleRepo}
        />
      </div>

      <TerminalBackdrop open={terminalOpen} onClose={closeTerminal} />
      <HomeTerminalPanel open={terminalOpen} anchorRef={terminalAnchorRef} />

      <div className="relative z-10 flex h-full flex-col">
        <h1 id={MAIN_TITLE_ID} className="sr-only">
          {t("home.title")}
        </h1>
        <HomeStatusHeader listening={listening} />
        <StatusAnnouncer state={state} />
        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-10 sm:pt-12">
          <AssistantStage state={state} />

          <div
            ref={terminalAnchorRef}
            className="relative flex min-h-0 w-full flex-1 flex-col"
          >
            <div
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col items-center",
                HUD_OVERLAY_MOTION_CLASS,
                homeContentHidden && "pointer-events-none opacity-0",
              )}
              aria-hidden={homeContentHidden || undefined}
            >
              {showIdleBrand ? (
                <div className="mt-5 flex min-h-16 flex-col items-center justify-center gap-2">
                  <SplashWordmark settled />
                  <SplashGreeting text={greetingText} settled />
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
                  scrollLock={homeContentHidden}
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
      </div>
    </div>
  );
}

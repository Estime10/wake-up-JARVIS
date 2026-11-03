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
import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { useHomeChromeReveal } from "@/features/home/hooks/useHomeChromeReveal";
import { useHomeVoiceGreeting } from "@/features/home/hooks/useHomeVoiceGreeting";
import { useProactiveMarkAlerts } from "@/features/home/hooks/useProactiveMarkAlerts";
import { useTerminalSession } from "@/features/home/hooks/useTerminalSession";
import { useRepoPanel } from "@/features/home/context";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

/**
 * Home — un seul arbre DOM (composer toujours monté pour GSAP).
 * Briefing centré → settle (mark+side, input) → bulles.
 */
export function HomeScreen() {
  const chromeRef = useRef<HTMLDivElement | null>(null);
  useHomeChromeReveal(chromeRef);
  const { phase } = useHomeEnter();
  const briefing = phase === "briefing";
  const settled = phase === "ready";

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
    speakWelcome,
    speakAlert,
    confirmAction,
    cancelAction,
  } = useAssistantSession();

  useVoiceRingMotion(state);
  useHomeVoiceGreeting({ speakWelcome });
  useProactiveMarkAlerts({
    enabled: settled,
    assistantState: state,
    speakAlert,
  });

  const listening = state === "listening";
  const busy = state === "thinking" || state === "speaking";
  const memoryBlocked = memoryStatus !== "ready";
  const showIdleBrand =
    memoryStatus === "ready" && state === "idle" && messages.length === 0;
  const homeContentHidden = terminalOpen || repoOpen;
  const showThread = settled && !memoryBlocked && !showIdleBrand;

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
      <HomeTerminalPanel open={terminalOpen} />

      <div className="relative z-10 flex h-full flex-col">
        <h1 id={MAIN_TITLE_ID} className="sr-only">
          {t("home.title")}
        </h1>
        <HomeStatusHeader listening={listening} />
        <StatusAnnouncer state={state} />

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col items-center px-6",
            briefing ? "justify-center" : "pt-10 sm:pt-12",
          )}
        >
          <AssistantStage />

          <div
            className={cn(
              "relative flex min-h-0 w-full flex-1 flex-col",
              briefing &&
                "pointer-events-none max-h-0 overflow-hidden opacity-0",
            )}
          >
            <div
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col items-center",
                HUD_OVERLAY_MOTION_CLASS,
                homeContentHidden && "pointer-events-none opacity-0",
              )}
              aria-hidden={homeContentHidden || undefined}
            >
              {!settled ? (
                <div className="min-h-0 flex-1" />
              ) : memoryBlocked ? (
                <ConversationLoadState
                  status={memoryStatus === "error" ? "error" : "loading"}
                  onRetry={retryMemory}
                />
              ) : showThread ? (
                <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-end pt-8 sm:pt-10">
                  <ConversationThread
                    messages={messages}
                    onConfirmAction={confirmAction}
                    onCancelAction={cancelAction}
                    scrollLock={homeContentHidden}
                    animateEntrance
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1" />
              )}
            </div>
          </div>

          {/* Toujours monté — hors flux au briefing pour garder mark centré ; GSAP settle cible ce nœud. */}
          <div
            data-home="composer"
            className={cn(
              "mb-5 flex w-full shrink-0 justify-center sm:mb-6",
              briefing &&
                "pointer-events-none absolute inset-x-0 bottom-5 opacity-0 sm:bottom-6",
            )}
            aria-hidden={briefing || undefined}
          >
            <HomeComposer
              onSubmit={submit}
              listening={listening}
              onToggleListening={toggleListen}
              disabled={busy || memoryBlocked || !settled}
              ghost={state === "speaking"}
              listenSeed={listenSeed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

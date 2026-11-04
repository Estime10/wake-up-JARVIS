"use client";

import { useCallback, useState, useRef } from "react";

import { PhraseCatalogModal } from "@/features/assistant/components/PhraseCatalogModal";
import { AssistantStage } from "@/features/home/components/AssistantStage";
import { ConversationLoadState } from "@/features/home/components/ConversationLoadState";
import { ConversationThread } from "@/features/home/components/ConversationThread";
import { HomeComposer } from "@/features/home/components/HomeComposer";
import { HomeLeftCtaStack } from "@/features/home/components/HomeLeftCtaStack";
import { HomeStatusHeader } from "@/features/home/components/HomeStatusHeader";
import { HomeTerminalPanel } from "@/features/home/components/HomeTerminalPanel";
import { StatusAnnouncer } from "@/features/home/components/StatusAnnouncer";
import { useAssistantSession } from "@/features/home/hooks/useAssistantSession";
import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { useHomeChromeReveal } from "@/features/home/hooks/useHomeChromeReveal";
import { useHomeVoiceGreeting } from "@/features/home/hooks/useHomeVoiceGreeting";
import { useProactiveMarkAlerts } from "@/features/home/hooks/useProactiveMarkAlerts";
import { useTerminalSession } from "@/features/home/hooks/useTerminalSession";
import {
  useMailPanel,
  useRepoPanel,
  useSupabasePanel,
} from "@/features/home/context";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { cn } from "@/lib/cn";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { t } from "@/lib/i18n";

/** Aligné sur `REPO_MOTION_MS` (400) — fade contenu sous les tiroirs. */
const PANEL_CONTENT_MOTION_CLASS =
  "transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * Home — un seul arbre DOM (composer toujours monté pour GSAP).
 * Grille 3 cols : messages dans le 70 % bas de la colonne gauche.
 */
export function HomeScreen() {
  const chromeRef = useRef<HTMLDivElement | null>(null);
  useHomeChromeReveal(chromeRef);
  const { phase, skipCenteredBriefing, bootPlaying } = useHomeEnter();
  // Boot = home + scan/nom ; pas de briefing mark géant.
  const briefing = phase === "briefing" && !skipCenteredBriefing;
  const settled = phase === "ready";
  /** Input après boot + settle GSAP. */
  const composerPending =
    bootPlaying || briefing || (skipCenteredBriefing && phase === "briefing");
  /** Équerres pendant boot ; CTAs gauche après boot. */
  const showChrome = bootPlaying || settled || phase === "settling";
  const showLeftCtas = !bootPlaying && (settled || phase === "settling");

  const {
    open: terminalOpen,
    triggerRef,
    toggle: toggleTerminal,
  } = useTerminalSession();
  const { open: repoOpen, toggle: toggleRepo } = useRepoPanel();
  const { open: mailOpen, toggle: toggleMail } = useMailPanel();
  const { open: supabaseOpen, toggle: toggleSupabase } = useSupabasePanel();
  const [phraseCatalogOpen, setPhraseCatalogOpen] = useState(false);
  const [phraseCatalogSeed, setPhraseCatalogSeed] = useState("");
  const openPhraseCatalog = useCallback((phrase: string) => {
    setPhraseCatalogSeed(phrase);
    setPhraseCatalogOpen(true);
  }, []);
  const {
    state,
    messages,
    memoryStatus,
    hasMoreOlder,
    loadingOlder,
    loadOlderMessages,
    retryMemory,
    listenSeed,
    toggleListen,
    submit,
    speakWelcome,
    speakAlert,
    confirmAction,
    cancelAction,
  } = useAssistantSession({ onUnrecognized: openPhraseCatalog });

  useVoiceRingMotion(state);
  const { greetingDone } = useHomeVoiceGreeting({ speakWelcome });
  useProactiveMarkAlerts({
    // Après settle seulement, et après la tentative de salut (sinon vol idle).
    enabled: settled && greetingDone,
    assistantState: state,
    speakAlert,
  });

  const listening = state === "listening";
  const busy = state === "thinking" || state === "speaking";
  const memoryBlocked = memoryStatus !== "ready";
  const showIdleBrand =
    memoryStatus === "ready" && state === "idle" && messages.length === 0;
  const homeContentHidden = terminalOpen || repoOpen || mailOpen;
  const showThread = settled && !memoryBlocked && !showIdleBrand;

  // Terminal / GitHub / mails / Supabase / catalogue : rien en dessous n’est scrollable.
  useScrollLock(
    terminalOpen || repoOpen || mailOpen || supabaseOpen || phraseCatalogOpen,
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      data-scroll-lock-target={homeContentHidden ? "true" : undefined}
    >
      <div
        ref={chromeRef}
        data-home="chrome"
        className={cn(
          // Opacity pilotée par GSAP / phase — pas de `opacity-0` Tailwind
          // (sinon clearProps au settle ramène le HUD invisible).
          "pointer-events-none absolute inset-0",
          showChrome ? "opacity-100" : "opacity-0",
          terminalOpen && TERMINAL_LAYER_CLASS.chrome,
        )}
      >
        <SplashHudChrome settled showWake={false} />
      </div>

      <HomeTerminalPanel open={terminalOpen} />
      {phraseCatalogOpen ? (
        <PhraseCatalogModal
          key={phraseCatalogSeed || "catalog"}
          open
          seedPhrase={phraseCatalogSeed}
          onClose={() => setPhraseCatalogOpen(false)}
        />
      ) : null}

      {/* Grille 3 colonnes égales — gauche 30/70 · centre · droite. */}
      <div className="relative z-10 grid h-full min-h-0 w-full grid-cols-3">
        <div className="grid min-h-0 grid-rows-[30%_70%]">
          <div className="relative z-20 min-h-0 min-w-0">
            <HomeLeftCtaStack
              visible={showLeftCtas}
              terminalOpen={terminalOpen}
              terminalDisabled={repoOpen || mailOpen || supabaseOpen}
              terminalTriggerRef={triggerRef}
              onTerminalClick={toggleTerminal}
              emailOpen={mailOpen}
              emailDisabled={terminalOpen || repoOpen || supabaseOpen}
              onEmailClick={toggleMail}
              githubOpen={repoOpen}
              githubDisabled={terminalOpen || mailOpen || supabaseOpen}
              onGithubClick={toggleRepo}
              supabaseOpen={supabaseOpen}
              supabaseDisabled={terminalOpen || repoOpen || mailOpen}
              onSupabaseClick={toggleSupabase}
            />
          </div>

          <div
            className={cn(
              "relative flex min-h-0 min-w-0 flex-col",
              PANEL_CONTENT_MOTION_CLASS,
              homeContentHidden && "pointer-events-none opacity-0",
            )}
            aria-hidden={homeContentHidden || undefined}
          >
            {!settled ? null : memoryBlocked ? (
              <ConversationLoadState
                status={memoryStatus === "error" ? "error" : "loading"}
                onRetry={retryMemory}
              />
            ) : showThread ? (
              <div className="flex min-h-0 w-full flex-1 flex-col items-stretch justify-end">
                <ConversationThread
                  messages={messages}
                  onConfirmAction={confirmAction}
                  onCancelAction={cancelAction}
                  scrollLock={homeContentHidden}
                  animateEntrance
                  hasMoreOlder={hasMoreOlder}
                  loadingOlder={loadingOlder}
                  onLoadOlder={loadOlderMessages}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-col">
          <h1 id={MAIN_TITLE_ID} className="sr-only">
            {t("home.title")}
          </h1>
          <HomeStatusHeader listening={listening} />
          <StatusAnnouncer state={state} />

          <div
            className={cn(
              "relative flex min-h-0 w-full flex-1 flex-col items-center justify-center px-2",
              PANEL_CONTENT_MOTION_CLASS,
              homeContentHidden && "pointer-events-none opacity-0",
            )}
            aria-hidden={homeContentHidden || undefined}
          >
            <AssistantStage />

            <div
              data-home="composer"
              className={cn(
                "absolute inset-x-0 bottom-5 z-20 mb-0 flex w-full justify-center px-2 sm:bottom-6",
                composerPending && "pointer-events-none opacity-0",
              )}
              aria-hidden={composerPending || undefined}
            >
              <div className="flex w-full justify-center">
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

        <div className="min-h-0 min-w-0" />
      </div>
    </div>
  );
}

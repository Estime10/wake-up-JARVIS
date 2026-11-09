"use client";

import { useCallback, useState, useRef } from "react";

import { PhraseCatalogModal } from "@/features/assistant/components/PhraseCatalogModal";
import { AssistantExpansionLabel } from "@/features/home/components/AssistantExpansionLabel";
import { AssistantStage } from "@/features/home/components/AssistantStage";
import { ConversationEmptyState } from "@/features/home/components/ConversationEmptyState";
import { ConversationLoadState } from "@/features/home/components/ConversationLoadState";
import { ConversationThread } from "@/features/home/components/ConversationThread";
import { HomeComposer } from "@/features/home/components/HomeComposer";
import { HomeStatusHeader } from "@/features/home/components/HomeStatusHeader";
import { HomeSupabasePane } from "@/features/home/components/HomeSupabasePane";
import { HomeTerminalPanel } from "@/features/home/components/HomeTerminalPanel";
import { HomeTopBar } from "@/features/home/components/HomeTopBar";
import { StatusAnnouncer } from "@/features/home/components/StatusAnnouncer";
import { useAssistantSession } from "@/features/home/hooks/useAssistantSession";
import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { useHomeChromeReveal } from "@/features/home/hooks/useHomeChromeReveal";
import { useHomeVoiceGreeting } from "@/features/home/hooks/useHomeVoiceGreeting";
import { useProactiveMarkAlerts } from "@/features/home/hooks/useProactiveMarkAlerts";
import { applyAssistantUiIntent } from "@/features/assistant/services/applyAssistantUiIntent";
import {
  useMailPanel,
  useRepoPanel,
  useTerminalSession,
} from "@/features/home/context";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import {
  SupabasePlatformProvider,
  useSupabasePlatformContext,
} from "@/features/supabase/context/supabasePlatformContext";
import { cn } from "@/lib/cn";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { t } from "@/lib/i18n";

/** Aligné sur `REPO_MOTION_MS` (400) — fade contenu sous les tiroirs. */
const PANEL_CONTENT_MOTION_CLASS =
  "transition-opacity duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/**
 * Home — header unique (horloge | nav | Studio) puis 3 colonnes de contenu.
 */
export function HomeScreen() {
  return (
    <SupabasePlatformProvider>
      <HomeScreenBody />
    </SupabasePlatformProvider>
  );
}

function HomeScreenBody() {
  const chromeRef = useRef<HTMLDivElement | null>(null);
  useHomeChromeReveal(chromeRef);
  const { phase, skipCenteredBriefing, bootPlaying } = useHomeEnter();
  const briefing = phase === "briefing" && !skipCenteredBriefing;
  const settled = phase === "ready";
  const composerPending =
    bootPlaying || briefing || (skipCenteredBriefing && phase === "briefing");
  const showChrome = bootPlaying || settled || phase === "settling";
  const showNav = !bootPlaying && (settled || phase === "settling");

  const {
    open: terminalOpen,
    triggerRef,
    toggle: toggleTerminal,
    openTerminal,
    close: closeTerminal,
  } = useTerminalSession();
  const {
    open: repoOpen,
    toggle: toggleRepo,
    openPanel: openGithubPanel,
    focusRepo,
    close: closeRepo,
    requestTab,
  } = useRepoPanel();
  const {
    open: mailOpen,
    toggle: toggleMail,
    openPanel: openMailPanel,
    close: closeMail,
  } = useMailPanel();
  const platform = useSupabasePlatformContext();
  const [phraseCatalogOpen, setPhraseCatalogOpen] = useState(false);
  const [phraseCatalogSeed, setPhraseCatalogSeed] = useState("");
  const openPhraseCatalog = useCallback((phrase = "") => {
    setPhraseCatalogSeed(phrase);
    setPhraseCatalogOpen(true);
  }, []);
  const onUiIntent = useCallback(
    async (args: {
      intent: Parameters<typeof applyAssistantUiIntent>[0]["intent"];
      text: string;
      pending: Parameters<typeof applyAssistantUiIntent>[0]["pending"];
    }) =>
      applyAssistantUiIntent({
        ...args,
        ui: {
          openTerminal,
          openGithubPanel,
          focusGithubRepo: focusRepo,
          openMailPanel,
          closePanels: (target = "all") => {
            const closed: Array<"terminal" | "mail" | "repo"> = [];
            const want = (id: "terminal" | "mail" | "repo") =>
              target === "all" || target === id;
            if (want("mail") && mailOpen) {
              closeMail();
              closed.push("mail");
            }
            if (want("repo") && repoOpen) {
              closeRepo();
              closed.push("repo");
            }
            if (want("terminal") && terminalOpen) {
              closeTerminal();
              closed.push("terminal");
            }
            return closed;
          },
          openPhraseCatalog: () => openPhraseCatalog(""),
          focusRepoTab: (tab, repoQuery) => {
            requestTab(tab, repoQuery);
          },
          stopSpeaking: () => {
            if (typeof window !== "undefined" && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
          },
          onStudioLaunched: (embedUrl) => {
            platform.adoptStudioUrl(embedUrl);
            platform.refresh();
          },
          onStudioStopped: () => {
            platform.clearStudio();
          },
        },
      }),
    [
      openTerminal,
      openGithubPanel,
      focusRepo,
      openMailPanel,
      mailOpen,
      repoOpen,
      terminalOpen,
      closeMail,
      closeRepo,
      closeTerminal,
      openPhraseCatalog,
      requestTab,
      platform,
    ],
  );
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
  } = useAssistantSession({
    onUnrecognized: openPhraseCatalog,
    onUiIntent,
  });

  useVoiceRingMotion(state);
  const { greetingDone } = useHomeVoiceGreeting({ speakWelcome });
  useProactiveMarkAlerts({
    enabled: settled && greetingDone,
    assistantState: state,
    speakAlert,
  });

  const listening = state === "listening";
  /** Pendant la parole : saisie OK (barge-in). Bloqué seulement en réflexion / boot / mémoire. */
  const composerLocked =
    state === "thinking" || memoryStatus !== "ready" || !settled;
  const memoryBlocked = memoryStatus !== "ready";
  const conversationEmpty = memoryStatus === "ready" && messages.length === 0;
  /** Conversation gauche seulement — mark + composer restent pour enchaîner des actions. */
  const conversationObscured = terminalOpen || repoOpen || mailOpen;
  const showThread = settled && !memoryBlocked && !conversationEmpty;

  useScrollLock(terminalOpen || repoOpen || mailOpen || phraseCatalogOpen);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      data-scroll-lock-target={conversationObscured ? "true" : undefined}
    >
      <div
        ref={chromeRef}
        data-home="chrome"
        className={cn(
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

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col">
        <h1 id={MAIN_TITLE_ID} className="sr-only">
          {t("home.title")}
        </h1>
        <HomeTopBar
          visible={showNav}
          revealRight={settled}
          terminalOpen={terminalOpen}
          terminalDisabled={repoOpen || mailOpen}
          terminalTriggerRef={triggerRef}
          onTerminalClick={toggleTerminal}
          emailOpen={mailOpen}
          emailDisabled={terminalOpen || repoOpen}
          onEmailClick={toggleMail}
          githubOpen={repoOpen}
          githubDisabled={terminalOpen || mailOpen}
          onGithubClick={toggleRepo}
        />

        <div className="grid min-h-0 w-full flex-1 grid-cols-3">
          <div
            className={cn(
              "relative flex min-h-0 min-w-0 flex-col pl-6 sm:pl-8",
              PANEL_CONTENT_MOTION_CLASS,
              conversationObscured && "pointer-events-none opacity-0",
            )}
            aria-hidden={conversationObscured || undefined}
          >
            {!settled ? null : memoryBlocked ? (
              <ConversationLoadState
                status={memoryStatus === "error" ? "error" : "loading"}
                onRetry={retryMemory}
              />
            ) : conversationEmpty ? (
              <ConversationEmptyState />
            ) : showThread ? (
              <div className="flex min-h-0 w-full flex-1 flex-col items-stretch justify-end">
                <ConversationThread
                  messages={messages}
                  onConfirmAction={confirmAction}
                  onCancelAction={cancelAction}
                  scrollLock={conversationObscured}
                  animateEntrance
                  hasMoreOlder={hasMoreOlder}
                  loadingOlder={loadingOlder}
                  onLoadOlder={loadOlderMessages}
                />
              </div>
            ) : null}
          </div>

          <div className="relative flex min-h-0 min-w-0 flex-col">
            <HomeStatusHeader listening={listening} />
            <StatusAnnouncer state={state} />

            <div
              className={cn(
                "relative flex min-h-0 w-full flex-1 flex-col items-center px-2",
                PANEL_CONTENT_MOTION_CLASS,
              )}
            >
              <AssistantStage />

              <AssistantExpansionLabel
                visible={!composerPending && !briefing}
              />

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
                    disabled={composerLocked}
                    ghost={state === "speaking"}
                    listenSeed={listenSeed}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-full min-h-0 min-w-0 flex-col">
            <HomeSupabasePane reveal={settled} />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { PhraseCatalogModal } from "@/features/assistant/components/PhraseCatalogModal";
import { HomeCenterColumn } from "@/features/home/components/layout/columns/HomeCenterColumn";
import { HomeConversationColumn } from "@/features/home/components/layout/columns/HomeConversationColumn";
import { HomeTopBar } from "@/features/home/components/layout/HomeTopBar";
import { HomeMailPanel } from "@/features/home/components/layout/mail/HomeMailPanel";
import { HomeRepoPanel } from "@/features/home/components/layout/repo/HomeRepoPanel";
import { HomeTerminalPanel } from "@/features/home/components/layout/terminal/HomeTerminalPanel";
import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { useMailPanel } from "@/features/home/context/mailPanelContext";
import { useRepoPanel } from "@/features/home/context/repoPanelContext";
import { useTerminalSession } from "@/features/home/context/terminalSessionContext";
import { useAssistantSession } from "@/features/assistant/hooks/useAssistantSession";
import { useHomeUiIntentBridge } from "@/features/home/hooks/useHomeUiIntentBridge";
import { useHomeVoiceGreeting } from "@/features/home/hooks/useHomeVoiceGreeting";
import { usePhraseCatalog } from "@/features/home/hooks/usePhraseCatalog";
import { useProactiveMarkAlerts } from "@/features/home/hooks/useProactiveMarkAlerts";
import { HOME_SIDE_INSET } from "@/features/home/model/homeColumnChrome";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { SupabasePlatformProvider } from "@/features/supabase/context/supabasePlatformContext";
import { SupabasePane } from "@/features/supabase/components/SupabasePane";
import { cn } from "@/lib/cn";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import { t } from "@/lib/i18n/t";

/**
 * Home — header unique puis 3 colonnes. Orchestrateur uniquement.
 */
export function HomeScreen() {
  return (
    <SupabasePlatformProvider>
      <HomeScreenBody />
    </SupabasePlatformProvider>
  );
}

function HomeScreenBody() {
  const { phase, skipCenteredBriefing, bootPlaying } = useHomeEnter();
  const briefing = phase === "briefing" && !skipCenteredBriefing;
  const settled = phase === "ready";
  /** Monte sides/header-right dès settling pour un layout final stable (mark cible juste). */
  const layoutSettled = phase === "settling" || phase === "ready";
  const composerPending =
    bootPlaying || briefing || (skipCenteredBriefing && phase === "briefing");
  const showNav = !bootPlaying && layoutSettled;

  const {
    open: terminalOpen,
    triggerRef,
    toggle: toggleTerminal,
  } = useTerminalSession();
  const { open: repoOpen, toggle: toggleRepo } = useRepoPanel();
  const { open: mailOpen, toggle: toggleMail } = useMailPanel();

  const phraseCatalog = usePhraseCatalog();
  const { onUiIntent } = useHomeUiIntentBridge({
    openPhraseCatalog: () => phraseCatalog.openCatalog(""),
  });

  const session = useAssistantSession({
    onUnrecognized: phraseCatalog.openCatalog,
    onUiIntent,
  });

  useVoiceRingMotion(session.state);
  const { greetingDone } = useHomeVoiceGreeting({
    speakWelcome: session.speakWelcome,
  });
  useProactiveMarkAlerts({
    enabled: settled && greetingDone,
    assistantState: session.state,
    speakAlert: session.speakAlert,
  });

  const conversationObscured = terminalOpen || repoOpen || mailOpen;
  useScrollLock(terminalOpen || repoOpen || mailOpen || phraseCatalog.open);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      data-scroll-lock-target={conversationObscured ? "true" : undefined}
    >
      {phraseCatalog.open ? (
        <PhraseCatalogModal
          key={phraseCatalog.seed || "catalog"}
          open
          seedPhrase={phraseCatalog.seed}
          onClose={phraseCatalog.closeCatalog}
        />
      ) : null}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col">
        <h1 id={MAIN_TITLE_ID} className="sr-only">
          {t("home.title")}
        </h1>
        <HomeTopBar
          visible={showNav}
          revealRight={layoutSettled}
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
            data-home="side-left"
            className={cn(
              "relative flex min-h-0 min-w-0 flex-col overflow-hidden",
              HOME_SIDE_INSET,
              // Glass seulement au settle — invisible pendant splash/briefing.
              layoutSettled ? "liquid-glass" : "pointer-events-none opacity-0",
            )}
          >
            <HomeConversationColumn
              settled={layoutSettled}
              obscured={conversationObscured}
              memoryStatus={session.memoryStatus}
              messages={session.messages}
              hasMoreOlder={session.hasMoreOlder}
              loadingOlder={session.loadingOlder}
              onLoadOlder={session.loadOlderMessages}
              onRetryMemory={session.retryMemory}
              onConfirmAction={session.confirmAction}
              onCancelAction={session.cancelAction}
            />
            <HomeTerminalPanel open={terminalOpen} />
            <HomeMailPanel open={mailOpen} />
            <HomeRepoPanel open={repoOpen} />
          </div>
          <HomeCenterColumn
            state={session.state}
            settled={settled}
            briefing={briefing}
            composerPending={composerPending}
            memoryReady={session.memoryStatus === "ready"}
            listenSeed={session.listenSeed}
            onSubmit={session.submit}
            onToggleListening={session.toggleListen}
          />
          <div
            data-home="side-right"
            className={cn(
              "flex min-h-0 min-w-0 flex-col overflow-hidden",
              HOME_SIDE_INSET,
              layoutSettled ? "liquid-glass" : "pointer-events-none opacity-0",
            )}
          >
            <SupabasePane reveal={layoutSettled} />
          </div>
        </div>
      </div>
    </div>
  );
}

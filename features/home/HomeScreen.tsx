"use client";

import { useRef } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { AssistantStage } from "@/features/home/components/AssistantStage";
import { ConversationThread } from "@/features/home/components/ConversationThread";
import { HomeComposer } from "@/features/home/components/HomeComposer";
import { HomeStatusHeader } from "@/features/home/components/HomeStatusHeader";
import { StatusAnnouncer } from "@/features/home/components/StatusAnnouncer";
import { useAssistantSession } from "@/features/home/hooks/useAssistantSession";
import { useHomeChromeReveal } from "@/features/home/hooks/useHomeChromeReveal";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { useVoiceRingMotion } from "@/features/jarvis/hooks/useVoiceRingMotion";
import { SplashGreeting } from "@/features/intro/components/SplashGreeting";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { useIntroGreeting } from "@/features/intro/hooks/useIntroGreeting";
import { MOCK_LISTEN_DRAFT } from "@/fixtures/listenDraft";
import { t } from "@/lib/i18n";

/**
 * Home — idle / écoute / réfléchit / parole + fil conversation.
 */
export function HomeScreen() {
  const greetingText = useIntroGreeting();
  const chromeRef = useRef<HTMLDivElement | null>(null);
  useHomeChromeReveal(chromeRef);

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
        className="pointer-events-none absolute inset-0 opacity-0"
      >
        <SplashHudChrome settled showWake={false} />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <h1 id={MAIN_TITLE_ID} className="sr-only">
          {t("home.title")}
        </h1>
        <HomeStatusHeader listening={listening} />
        <StatusAnnouncer state={state} />
        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-10 sm:pt-12">
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

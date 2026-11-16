"use client";

import { useCallback } from "react";

import { applyAssistantUiIntent } from "@/features/assistant/services/applyAssistantUiIntent";
import { useMailPanel } from "@/features/home/context/mailPanelContext";
import { useRepoPanel } from "@/features/home/context/repoPanelContext";
import { useTerminalSession } from "@/features/home/context/terminalSessionContext";
import { useSupabasePlatformContext } from "@/features/supabase/context/supabasePlatformContext";

type UiIntentArgs = {
  intent: Parameters<typeof applyAssistantUiIntent>[0]["intent"];
  text: string;
  pending: Parameters<typeof applyAssistantUiIntent>[0]["pending"];
};

type UseHomeUiIntentBridgeArgs = {
  openPhraseCatalog: () => void;
};

/**
 * Pont intents assistant → panneaux home (terminal, mail, repo, Studio).
 */
export function useHomeUiIntentBridge({
  openPhraseCatalog,
}: UseHomeUiIntentBridgeArgs) {
  const {
    open: terminalOpen,
    openTerminal,
    close: closeTerminal,
  } = useTerminalSession();
  const {
    open: repoOpen,
    openPanel: openGithubPanel,
    focusRepo,
    close: closeRepo,
    requestTab,
  } = useRepoPanel();
  const {
    open: mailOpen,
    openPanel: openMailPanel,
    close: closeMail,
  } = useMailPanel();
  const platform = useSupabasePlatformContext();

  const onUiIntent = useCallback(
    async (args: UiIntentArgs) =>
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
          openPhraseCatalog,
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

  return { onUiIntent };
}

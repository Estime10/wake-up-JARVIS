"use client";

import type { Ref } from "react";

import { Button } from "@/components/ui/Button";
import { HomeClock } from "@/features/home/components/HomeClock";
import { HOME_COLUMN_HEADER } from "@/features/home/model/homeColumnChrome";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { useSupabasePlatformContext } from "@/features/supabase/context/supabasePlatformContext";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeTopBarProps = {
  visible?: boolean;
  /** Colonne droite (comptes / Studio) — après settle, comme le fil. */
  revealRight?: boolean;
  terminalOpen?: boolean;
  terminalDisabled?: boolean;
  terminalTriggerRef?: Ref<HTMLButtonElement | null>;
  onTerminalClick?: () => void;
  emailOpen?: boolean;
  emailDisabled?: boolean;
  onEmailClick?: () => void;
  githubOpen?: boolean;
  githubDisabled?: boolean;
  onGithubClick?: () => void;
};

/**
 * Header unique home — horloge | nav | comptes ou retour Studio + URL.
 * Même bandeau pour les 3 colonnes (contenu en dessous).
 */
export function HomeTopBar({
  visible = true,
  revealRight = false,
  terminalOpen = false,
  terminalDisabled = false,
  terminalTriggerRef,
  onTerminalClick,
  emailOpen = false,
  emailDisabled = false,
  onEmailClick,
  githubOpen = false,
  githubDisabled = false,
  onGithubClick,
}: HomeTopBarProps) {
  const platform = useSupabasePlatformContext();
  const hasAccounts = platform.connections.length > 0;
  const studioUrl = platform.studioUrl;

  return (
    <header
      className={cn(
        HOME_COLUMN_HEADER,
        "grid w-full grid-cols-3",
        !visible && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex min-w-0 items-center pl-6 sm:pl-8">
        <HomeClock visible={visible} />
      </div>

      <nav
        className="flex items-center justify-center gap-8 px-3 sm:gap-12 sm:px-4 lg:gap-16"
        aria-label={t("home.navLabel")}
      >
        <Button
          ref={terminalTriggerRef}
          type="button"
          variant="hud"
          size="bare"
          disabled={terminalDisabled}
          aria-expanded={terminalOpen}
          aria-label={
            terminalOpen
              ? t("home.terminalCloseLabel")
              : t("home.terminalLabel")
          }
          onClick={onTerminalClick}
          className="w-fit shrink-0"
        >
          {terminalOpen ? t("home.terminalClose") : t("home.terminal")}
        </Button>

        <Button
          type="button"
          variant="hud"
          size="bare"
          disabled={emailDisabled}
          aria-expanded={emailOpen}
          aria-label={
            emailOpen ? t("home.emailCloseLabel") : t("home.emailLabel")
          }
          onClick={onEmailClick}
          className="w-fit shrink-0"
        >
          {emailOpen ? t("home.mailClose") : t("home.email")}
        </Button>

        <Button
          type="button"
          variant="hud"
          size="bare"
          disabled={githubDisabled}
          aria-expanded={githubOpen}
          aria-label={
            githubOpen ? t("home.githubCloseLabel") : t("home.githubLabel")
          }
          onClick={onGithubClick}
          className="w-fit shrink-0"
        >
          {t("home.github")}
        </Button>
      </nav>

      <div className="flex min-w-0 items-center justify-between gap-2 pr-6 pl-3 sm:pr-8 sm:pl-4">
        {!revealRight ? null : studioUrl ? (
          <div
            key={studioUrl}
            className="flex min-w-0 flex-1 items-center justify-between gap-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="bare"
              data-entrance-side="right"
              className={cn(
                REPO_CHROME.closeButton,
                "conversation-bubble-enter",
              )}
              style={{ animationDelay: "0ms" }}
              onClick={platform.clearStudio}
            >
              {t("home.supabaseStudioBack")}
            </Button>
            <p
              data-entrance-side="right"
              className="t-mono conversation-bubble-enter min-w-0 truncate text-dial text-text-muted sm:text-sm"
              style={{ animationDelay: "140ms" }}
            >
              {studioUrl}
            </p>
          </div>
        ) : hasAccounts ? (
          <div
            key="accounts-chrome"
            className="flex min-w-0 flex-1 items-center justify-between gap-2"
          >
            <p
              data-entrance-side="right"
              className="t-mono conversation-bubble-enter text-sm tracking-wide text-text-muted uppercase"
              style={{ animationDelay: "0ms" }}
            >
              {t("home.supabaseAccountsTitle")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="bare"
              data-entrance-side="right"
              className={cn(
                REPO_CHROME.closeButton,
                "conversation-bubble-enter",
              )}
              style={{ animationDelay: "140ms" }}
              onClick={platform.openConnect}
            >
              {t("home.supabaseAddAccount")}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

"use client";

import type { Ref } from "react";

import { Button } from "@/components/ui/Button";
import { useIntroClockParts } from "@/features/intro/hooks/useIntroClockParts";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeNavHeaderProps = {
  visible?: boolean;
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
 * Nav colonne milieu — heure/date + CTA en `justify-between` sur toute la largeur.
 */
export function HomeNavHeader({
  visible = true,
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
}: HomeNavHeaderProps) {
  const { time, date } = useIntroClockParts();

  return (
    <header
      className={cn(
        "z-20 flex w-full shrink-0 items-center px-3 pt-5 pb-2 sm:px-4 sm:pt-6",
        !visible && "pointer-events-none opacity-0",
      )}
    >
      <nav
        className="flex w-full items-center justify-between gap-2"
        aria-label={t("home.navLabel")}
      >
        <p
          className="t-mono flex min-w-0 flex-wrap items-baseline gap-x-2 truncate text-dial text-text-muted uppercase sm:text-sm"
          suppressHydrationWarning
        >
          <span>{time}</span>
          {date ? <span>{date}</span> : null}
        </p>

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
    </header>
  );
}

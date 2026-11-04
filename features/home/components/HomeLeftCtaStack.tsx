"use client";

import type { Ref } from "react";

import { Button } from "@/components/ui/Button";
import { useIntroClockParts } from "@/features/intro/hooks/useIntroClockParts";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeLeftCtaStackProps = {
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
 * Zone gauche 30 % — alignée sur l’équerre :
 * heure · date → terminal → e-mail → github → supabase.
 */
export function HomeLeftCtaStack({
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
}: HomeLeftCtaStackProps) {
  const { time, date } = useIntroClockParts();

  return (
    <div
      className={cn(
        // Aligné équerre tl : brackets top-3/4 left-3/4 → contenu top-6/8 left-6/8.
        "flex h-full min-h-0 min-w-0 flex-col items-start justify-start gap-3 overflow-hidden pt-6 pl-6 sm:gap-3.5 sm:pt-8 sm:pl-8",
        !visible && "pointer-events-none opacity-0",
      )}
    >
      <p
        className="t-mono flex max-w-full flex-wrap items-baseline gap-x-2 truncate text-dial text-text-muted uppercase sm:text-sm"
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
          terminalOpen ? t("home.terminalCloseLabel") : t("home.terminalLabel")
        }
        onClick={onTerminalClick}
        className="w-fit"
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
        className="w-fit"
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
        className="w-fit"
      >
        {t("home.github")}
      </Button>

      <Button
        type="button"
        variant="hud"
        size="bare"
        aria-label={t("home.supabaseLabel")}
        className="w-fit"
        onClick={() => {
          const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          window.open(
            projectUrl && projectUrl.length > 0
              ? projectUrl
              : "https://supabase.com/dashboard",
            "_blank",
            "noopener,noreferrer",
          );
        }}
      >
        {t("home.supabase")}
      </Button>
    </div>
  );
}

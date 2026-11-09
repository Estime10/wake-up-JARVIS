"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { StudioBrowserSplit } from "@/features/home/components/StudioBrowserSplit";
import { SupabaseConnectModal } from "@/features/home/components/SupabaseConnectModal";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { useSupabasePlatformContext } from "@/features/supabase/context/supabasePlatformContext";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const CONNECT_ERROR_KEYS: Record<string, MessageKey> = {
  unauthorized: "home.supabaseTokenErrorUnauthorized",
  forbidden: "home.supabaseTokenErrorForbidden",
  body: "home.supabaseTokenErrorBody",
  store: "home.supabaseTokenErrorStore",
  network: "home.supabaseTokenErrorNetwork",
  upstream: "home.supabaseTokenErrorUpstream",
  config: "home.supabaseTokenErrorConfig",
  invalid: "home.supabaseTokenErrorUnauthorized",
  limit: "home.supabaseTokenErrorStore",
};

const STUDIO_ERROR_KEYS: Record<string, MessageKey> = {
  disabled: "home.supabaseStudioErrorDisabled",
  not_running: "home.supabaseStudioErrorNotRunning",
  docker_missing: "home.supabaseStudioErrorDockerMissing",
  docker_start_failed: "home.supabaseStudioErrorDockerStart",
  supabase_start_failed: "home.supabaseStudioErrorStart",
  port_in_use: "home.supabaseStudioErrorPortInUse",
  repo_missing: "home.supabaseStudioErrorRepoMissing",
  network: "home.supabaseTokenErrorNetwork",
  upstream: "home.supabaseStudioErrorStart",
};

type HomeSupabasePaneProps = {
  /** Après settle — entrée type messages, pas au boot. */
  reveal?: boolean;
};

/**
 * Corps colonne droite — chrome (comptes) = `HomeTopBar`.
 * Studio plein panneau, sinon comptes.
 */
export function HomeSupabasePane({ reveal = false }: HomeSupabasePaneProps) {
  const platform = useSupabasePlatformContext();
  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [connectErrorKey, setConnectErrorKey] = useState<MessageKey | null>(
    null,
  );

  const hasAccounts = platform.connections.length > 0;
  const dockerErrorKey = platform.dockerError
    ? (STUDIO_ERROR_KEYS[platform.dockerError] ??
      "home.supabaseStudioErrorDockerStart")
    : null;
  const studioErrorKey = platform.studioError
    ? (STUDIO_ERROR_KEYS[platform.studioError] ??
      "home.supabaseStudioErrorStart")
    : null;

  const studioLaunch = platform.connection ? (
    <div className="flex shrink-0 flex-col gap-2 border-t border-line-subtle pt-3">
      {platform.dockerEnsuring ? (
        <p className="t-mono text-sm text-accent" role="status">
          {t("home.supabaseDockerEnsuring")}
        </p>
      ) : null}
      {dockerErrorKey ? (
        <p className="t-mono text-sm text-danger" role="alert">
          {t(dockerErrorKey)}
        </p>
      ) : null}
      <div className="flex min-w-0 items-center justify-between gap-2">
        {platform.connection.selectedProjectName ? (
          <p className="t-mono min-w-0 truncate text-sm text-text">
            {t("home.supabaseActiveProject", {
              name: platform.connection.selectedProjectName,
            })}
          </p>
        ) : (
          <p className="t-mono min-w-0 truncate text-sm text-text">
            {t("home.supabasePickProject")}
          </p>
        )}
        <Button
          type="button"
          variant="hud"
          size="bare"
          className="w-fit shrink-0"
          disabled={
            platform.studioStarting ||
            platform.dockerEnsuring ||
            !platform.connection.selectedProjectRef
          }
          onClick={() => {
            void platform.startStudio();
          }}
        >
          {platform.studioStarting
            ? t("home.supabaseStudioStarting")
            : t("home.supabaseStudioStart")}
        </Button>
      </div>
      {studioErrorKey ? (
        <p className="t-mono text-sm text-danger" role="alert">
          {t(studioErrorKey)}
        </p>
      ) : null}
    </div>
  ) : null;

  const accountsFallback = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain pr-1">
        {platform.status === "loading" ? (
          <p className="t-mono text-sm text-text">
            {t("home.supabaseLoading")}
          </p>
        ) : platform.status === "unavailable" ? (
          <p className="t-mono text-sm text-text">
            {t("home.supabaseUnavailable")}
          </p>
        ) : !hasAccounts ? (
          <div className="flex flex-col items-start gap-2 py-1">
            <Button
              type="button"
              variant="hud"
              size="bare"
              aria-label={t("home.supabaseConnectLabel")}
              onClick={platform.openConnect}
            >
              {t("home.supabaseConnect")}
            </Button>
            <p className="t-mono max-w-[16rem] text-sm text-text">
              {t("home.supabaseConnectDrawerHint")}
            </p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {platform.connections.map((account) => (
                <li key={account.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={account.isActive}
                    onClick={() => {
                      void platform.setActiveAccount(account.id);
                    }}
                    className={cn(
                      "t-mono min-w-0 flex-1 px-1 py-2 text-left text-sm transition-colors",
                      account.isActive
                        ? "text-text"
                        : "text-text hover:text-accent",
                    )}
                  >
                    <span className="block truncate">
                      {account.accountLabel}
                    </span>
                    {account.selectedProjectName ? (
                      <span className="block truncate text-dial text-text">
                        {account.selectedProjectName}
                      </span>
                    ) : null}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="bare"
                    className={REPO_CHROME.closeButton}
                    aria-label={t("home.supabaseDisconnectAccount", {
                      label: account.accountLabel,
                    })}
                    onClick={() => {
                      void platform.disconnect(account.id);
                    }}
                  >
                    {t("home.supabaseDisconnect")}
                  </Button>
                </li>
              ))}
            </ul>

            {platform.connection ? (
              <div className="flex flex-col gap-2">
                <p className="t-mono text-sm tracking-wide text-text uppercase">
                  {t("home.supabaseProjectsTitle")}
                </p>
                {platform.projectsLoading ? (
                  <p className="t-mono text-sm text-text">
                    {t("home.supabaseProjectsLoading")}
                  </p>
                ) : platform.projects.length === 0 ? (
                  <p className="t-mono text-sm text-text">
                    {t("home.supabaseProjectsEmpty")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {platform.projects.map((project) => {
                      const selected =
                        platform.connection?.selectedProjectRef === project.ref;
                      return (
                        <li key={project.id}>
                          <button
                            type="button"
                            aria-pressed={selected}
                            disabled={platform.dockerEnsuring}
                            onClick={() => {
                              void platform.selectProject(project);
                            }}
                            className={cn(
                              "t-mono w-full px-1 py-2 text-left text-sm transition-colors",
                              selected
                                ? "text-text"
                                : "text-text hover:text-accent",
                            )}
                          >
                            <span className="block truncate">
                              {project.name}
                            </span>
                            <span className="block truncate text-dial text-text">
                              {project.ref}
                              {project.region ? ` · ${project.region}` : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      {studioLaunch}
    </div>
  );

  const studioOpen = platform.studioUrl != null;

  return (
    <>
      {reveal ? (
        <section
          className="flex h-full min-h-0 min-w-0 flex-col"
          aria-label={t("home.supabasePanelLabel")}
          data-scroll-lock-allow="true"
        >
          <div
            key="supabase-pane-enter"
            data-scroll-lock-allow="true"
            data-entrance-side="right"
            className={cn(
              "conversation-bubble-enter flex min-h-0 flex-1 flex-col overflow-hidden pr-6 pl-3 sm:pr-8 sm:pl-4",
              // Studio : bas collé, haut un peu rentré (header Studio visible).
              // Comptes : HUD sous équerres.
              studioOpen ? "pt-5 pb-0 sm:pt-6" : "pb-6 sm:pb-8",
            )}
          >
            <StudioBrowserSplit
              studioUrl={platform.studioUrl}
              topFallback={accountsFallback}
            />
          </div>
        </section>
      ) : null}

      <SupabaseConnectModal
        open={platform.connectOpen}
        submitting={connectSubmitting}
        errorKey={connectErrorKey}
        onClose={() => {
          platform.closeConnect();
          setConnectErrorKey(null);
        }}
        onConnect={async (input) => {
          setConnectSubmitting(true);
          setConnectErrorKey(null);
          try {
            const result = await platform.connect(input);
            if (!result.ok) {
              setConnectErrorKey(
                CONNECT_ERROR_KEYS[result.error] ??
                  "home.supabaseTokenErrorUpstream",
              );
              return;
            }
            platform.closeConnect();
          } finally {
            setConnectSubmitting(false);
          }
        }}
      />
    </>
  );
}

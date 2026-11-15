"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { StudioBrowserSplit } from "@/features/supabase/components/StudioBrowserSplit";
import { SupabaseConnectModal } from "@/features/supabase/components/SupabaseConnectModal";
import { HOME_SIDE_CONTENT_PAD } from "@/features/home/model/homeColumnChrome";
import { useSupabasePlatformContext } from "@/features/supabase/context/supabasePlatformContext";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/types";
import { t } from "@/lib/i18n/t";

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

type SupabasePaneProps = {
  /** Après settle — entrée type messages, pas au boot. */
  reveal?: boolean;
};

/**
 * Corps colonne droite — chrome (comptes) = `HomeTopBar`.
 * Studio plein panneau, sinon comptes.
 */
export function SupabasePane({ reveal = false }: SupabasePaneProps) {
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
    <div
      className={cn(
        "mt-auto flex shrink-0 flex-col items-center justify-center gap-2 border-t border-line-subtle text-center",
        HOME_SIDE_CONTENT_PAD,
      )}
    >
      {platform.dockerEnsuring ? (
        <p
          className="t-content text-base leading-snug text-accent"
          role="status"
        >
          {t("home.supabaseDockerEnsuring")}
        </p>
      ) : null}
      {dockerErrorKey ? (
        <p
          className="t-content text-base leading-snug text-danger"
          role="alert"
        >
          {t(dockerErrorKey)}
        </p>
      ) : null}
      {!platform.connection.selectedProjectRef ? (
        <p className="t-content min-w-0 text-base leading-snug">
          {t("home.supabasePickProject")}
        </p>
      ) : null}
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
      {studioErrorKey ? (
        <p
          className="t-content text-base leading-snug text-danger"
          role="alert"
        >
          {t(studioErrorKey)}
        </p>
      ) : null}
    </div>
  ) : null;

  const accountsFallback = (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain",
          HOME_SIDE_CONTENT_PAD,
          platform.connection && "pb-0",
        )}
      >
        {platform.status === "loading" ? (
          <p className="t-content text-base leading-snug">
            {t("home.supabaseLoading")}
          </p>
        ) : platform.status === "unavailable" ? (
          <p className="t-content text-base leading-snug">
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
              {t("home.supabaseAddAccount")}
            </Button>
            <p className="t-content max-w-[16rem] text-base leading-snug">
              {t("home.supabaseConnectDrawerHint")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {platform.connections.map((account) => {
              const showProjects =
                account.isActive && platform.connection != null;
              return (
                <li
                  key={account.id}
                  className="border-b border-line-subtle pb-3 mb-3 last:mb-0"
                >
                  <div className="flex items-baseline justify-between gap-3 px-1">
                    <button
                      type="button"
                      aria-pressed={account.isActive}
                      onClick={() => {
                        void platform.setActiveAccount(account.id);
                      }}
                      className={cn(
                        "t-content min-w-0 flex-1 truncate py-2 text-left text-base leading-snug uppercase transition-colors",
                        account.isActive
                          ? "text-text"
                          : "text-text hover:text-accent",
                      )}
                    >
                      {account.accountLabel}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="bare"
                      className="t-label shrink-0 text-text hover:text-accent"
                      aria-label={t("home.supabaseDisconnectAccount", {
                        label: account.accountLabel,
                      })}
                      onClick={() => {
                        void platform.disconnect(account.id);
                      }}
                    >
                      {t("home.supabaseDisconnect")}
                    </Button>
                  </div>

                  {showProjects ? (
                    <div className="flex flex-col gap-1">
                      {platform.projectsLoading ? (
                        <p className="t-content px-1 text-base leading-snug">
                          {t("home.supabaseProjectsLoading")}
                        </p>
                      ) : platform.projects.length === 0 ? (
                        <p className="t-content px-1 text-base leading-snug">
                          {t("home.supabaseProjectsEmpty")}
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {platform.projects.map((project) => {
                            const selected =
                              platform.connection?.selectedProjectRef ===
                              project.ref;
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
                                    "t-content w-full px-1 py-2 text-left text-base leading-snug transition-colors",
                                    selected
                                      ? "text-text"
                                      : "text-text hover:text-accent",
                                  )}
                                >
                                  <span className="flex min-w-0 items-baseline gap-2">
                                    <span className="min-w-0 truncate uppercase">
                                      {project.name}
                                    </span>
                                    {selected ? (
                                      <span className="t-label shrink-0 text-accent">
                                        {t("home.supabaseActiveBadge")}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="t-mono block truncate text-text-muted">
                                    {project.ref}
                                    {project.region
                                      ? ` · ${project.region}`
                                      : ""}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {studioLaunch}
    </div>
  );

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
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
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

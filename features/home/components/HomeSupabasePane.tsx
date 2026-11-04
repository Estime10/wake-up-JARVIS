"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { SupabaseConnectModal } from "@/features/home/components/SupabaseConnectModal";
import { SupabaseStudioBrowser } from "@/features/home/components/SupabaseStudioBrowser";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { useSupabasePlatform } from "@/features/supabase/hooks/useSupabasePlatform";
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
};

const STUDIO_ERROR_KEYS: Record<string, MessageKey> = {
  disabled: "home.supabaseStudioErrorDisabled",
  docker_missing: "home.supabaseStudioErrorDockerMissing",
  docker_start_failed: "home.supabaseStudioErrorDockerStart",
  supabase_start_failed: "home.supabaseStudioErrorStart",
  port_in_use: "home.supabaseStudioErrorPortInUse",
  network: "home.supabaseTokenErrorNetwork",
  upstream: "home.supabaseStudioErrorStart",
};

/**
 * Colonne droite permanente — Studio / comptes comme surface bureau
 * (pas de tiroir, pas de barre fermer).
 */
export function HomeSupabasePane() {
  const platform = useSupabasePlatform();
  const [connectOpen, setConnectOpen] = useState(false);
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

  return (
    <>
      <section
        className="flex h-full min-h-0 min-w-0 flex-col"
        aria-label={t("home.supabasePanelLabel")}
        data-scroll-lock-allow="true"
      >
        <div
          data-scroll-lock-allow="true"
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-4 pt-5 pr-6 pb-4 pl-3 sm:pt-6 sm:pr-8 sm:pl-4",
            platform.studioUrl
              ? "overflow-hidden"
              : "overflow-y-auto overscroll-y-contain",
          )}
        >
          {platform.status === "loading" ? (
            <p className="t-mono text-sm text-text-muted">
              {t("home.supabaseLoading")}
            </p>
          ) : platform.status === "unavailable" ? (
            <p className="t-mono text-sm text-text-muted">
              {t("home.supabaseUnavailable")}
            </p>
          ) : platform.studioUrl ? (
            <SupabaseStudioBrowser
              studioUrl={platform.studioUrl}
              onBack={platform.clearStudio}
            />
          ) : !hasAccounts ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <Button
                type="button"
                variant="hud"
                size="bare"
                aria-label={t("home.supabaseConnectLabel")}
                onClick={() => {
                  setConnectErrorKey(null);
                  setConnectOpen(true);
                }}
              >
                {t("home.supabaseConnect")}
              </Button>
              <p className="t-mono max-w-[16rem] text-center text-sm text-text-muted">
                {t("home.supabaseConnectDrawerHint")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="t-mono text-sm tracking-wide text-text-muted uppercase">
                    {t("home.supabaseAccountsTitle")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="bare"
                    className={REPO_CHROME.closeButton}
                    onClick={() => {
                      setConnectErrorKey(null);
                      setConnectOpen(true);
                    }}
                  >
                    {t("home.supabaseAddAccount")}
                  </Button>
                </div>
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
                            : "text-text-muted hover:text-text",
                        )}
                      >
                        <span className="block truncate">
                          {account.accountLabel}
                        </span>
                        {account.selectedProjectName ? (
                          <span className="block truncate text-dial opacity-70">
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
              </div>

              {platform.connection ? (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="t-mono text-sm tracking-wide text-text-muted uppercase">
                      {t("home.supabaseProjectsTitle")}
                    </p>
                    {platform.projectsLoading ? (
                      <p className="t-mono text-sm text-text-muted">
                        {t("home.supabaseProjectsLoading")}
                      </p>
                    ) : platform.projects.length === 0 ? (
                      <p className="t-mono text-sm text-text-muted">
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
                                  "t-mono w-full px-1 py-2 text-left text-sm transition-colors",
                                  selected
                                    ? "text-text"
                                    : "text-text-muted hover:text-text",
                                  platform.dockerEnsuring && "opacity-60",
                                )}
                              >
                                <span className="block truncate">
                                  {project.name}
                                </span>
                                <span className="block truncate text-dial opacity-70">
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

                  <div className="mt-auto flex flex-col gap-2 border-t border-line-subtle pt-4">
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
                    {platform.connection.selectedProjectName ? (
                      <p className="t-mono text-sm text-text-muted">
                        {t("home.supabaseActiveProject", {
                          name: platform.connection.selectedProjectName,
                        })}
                      </p>
                    ) : (
                      <p className="t-mono text-sm text-text-muted">
                        {t("home.supabasePickProject")}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="hud"
                      size="bare"
                      className="w-fit"
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
                      <p className="t-mono text-sm text-danger" role="alert">
                        {t(studioErrorKey)}
                      </p>
                    ) : null}
                    <p className="t-mono text-dial text-text-muted sm:text-sm">
                      {t("home.supabaseStudioHint")}
                    </p>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </section>

      <SupabaseConnectModal
        open={connectOpen}
        submitting={connectSubmitting}
        errorKey={connectErrorKey}
        onClose={() => setConnectOpen(false)}
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
            setConnectOpen(false);
          } finally {
            setConnectSubmitting(false);
          }
        }}
      />
    </>
  );
}

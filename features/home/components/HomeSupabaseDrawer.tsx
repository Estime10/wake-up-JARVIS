"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import {
  REPO_MOTION_CLASS,
  REPO_SLIDE_IN,
  RIGHT_SLIDE_OUT,
} from "@/features/home/animations";
import { SupabaseConnectModal } from "@/features/home/components/SupabaseConnectModal";
import { SupabaseStudioBrowser } from "@/features/home/components/SupabaseStudioBrowser";
import { useSupabasePanel } from "@/features/home/context";
import {
  REPO_MOTION_MS,
  usePresenceMotion,
} from "@/features/home/hooks/usePresenceMotion";
import { HOME_RIGHT_SECTION_WIDTH_CLASS } from "@/features/home/model/homeColumnLayout";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
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
 * Tiroir Supabase — multi-comptes → projets → Docker / Studio local.
 */
export function HomeSupabaseDrawer() {
  const { open, close } = useSupabasePanel();
  const motion = usePresenceMotion(open, REPO_MOTION_MS);
  const platform = useSupabasePlatform();
  const [connectOpen, setConnectOpen] = useState(false);
  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [connectErrorKey, setConnectErrorKey] = useState<MessageKey | null>(
    null,
  );

  if (!motion.mounted) {
    return null;
  }

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
      <aside
        className={cn(
          "fixed inset-y-0 right-0 flex flex-col border-l border-line-subtle bg-bg isolate",
          HOME_RIGHT_SECTION_WIDTH_CLASS,
          REPO_MOTION_CLASS,
          REPO_LAYER_CLASS.panel,
          motion.visible ? REPO_SLIDE_IN : RIGHT_SLIDE_OUT,
        )}
        data-scroll-lock-allow="true"
        aria-label={t("home.supabasePanelLabel")}
        aria-hidden={!motion.visible || undefined}
        inert={!motion.visible ? true : undefined}
      >
        <header className={cn(REPO_CHROME.header, "justify-between")}>
          <p className="t-mono text-sm tracking-wide text-text-muted uppercase">
            {t("home.supabase")}
          </p>
          <Button
            variant="ghost"
            size="bare"
            className={REPO_CHROME.closeButton}
            aria-label={t("home.supabaseCloseLabel")}
            onClick={() => {
              setConnectOpen(false);
              close();
            }}
          >
            {t("home.supabaseClose")}
          </Button>
        </header>

        <div
          data-scroll-lock-allow="true"
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-4 px-4 py-4",
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
                          "t-mono min-w-0 flex-1 rounded-md px-3 py-2 text-left text-sm transition-colors",
                          account.isActive
                            ? "bg-surface-2 text-text"
                            : "text-text-muted hover:bg-surface-2/50 hover:text-text",
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
                                  "t-mono w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                                  selected
                                    ? "bg-surface-2 text-text"
                                    : "text-text-muted hover:bg-surface-2/50 hover:text-text",
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
                      variant="bordered"
                      size="md"
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
      </aside>

      <SupabaseConnectModal
        open={connectOpen && motion.visible}
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

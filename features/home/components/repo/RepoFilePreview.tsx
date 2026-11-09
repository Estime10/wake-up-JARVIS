"use client";

import { Button } from "@/components/ui/Button";
import {
  RepoExternalIcon,
  RepoFileIcon,
  RepoLockIcon,
} from "@/features/home/components/repo/icons";
import { RepoPreviewBody } from "@/features/home/components/repo/RepoPreviewBody";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import type { RepoPreviewKind } from "@/features/home/model/repoPanelScenario";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

/** Fichier affiché dans l’aperçu (shape UI, indépendante des fixtures). */
export type RepoPreviewFile = {
  kind: "file";
  name: string;
  sizeLabel?: string;
  linesLabel?: string;
  content?: string;
  protected?: boolean;
};

export type RepoFilePreviewModel = {
  path: string;
  branch: string;
  file: RepoPreviewFile;
  kind: RepoPreviewKind;
};

type RepoFilePreviewProps = {
  model: RepoFilePreviewModel;
  onClose: () => void;
  onRetry: () => void;
};

/**
 * Chrome du 2ᵉ tiroir aperçu (header / meta / footer).
 * Corps délégué à RepoPreviewBody.
 */
export function RepoFilePreview({
  model,
  onClose,
  onRetry,
}: RepoFilePreviewProps) {
  const { path, branch, file, kind } = model;
  const sizeLabel = file.sizeLabel ?? "—";
  const linesLabel = file.linesLabel;
  const maskedCount = kind === "masked" ? 1 : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className={cn(REPO_CHROME.header, "justify-between gap-3")}>
        <div className="flex min-w-0 items-center gap-2">
          {kind === "protected" ? (
            <RepoLockIcon className="size-4 shrink-0 text-text" />
          ) : (
            <RepoFileIcon className="size-4 shrink-0 text-text" />
          )}
          <p className="t-mono truncate text-sm text-text">{path}</p>
        </div>
        <Button
          variant="ghost"
          size="bare"
          className={REPO_CHROME.closeButton}
          aria-label={t("home.repoPreviewCloseLabel")}
          onClick={onClose}
        >
          {t("home.repoClose")}
        </Button>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-3">
        <p className="t-mono text-dial text-text sm:text-sm">
          {[sizeLabel, linesLabel, branch].filter(Boolean).join(" · ")}
          {maskedCount > 0
            ? ` · ${t("home.repoPreviewMaskedBadge", { count: maskedCount })}`
            : ""}
        </p>
        {kind !== "protected" && kind !== "offline" && kind !== "loading" ? (
          <Button
            variant="ghost"
            size="bare"
            className="t-label flex items-center gap-1.5 text-sm text-text hover:text-accent"
            aria-label={t("home.repoOpenGithubLabel")}
            onClick={() => undefined}
          >
            <RepoExternalIcon className="size-3.5" />
            {t("home.repoOpenGithub")}
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3">
        <RepoPreviewBody
          kind={kind}
          path={path}
          onRetry={onRetry}
          {...(file.content !== undefined ? { content: file.content } : {})}
        />
      </div>

      <footer className={REPO_CHROME.footer}>
        <p className={REPO_CHROME.footerText}>{t("home.repoPreviewFooter")}</p>
      </footer>
    </div>
  );
}

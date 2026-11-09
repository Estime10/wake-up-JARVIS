"use client";

import { Button } from "@/components/ui/Button";
import {
  RepoBranchIcon,
  RepoCommitIcon,
  RepoExternalIcon,
} from "@/features/home/components/repo/icons";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { formatCommitAbsoluteTime } from "@/lib/github/formatCommitAbsoluteTime";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type { RepoCommit } from "@/lib/schemas";

export type RepoCommitPreviewModel = {
  commit: RepoCommit;
  branch: string;
  githubUrl: string;
};

type RepoCommitPreviewProps = {
  model: RepoCommitPreviewModel;
  onClose: () => void;
};

/**
 * Chrome du 2ᵉ tiroir — détail d’un commit (lecture seule).
 */
export function RepoCommitPreview({ model, onClose }: RepoCommitPreviewProps) {
  const { commit, branch, githubUrl } = model;
  const authorLabel = commit.author.toLocaleUpperCase("fr-FR");
  const absolute = formatCommitAbsoluteTime(commit.committedAt);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className={cn(REPO_CHROME.header, "justify-between gap-3")}>
        <div className="flex min-w-0 items-center gap-2">
          <RepoCommitIcon className="size-4 shrink-0 text-text" />
          <p className="t-mono truncate text-sm text-text">{commit.sha}</p>
        </div>
        <Button
          variant="ghost"
          size="bare"
          className={REPO_CHROME.closeButton}
          aria-label={t("home.repoCommitPreviewCloseLabel")}
          onClick={onClose}
        >
          {t("home.repoClose")}
        </Button>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-4 pt-3">
        <p className="t-mono inline-flex items-center gap-1.5 text-dial text-text sm:text-sm">
          <RepoBranchIcon className="size-3.5 shrink-0" />
          {t("home.repoCommitPointed", { branch })}
        </p>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("home.repoCommitOpenGithubLabel")}
          className="t-label inline-flex items-center gap-1.5 text-sm text-text outline-hidden transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
        >
          <RepoExternalIcon className="size-3.5" />
          {t("home.repoOpenGithub")}
        </a>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-4 pb-4">
        <p className="t-mono text-base leading-relaxed whitespace-pre-wrap text-text">
          {commit.message}
        </p>
        <dl className="mt-6 space-y-3 border-t border-line-subtle pt-4">
          <div>
            <dt className="t-mono text-dial text-text uppercase sm:text-sm">
              {t("home.repoCommitAuthor")}
            </dt>
            <dd className="t-mono mt-1 text-sm text-text">{authorLabel}</dd>
          </div>
          <div>
            <dt className="t-mono text-dial text-text uppercase sm:text-sm">
              {t("home.repoCommitHash")}
            </dt>
            <dd className="t-mono mt-1 break-all text-sm text-text">
              {commit.id}
            </dd>
          </div>
          <div>
            <dt className="t-mono text-dial text-text uppercase sm:text-sm">
              {t("home.repoCommitDate")}
            </dt>
            <dd className="t-mono mt-1 text-sm text-text">
              {absolute}
              {" · "}
              {commit.relativeTime}
            </dd>
          </div>
        </dl>
      </div>

      <footer className={REPO_CHROME.footer}>
        <p className={REPO_CHROME.footerText}>
          {t("home.repoCommitPreviewFooter")}
        </p>
      </footer>
    </div>
  );
}

"use client";

import { RepoCommitItem } from "@/features/home/components/repo/RepoCommitItem";
import { RepoExternalIcon } from "@/features/home/components/repo/icons";
import { t } from "@/lib/i18n";
import type { RepoCommit } from "@/lib/schemas";

type RepoCommitsListProps = {
  commits: RepoCommit[];
  selectedId: string | null;
  branch: string;
  githubCommitsUrl: string;
  onSelect: (id: string) => void;
};

/**
 * Liste commits — timeline + lien GitHub (détail = 2ᵉ tiroir).
 */
export function RepoCommitsList({
  commits,
  selectedId,
  branch,
  githubCommitsUrl,
  onSelect,
}: RepoCommitsListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <p className="t-mono shrink-0 px-1 text-dial text-text uppercase sm:text-sm">
        {t("home.repoCommitsCount", { count: commits.length })}
      </p>

      <ul
        data-scroll-lock-allow="true"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain px-1"
      >
        {commits.map((commit, index) => (
          <RepoCommitItem
            key={commit.id}
            commit={commit}
            branch={branch}
            selected={commit.id === selectedId}
            isLast={index === commits.length - 1}
            onSelect={() => onSelect(commit.id)}
          />
        ))}
      </ul>

      <div className="shrink-0 border-t border-line-subtle px-1 pt-3">
        <a
          href={githubCommitsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("home.repoCommitsOnGithubLabel")}
          className="t-mono inline-flex items-center gap-2 text-sm tracking-wide text-text uppercase outline-hidden transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
        >
          {t("home.repoCommitsOnGithub")}
          <RepoExternalIcon className="size-3.5 shrink-0" />
        </a>
      </div>
    </div>
  );
}

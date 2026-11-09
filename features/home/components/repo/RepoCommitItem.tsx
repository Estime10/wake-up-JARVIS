"use client";

import { Button } from "@/components/ui/Button";
import { RepoCommitSelectIcon } from "@/features/home/components/repo/icons";
import { cn } from "@/lib/cn";
import type { RepoCommit } from "@/lib/schemas";

type RepoCommitItemProps = {
  commit: RepoCommit;
  branch: string;
  selected: boolean;
  isLast: boolean;
  onSelect: () => void;
};

/**
 * Ligne commit — nœud timeline + carte (détail = tiroir).
 */
export function RepoCommitItem({
  commit,
  branch,
  selected,
  isLast,
  onSelect,
}: RepoCommitItemProps) {
  const authorLabel = commit.author.toLocaleUpperCase("fr-FR");

  return (
    <li className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-x-3">
      <div
        className="pointer-events-none relative flex flex-col items-center pt-3.5"
        aria-hidden
      >
        <span
          className={cn(
            "z-10 size-2 shrink-0 rounded-full border",
            selected ? "border-text bg-text" : "border-line bg-surface",
          )}
        />
        {isLast ? null : (
          <span className="mt-1 w-px flex-1 border-l border-dashed border-line-subtle" />
        )}
      </div>

      <div className="min-w-0 pb-2">
        <Button
          type="button"
          variant="ghost"
          size="bare"
          aria-pressed={selected}
          className={cn(
            "relative flex w-full flex-col items-start gap-1 rounded-md border px-3 py-2.5 pr-8 text-left font-normal tracking-normal normal-case",
            selected
              ? "border-line bg-surface-2"
              : "border-line-subtle/70 hover:border-line hover:bg-surface-2/50",
          )}
          onClick={onSelect}
        >
          {selected ? (
            <RepoCommitSelectIcon className="pointer-events-none absolute top-2.5 right-2.5 size-3.5 text-text" />
          ) : null}
          <span className="t-mono w-full min-w-0 truncate text-sm text-text">
            {commit.message}
          </span>
          <span className="t-mono w-full min-w-0 truncate text-dial text-text sm:text-sm">
            {authorLabel}
            {" · "}
            {branch}
            {" · "}
            {commit.relativeTime}
            {" · "}
            {commit.sha}
          </span>
        </Button>
      </div>
    </li>
  );
}

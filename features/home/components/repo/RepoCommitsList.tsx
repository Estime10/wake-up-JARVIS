"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { RepoCommit } from "@/lib/schemas";

type RepoCommitsListProps = {
  commits: RepoCommit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Liste commits — sélection bordure (état 1). */
export function RepoCommitsList({
  commits,
  selectedId,
  onSelect,
}: RepoCommitsListProps) {
  return (
    <ul className="flex flex-col gap-2 px-1">
      {commits.map((commit) => {
        const selected = commit.id === selectedId;
        return (
          <li key={commit.id}>
            <Button
              variant="ghost"
              size="bare"
              aria-pressed={selected}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-md border px-3 py-2.5 text-left font-normal tracking-normal normal-case",
                selected
                  ? "border-line bg-surface-2"
                  : "border-transparent hover:border-line-subtle hover:bg-surface-2/50",
              )}
              onClick={() => onSelect(commit.id)}
            >
              <span className="t-mono text-dial text-text-muted sm:text-sm">
                {commit.sha}
              </span>
              <span className="t-mono text-sm text-text">{commit.message}</span>
              <span className="t-mono text-dial text-text-muted sm:text-sm">
                {commit.author} · {commit.relativeTime}
              </span>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

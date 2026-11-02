import { RepoFileTree } from "@/features/home/components/RepoFileTree";
import { RepoCommitsList } from "@/features/home/components/repo/RepoCommitsList";
import { RepoPanelEmptyCommits } from "@/features/home/components/repo/RepoPanelEmptyCommits";
import { useRepoSession } from "@/features/home/context";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

/** Contenu de l’onglet actif (branches / fichiers / commits / PR) — mock. */
export function RepoTabContent() {
  const session = useRepoSession();

  if (!session.repo) {
    return (
      <p className="t-mono px-1 text-sm text-text-muted">
        {t("home.repoEmpty")}
      </p>
    );
  }

  if (session.tab === "branches") {
    return (
      <ul className="flex flex-col gap-1 px-1">
        <li>
          <p
            className={cn(
              "t-mono flex w-full items-baseline justify-between gap-2 rounded-md border border-line bg-surface-2 px-3 py-2.5 text-sm text-accent",
            )}
          >
            <span className="min-w-0 truncate uppercase">
              {session.repo.branch}
            </span>
            <span className="shrink-0 text-dial text-text-muted sm:text-sm">
              {t("home.repoBranchDefault")}
            </span>
          </p>
        </li>
      </ul>
    );
  }

  if (session.tab === "files") {
    return (
      <RepoFileTree
        nodes={session.repo.tree}
        selectedPath={session.selectedPath}
        onSelectFile={session.openFile}
      />
    );
  }

  if (session.tab === "pr") {
    return (
      <p className="t-mono px-1 text-sm text-text-muted">
        {t("home.repoPrEmpty")}
      </p>
    );
  }

  if (
    session.scenario === "emptyCommits" ||
    session.repo.commits.length === 0
  ) {
    return <RepoPanelEmptyCommits />;
  }

  return (
    <RepoCommitsList
      commits={session.repo.commits}
      selectedId={session.selectedCommitId}
      onSelect={session.setSelectedCommitId}
    />
  );
}

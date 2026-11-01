import { RepoFileTree } from "@/features/home/components/RepoFileTree";
import { RepoCommitsList } from "@/features/home/components/repo/RepoCommitsList";
import { RepoPanelEmptyCommits } from "@/features/home/components/repo/RepoPanelEmptyCommits";
import { useRepoSession } from "@/features/home/context";
import { t } from "@/lib/i18n";

/** Contenu de l’onglet actif (fichiers / commits / PR). */
export function RepoTabContent() {
  const session = useRepoSession();

  if (!session.repo) {
    return (
      <p className="t-mono px-1 text-sm text-text-muted">
        {t("home.repoEmpty")}
      </p>
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

  if (session.tab === "commits") {
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

  return (
    <p className="t-mono px-1 text-sm text-text-muted">
      {t("home.repoPrEmpty")}
    </p>
  );
}

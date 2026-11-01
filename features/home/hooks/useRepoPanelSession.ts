"use client";

import { useCallback, useState } from "react";

import type { RepoFilePreviewModel } from "@/features/home/components/repo/RepoFilePreview";
import type { RepoPanelScenario } from "@/features/home/model/repoPanelScenario";
import { REPO_TABS, type RepoTab } from "@/features/home/model/repoTab";
import { findMockRepoFile, MOCK_REPOS, type MockRepo } from "@/fixtures/repos";

export { REPO_TABS, type RepoTab };

type UseRepoPanelSessionArgs = {
  panelOpen: boolean;
};

export type RepoPanelSession = {
  scenario: RepoPanelScenario;
  setScenario: (value: RepoPanelScenario) => void;
  repoId: string;
  setRepoId: (value: string) => void;
  repo: MockRepo | undefined;
  tab: RepoTab;
  setTab: (value: RepoTab) => void;
  selectedCommitId: string | null;
  setSelectedCommitId: (value: string | null) => void;
  selectedPath: string | null;
  preview: RepoFilePreviewModel | null;
  openFile: (path: string) => void;
  closePreview: () => void;
  retryPreview: () => void;
  retryPanel: () => void;
  goNominal: () => void;
};

const SCENARIOS_WITHOUT_PREVIEW: ReadonlySet<RepoPanelScenario> = new Set([
  "emptyRepos",
  "disconnected",
  "denied",
  "error",
  "loading",
]);

/**
 * Session mock panneau REPO — scénarios maquette + aperçu fichier.
 */
export function useRepoPanelSession({
  panelOpen,
}: UseRepoPanelSessionArgs): RepoPanelSession {
  const [scenario, setScenarioState] = useState<RepoPanelScenario>("nominal");
  const [repoId, setRepoIdState] = useState(MOCK_REPOS[0]?.id ?? "");
  const [tab, setTab] = useState<RepoTab>("files");
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(
    MOCK_REPOS[0]?.commits[0]?.id ?? null,
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<RepoFilePreviewModel | null>(
    null,
  );

  const repo = MOCK_REPOS.find((item) => item.id === repoId);
  const preview = panelOpen ? previewState : null;

  const closePreview = useCallback(() => {
    setPreviewState(null);
  }, []);

  function setScenario(value: RepoPanelScenario): void {
    setScenarioState(value);
    if (SCENARIOS_WITHOUT_PREVIEW.has(value)) {
      setPreviewState(null);
      setSelectedPath(null);
    }
    if (value === "emptyCommits") {
      setTab("commits");
    }
  }

  function setRepoId(value: string): void {
    setRepoIdState(value);
    const next = MOCK_REPOS.find((item) => item.id === value);
    setSelectedCommitId(next?.commits[0]?.id ?? null);
    setSelectedPath(null);
    setPreviewState(null);
    if (scenario === "emptyCommits" || scenario === "emptyRepos") {
      setScenarioState("nominal");
    }
  }

  function openFile(path: string): void {
    if (!repo) {
      return;
    }
    const file = findMockRepoFile(repo.tree, path);
    if (!file) {
      return;
    }
    setSelectedPath(path);
    const kind =
      scenario === "offline"
        ? "offline"
        : (file.preview ?? (file.protected ? "protected" : "nominal"));
    setPreviewState({
      path,
      branch: repo.branch,
      file,
      kind,
    });
  }

  function retryPreview(): void {
    if (!previewState) {
      return;
    }
    setPreviewState({ ...previewState, kind: "loading" });
    window.setTimeout(() => {
      setPreviewState((current) =>
        current ? { ...current, kind: "nominal" } : null,
      );
    }, 700);
  }

  function retryPanel(): void {
    setScenarioState("loading");
    window.setTimeout(() => {
      setScenarioState("nominal");
    }, 700);
  }

  function goNominal(): void {
    setScenarioState("nominal");
  }

  return {
    scenario,
    setScenario,
    repoId,
    setRepoId,
    repo,
    tab,
    setTab,
    selectedCommitId,
    setSelectedCommitId,
    selectedPath: panelOpen ? selectedPath : null,
    preview,
    openFile,
    closePreview,
    retryPreview,
    retryPanel,
    goNominal,
  };
}

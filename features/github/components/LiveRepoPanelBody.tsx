"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type KeyboardEvent,
} from "react";

import { usePorts } from "@/app/ports-context";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useLiveRepoPreview } from "@/features/github/context/liveRepoPreviewContext";
import { useRepoPanel } from "@/features/home/context";
import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";
import {
  getLiveRepoDetailCache,
  getLiveRepoListCache,
  getLiveRepoSelectionCache,
  isLiveRepoCacheFresh,
  liveRepoDetailKey,
  setLiveRepoDetailCache,
  setLiveRepoListCache,
  setLiveRepoSelectionCache,
  type LiveRepoDetailSnapshot,
} from "@/features/github/model/liveRepoSessionCache";
import { RepoFileTree } from "@/features/home/components/RepoFileTree";
import { RepoCommitsList } from "@/features/home/components/repo/RepoCommitsList";
import { RepoPanelEmptyCommits } from "@/features/home/components/repo/RepoPanelEmptyCommits";
import { RepoPanelEmptyRepos } from "@/features/home/components/repo/RepoPanelEmptyRepos";
import { RepoPanelError } from "@/features/home/components/repo/RepoPanelError";
import { RepoPanelLoading } from "@/features/home/components/repo/RepoPanelLoading";
import type { RepoPreviewKind } from "@/features/home/model/repoPanelScenario";
import { REPO_TABS, type RepoTab } from "@/features/home/model/repoTab";
import { REPO_TAB_LABEL_KEY } from "@/features/home/model/repoTabsUi";
import { nextTabIndex } from "@/features/home/model/tabKeyboard";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type {
  RepoBranch,
  RepoCommit,
  RepoPull,
  RepoSummary,
  RepoTreeNode,
} from "@/lib/schemas";

type LiveRepoPanelBodyProps = {
  login: string;
  onDisconnect: () => void;
  disconnecting: boolean;
};

type LoadStatus = "loading" | "ready" | "error" | "empty";

type DetailView = {
  branches: RepoBranch[];
  tree: RepoTreeNode[];
  commits: RepoCommit[];
  pulls: RepoPull[];
  detailStatus: LoadStatus;
  loadedKey: string | null;
  selectedCommitId: string | null;
};

function initialListState(): {
  repos: RepoSummary[];
  listStatus: LoadStatus;
} {
  const cached = getLiveRepoListCache();
  if (!cached) {
    return { repos: [], listStatus: "loading" };
  }
  if (cached.repos.length === 0) {
    return { repos: [], listStatus: "empty" };
  }
  return { repos: cached.repos, listStatus: "ready" };
}

function initialSelection(repos: RepoSummary[]): {
  repoId: string;
  branch: string;
  tab: RepoTab;
} {
  const saved = getLiveRepoSelectionCache();
  if (saved && repos.some((item) => item.id === saved.repoId)) {
    return saved;
  }
  const first = repos[0];
  return {
    repoId: first?.id ?? "",
    branch: first?.defaultBranch ?? "",
    tab: "files",
  };
}

function detailFromCache(
  snapshot: LiveRepoDetailSnapshot,
  key: string,
): DetailView {
  return {
    branches: snapshot.branches,
    tree: snapshot.tree,
    commits: snapshot.commits,
    pulls: snapshot.pulls,
    detailStatus: "ready",
    loadedKey: key,
    selectedCommitId: snapshot.commits[0]?.id ?? null,
  };
}

function initialDetailState(repoId: string, branch: string): DetailView {
  if (!repoId || !branch) {
    return {
      branches: [],
      tree: [],
      commits: [],
      pulls: [],
      detailStatus: "loading",
      loadedKey: null,
      selectedCommitId: null,
    };
  }
  const key = liveRepoDetailKey(repoId, branch);
  const cached = getLiveRepoDetailCache(key);
  if (!cached) {
    return {
      branches: [],
      tree: [],
      commits: [],
      pulls: [],
      detailStatus: "loading",
      loadedKey: null,
      selectedCommitId: null,
    };
  }
  return detailFromCache(cached, key);
}

/**
 * Corps panneau REPO live — branches / fichiers / commits + aperçu.
 * Cache session (TTL 1 h) : réouverture instantanée ; refetch seulement si périmé.
 */
export function LiveRepoPanelBody({
  login,
  onDisconnect,
  disconnecting,
}: LiveRepoPanelBodyProps) {
  const { repo: repoPort } = usePorts();
  const { setPreview, setCommitPreview, closePreview, registerRetry } =
    useLiveRepoPreview();
  const idPrefix = useId();

  const bootList = initialListState();
  const bootSelection = initialSelection(bootList.repos);
  const bootDetail = initialDetailState(
    bootSelection.repoId,
    bootSelection.branch,
  );

  const [repos, setRepos] = useState<RepoSummary[]>(bootList.repos);
  const [listStatus, setListStatus] = useState<LoadStatus>(bootList.listStatus);
  const [repoId, setRepoId] = useState(bootSelection.repoId);
  const [branch, setBranch] = useState(bootSelection.branch);
  const [tab, setTab] = useState<RepoTab>(bootSelection.tab);
  const [branches, setBranches] = useState<RepoBranch[]>(bootDetail.branches);
  const [tree, setTree] = useState<RepoTreeNode[]>(bootDetail.tree);
  const [commits, setCommits] = useState<RepoCommit[]>(bootDetail.commits);
  const [pulls, setPulls] = useState<RepoPull[]>(bootDetail.pulls);
  const [detailStatus, setDetailStatus] = useState<LoadStatus>(
    bootDetail.detailStatus,
  );
  const [loadedKey, setLoadedKey] = useState<string | null>(
    bootDetail.loadedKey,
  );
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(
    bootDetail.selectedCommitId,
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [listAttempt, setListAttempt] = useState(0);
  const { focusRepoQuery, clearFocusRepo, focusTab, clearFocusTab } =
    useRepoPanel();

  const selected = repos.find((item) => item.id === repoId);
  const activeRef = branch || selected?.defaultBranch || "";
  const detailKey = selected ? liveRepoDetailKey(selected.id, activeRef) : "";
  const detailLoading =
    Boolean(selected) &&
    (loadedKey !== detailKey || detailStatus === "loading");

  const applyDetailView = useCallback((view: DetailView) => {
    setBranches(view.branches);
    setTree(view.tree);
    setCommits(view.commits);
    setPulls(view.pulls);
    setDetailStatus(view.detailStatus);
    setLoadedKey(view.loadedKey);
    setSelectedCommitId(view.selectedCommitId);
    setSelectedPath(null);
  }, []);

  const hydrateDetail = useCallback(
    (nextRepoId: string, nextBranch: string): void => {
      const key = liveRepoDetailKey(nextRepoId, nextBranch);
      const cached = getLiveRepoDetailCache(key);
      if (cached) {
        applyDetailView(detailFromCache(cached, key));
        return;
      }
      applyDetailView({
        branches: [],
        tree: [],
        commits: [],
        pulls: [],
        detailStatus: "loading",
        loadedKey: null,
        selectedCommitId: null,
      });
    },
    [applyDetailView],
  );

  const reloadList = useCallback(() => {
    setListStatus("loading");
    setListAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    setLiveRepoSelectionCache({ repoId, branch, tab });
  }, [repoId, branch, tab]);

  useEffect(() => {
    if (!focusRepoQuery || repos.length === 0) {
      return;
    }
    const q = normalizeIntentText(focusRepoQuery);
    const match =
      repos.find((item) => normalizeIntentText(item.id) === q) ??
      repos.find((item) => normalizeIntentText(item.name) === q) ??
      repos.find((item) => normalizeIntentText(item.name).includes(q)) ??
      repos.find((item) => normalizeIntentText(item.id).includes(q));
    const timer = window.setTimeout(() => {
      if (!match) {
        clearFocusRepo();
        return;
      }
      setRepoId(match.id);
      setBranch(match.defaultBranch);
      hydrateDetail(match.id, match.defaultBranch);
      clearFocusRepo();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusRepoQuery, repos, clearFocusRepo, hydrateDetail]);

  useEffect(() => {
    if (!focusTab) {
      return;
    }
    const timer = window.setTimeout(() => {
      setTab(focusTab);
      clearFocusTab();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusTab, clearFocusTab]);

  useEffect(() => {
    let cancelled = false;
    const cached = getLiveRepoListCache();
    const fresh = cached !== null && isLiveRepoCacheFresh(cached.fetchedAt);

    if (fresh && listAttempt === 0) {
      return;
    }

    void repoPort
      .listRepos()
      .then((list) => {
        if (cancelled) {
          return;
        }
        setLiveRepoListCache(list);
        setRepos(list);
        if (list.length === 0) {
          setListStatus("empty");
          setRepoId("");
          setBranch("");
          return;
        }
        setListStatus("ready");
        setRepoId((current) => {
          const nextId =
            current && list.some((item) => item.id === current)
              ? current
              : (list[0]?.id ?? "");
          const nextRepo = list.find((item) => item.id === nextId);
          if (nextRepo) {
            const saved = getLiveRepoSelectionCache();
            const nextBranch =
              current === nextId && saved?.repoId === nextId && saved.branch
                ? saved.branch
                : nextRepo.defaultBranch;
            setBranch(nextBranch);
            hydrateDetail(nextRepo.id, nextBranch);
          }
          return nextId;
        });
      })
      .catch(() => {
        if (!cancelled && !cached) {
          setRepos([]);
          setListStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repoPort, listAttempt, hydrateDetail]);

  useEffect(() => {
    if (!selected || !activeRef) {
      return;
    }

    const repoKey = selected.id;
    const ref = activeRef;
    const key = liveRepoDetailKey(repoKey, ref);
    const cached = getLiveRepoDetailCache(key);
    const fresh = cached !== null && isLiveRepoCacheFresh(cached.fetchedAt);

    if (fresh && detailAttempt === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      repoPort.listBranches(repoKey, selected.defaultBranch),
      repoPort.listTree(repoKey, ref),
      repoPort.listCommits(repoKey, ref),
      repoPort.listPulls(repoKey),
    ])
      .then(([nextBranches, nextTree, nextCommits, nextPulls]) => {
        if (cancelled) {
          return;
        }
        setLiveRepoDetailCache(key, {
          branches: nextBranches,
          tree: nextTree,
          commits: nextCommits,
          pulls: nextPulls,
        });
        setBranches(nextBranches);
        setTree(nextTree);
        setCommits(nextCommits);
        setPulls(nextPulls);
        setSelectedCommitId(nextCommits[0]?.id ?? null);
        setSelectedPath(null);
        closePreview();
        setLoadedKey(key);
        setDetailStatus("ready");
      })
      .catch(() => {
        if (!cancelled && !cached) {
          setLoadedKey(key);
          setDetailStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repoPort, selected, activeRef, detailAttempt, closePreview]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const next = nextTabIndex(
      event.key,
      REPO_TABS.indexOf(tab),
      REPO_TABS.length,
    );
    const nextTab = next === null ? undefined : REPO_TABS[next];
    if (!nextTab) {
      return;
    }
    event.preventDefault();
    setTab(nextTab);
    if (nextTab === "files") {
      setCommitPreview(null);
    } else if (nextTab === "commits") {
      setPreview(null);
    } else {
      closePreview();
    }
  }

  function selectBranch(name: string): void {
    hydrateDetail(repoId, name);
    setBranch(name);
    setTab("files");
    closePreview();
  }

  function openCommit(commitId: string): void {
    if (!selected) {
      return;
    }
    const commit = commits.find((item) => item.id === commitId);
    if (!commit) {
      return;
    }
    const ref = activeRef || selected.defaultBranch;
    setSelectedCommitId(commitId);
    setCommitPreview({
      commit,
      branch: ref,
      githubUrl: `https://github.com/${encodeURIComponent(selected.owner)}/${encodeURIComponent(selected.name)}/commit/${encodeURIComponent(commit.id)}`,
    });
  }

  async function openFile(path: string): Promise<void> {
    if (!selected || !activeRef) {
      return;
    }
    setSelectedPath(path);
    registerRetry(() => {
      void openFile(path);
    });
    const loadingFile = {
      kind: "file" as const,
      name: path.split("/").pop() ?? path,
    };
    setPreview({
      path,
      branch: activeRef,
      file: loadingFile,
      kind: "loading",
    });

    try {
      const file = await repoPort.getFile(selected.id, path, activeRef);
      const kind: RepoPreviewKind =
        file.kind === "empty" ? "nominal" : file.kind;
      setPreview({
        path: file.path,
        branch: activeRef,
        file: {
          kind: "file",
          name: file.name,
          sizeLabel: file.sizeLabel,
          ...(file.linesLabel ? { linesLabel: file.linesLabel } : {}),
          ...(file.content !== undefined ? { content: file.content } : {}),
        },
        kind,
      });
    } catch {
      setPreview({
        path,
        branch: activeRef,
        file: loadingFile,
        kind: "error",
      });
    }
  }

  if (listStatus === "loading") {
    return <RepoPanelLoading />;
  }

  if (listStatus === "error") {
    return (
      <RepoPanelError
        repoName="GitHub"
        detail={t("home.repoErrorDetail")}
        onRetry={reloadList}
      />
    );
  }

  if (listStatus === "empty") {
    return (
      <RepoPanelEmptyRepos
        live={{
          login,
          disconnecting,
          onDisconnect,
        }}
      />
    );
  }

  const tabId = (value: RepoTab) => `${idPrefix}-live-tab-${value}`;
  const panelId = `${idPrefix}-live-panel`;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-2 border-b border-line-subtle px-4 py-3">
        <Select
          id={`${idPrefix}-live-repo`}
          aria-label={t("home.repoSelectLabel")}
          value={repoId}
          options={repos.map((item) => ({
            value: item.id,
            label: `${item.name.toUpperCase()} · ${item.private ? "privé" : "public"}`,
          }))}
          onChange={(id) => {
            const next = repos.find((item) => item.id === id);
            const nextBranch = next?.defaultBranch ?? "";
            hydrateDetail(id, nextBranch);
            setRepoId(id);
            if (next) {
              setBranch(nextBranch);
            }
          }}
        />
        {activeRef ? (
          <p className="t-mono text-dial text-text-muted sm:text-sm">
            {t("home.repoBranch", { branch: activeRef })}
          </p>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="bare"
          disabled={disconnecting}
          className="t-mono self-start text-sm tracking-wide text-text-muted uppercase hover:text-danger"
          onClick={onDisconnect}
        >
          {disconnecting
            ? t("home.repoDisconnecting")
            : t("home.repoDisconnect")}
        </Button>
      </div>

      {detailLoading ? (
        <RepoPanelLoading />
      ) : detailStatus === "error" ? (
        <RepoPanelError
          repoName={selected?.name ?? "—"}
          detail={t("home.repoErrorDetail")}
          onRetry={() => {
            setLoadedKey(null);
            setDetailStatus("loading");
            setDetailAttempt((value) => value + 1);
          }}
        />
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t("home.repoTabsLabel")}
            className="flex shrink-0 gap-5 border-b border-line-subtle px-4 pt-3"
            onKeyDown={handleTabKeyDown}
          >
            {REPO_TABS.map((value) => (
              <Button
                key={value}
                id={tabId(value)}
                variant="tab"
                size="tab"
                role="tab"
                aria-selected={tab === value}
                aria-controls={panelId}
                tabIndex={tab === value ? 0 : -1}
                onClick={() => {
                  setTab(value);
                  if (value === "files") {
                    setCommitPreview(null);
                  } else if (value === "commits") {
                    setPreview(null);
                  } else {
                    closePreview();
                  }
                }}
              >
                {t(REPO_TAB_LABEL_KEY[value])}
              </Button>
            ))}
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId(tab)}
            tabIndex={0}
            className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3"
          >
            {tab === "branches" ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                {branches.length === 0 ? (
                  <p className="t-mono px-1 text-sm text-text-muted">
                    {t("home.repoBranchesEmpty")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1 px-1">
                    {branches.map((item) => {
                      const selectedBranch = item.name === activeRef;
                      return (
                        <li key={item.name}>
                          <Button
                            variant="ghost"
                            size="bare"
                            aria-pressed={selectedBranch}
                            className={cn(
                              "t-mono flex w-full items-baseline justify-between gap-2 rounded-md border px-3 py-2.5 text-left text-sm font-normal tracking-normal normal-case",
                              selectedBranch
                                ? "border-line bg-surface-2 text-accent"
                                : "border-transparent text-text hover:border-line-subtle hover:bg-surface-2/50",
                            )}
                            onClick={() => selectBranch(item.name)}
                          >
                            <span className="min-w-0 truncate uppercase">
                              {item.name}
                            </span>
                            <span className="shrink-0 text-dial text-text-muted sm:text-sm">
                              {item.isDefault
                                ? t("home.repoBranchDefault")
                                : item.protected
                                  ? t("home.repoBranchProtected")
                                  : ""}
                            </span>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}

            {tab === "files" ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                {tree.length === 0 ? (
                  <p className="t-mono px-1 text-sm text-text-muted">
                    {t("home.repoEmpty")}
                  </p>
                ) : (
                  <RepoFileTree
                    nodes={tree}
                    selectedPath={selectedPath}
                    onSelectFile={(path) => {
                      void openFile(path);
                    }}
                  />
                )}
              </div>
            ) : null}

            {tab === "commits" ? (
              commits.length === 0 ? (
                <RepoPanelEmptyCommits />
              ) : selected ? (
                <RepoCommitsList
                  commits={commits}
                  selectedId={selectedCommitId}
                  branch={activeRef || selected.defaultBranch}
                  githubCommitsUrl={`https://github.com/${encodeURIComponent(selected.owner)}/${encodeURIComponent(selected.name)}/commits/${encodeURIComponent(activeRef || selected.defaultBranch)}`}
                  onSelect={openCommit}
                />
              ) : null
            ) : null}

            {tab === "pr" ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                {pulls.length === 0 ? (
                  <p className="t-mono px-1 text-sm text-text-muted">
                    {t("home.repoPrEmpty")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2 px-1">
                    {pulls.map((pull) => (
                      <li
                        key={pull.id}
                        className="rounded-md border border-line-subtle px-3 py-2.5"
                      >
                        <p className="t-mono text-dial text-text-muted sm:text-sm">
                          #{pull.number}
                        </p>
                        <p className="t-mono text-sm text-text">{pull.title}</p>
                        <p className="t-mono text-dial text-text-muted sm:text-sm">
                          {pull.author} · {pull.relativeTime}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

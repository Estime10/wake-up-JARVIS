import {
  REPO_PANEL_SCENARIOS,
  type RepoPanelScenario,
} from "@/features/home/model/repoPanelScenario";
import { MOCK_REPOS } from "@/fixtures/repos";
import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/types";

const SCENARIO_LABEL_KEY = {
  nominal: "home.repoScenarioNominal",
  loading: "home.repoScenarioLoading",
  emptyCommits: "home.repoScenarioEmptyCommits",
  emptyRepos: "home.repoScenarioEmptyRepos",
  error: "home.repoScenarioError",
  offline: "home.repoScenarioOffline",
  disconnected: "home.repoScenarioDisconnected",
  denied: "home.repoScenarioDenied",
} as const satisfies Record<RepoPanelScenario, MessageKey>;

export const REPO_SELECT_OPTIONS = MOCK_REPOS.map((item) => ({
  value: item.id,
  label: item.name,
}));

export const REPO_SCENARIO_OPTIONS = REPO_PANEL_SCENARIOS.map((value) => ({
  value,
  label: t(SCENARIO_LABEL_KEY[value]),
}));

import { Select } from "@/components/ui/Select";
import { RepoBranchIcon } from "@/features/home/components/repo/icons";
import { useRepoSession } from "@/features/home/context";
import {
  REPO_SCENARIO_OPTIONS,
  REPO_SELECT_OPTIONS,
} from "@/features/home/model/repoPanelOptions";
import type { RepoPanelScenario } from "@/features/home/model/repoPanelScenario";
import { t } from "@/lib/i18n";

type RepoPanelToolbarProps = {
  idPrefix: string;
};

/** Selects scénario / repo + branche courante. */
export function RepoPanelToolbar({ idPrefix }: RepoPanelToolbarProps) {
  const session = useRepoSession();
  const showRepoSelect =
    session.scenario !== "emptyRepos" &&
    session.scenario !== "disconnected" &&
    session.scenario !== "denied";

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-line-subtle px-4 py-3">
      <Select
        id={`${idPrefix}-scenario`}
        aria-label={t("home.repoScenarioLabel")}
        value={session.scenario}
        options={REPO_SCENARIO_OPTIONS}
        onChange={(value) => session.setScenario(value as RepoPanelScenario)}
      />
      {showRepoSelect ? (
        <>
          <Select
            id={`${idPrefix}-repo`}
            aria-label={t("home.repoSelectLabel")}
            value={session.repoId}
            options={REPO_SELECT_OPTIONS}
            onChange={session.setRepoId}
          />
          {session.repo ? (
            <p className="t-mono flex items-center gap-1.5 text-dial text-text-muted sm:text-sm">
              <RepoBranchIcon className="size-3.5 shrink-0" />
              {t("home.repoBranch", { branch: session.repo.branch })}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

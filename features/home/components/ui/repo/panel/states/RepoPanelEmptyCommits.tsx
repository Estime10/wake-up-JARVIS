import { RepoCommitIcon } from "@/features/home/components/ui/repo/icons/RepoCommitIcon";
import { t } from "@/lib/i18n/t";

/** Liste commits vide — état 3. */
export function RepoPanelEmptyCommits() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <RepoCommitIcon className="size-8 text-text" />
      <p className="t-body text-sm text-text">{t("home.repoEmptyCommits")}</p>
    </div>
  );
}

import type { RepoCommitPreviewModel } from "@/features/home/components/repo/RepoCommitPreview";
import { RepoCommitPreview } from "@/features/home/components/repo/RepoCommitPreview";
import {
  REPO_MOTION_CLASS,
  REPO_SLIDE_IN,
  REPO_SLIDE_OUT,
} from "@/features/home/animations";
import { REPO_PREVIEW_INSET_CLASS } from "@/features/home/model/repoDrawerLayout";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type RepoPanelCommitDrawerProps = {
  visible: boolean;
  model: RepoCommitPreviewModel;
  onClose: () => void;
};

/**
 * Tiroir 2 — détail commit (pleine colonne gauche, comme l’aperçu fichier).
 */
export function RepoPanelCommitDrawer({
  visible,
  model,
  onClose,
}: RepoPanelCommitDrawerProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-y-0 overflow-hidden",
        REPO_PREVIEW_INSET_CLASS,
        REPO_LAYER_CLASS.preview,
      )}
      data-scroll-lock-allow="true"
    >
      <aside
        className={cn(
          "absolute inset-0 flex flex-col border-r border-line-subtle bg-bg isolate transition-transform",
          REPO_MOTION_CLASS,
          visible
            ? `pointer-events-auto ${REPO_SLIDE_IN}`
            : `pointer-events-none ${REPO_SLIDE_OUT}`,
        )}
        aria-label={t("home.repoCommitPreviewLabel", { sha: model.commit.sha })}
        aria-hidden={!visible || undefined}
        inert={!visible ? true : undefined}
      >
        <RepoCommitPreview model={model} onClose={onClose} />
      </aside>
    </div>
  );
}

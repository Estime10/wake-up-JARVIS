import type { RepoFilePreviewModel } from "@/features/home/components/repo/RepoFilePreview";
import { RepoFilePreview } from "@/features/home/components/repo/RepoFilePreview";
import {
  REPO_MOTION_CLASS,
  REPO_SLIDE_IN,
  REPO_SLIDE_OUT,
} from "@/features/home/animations";
import { REPO_PREVIEW_INSET_CLASS } from "@/features/home/model/repoDrawerLayout";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type RepoPanelPreviewDrawerProps = {
  visible: boolean;
  model: RepoFilePreviewModel;
  onClose: () => void;
  onRetry: () => void;
};

/**
 * Tiroir 2 — clip overflow pour ne pas peindre sur le tiroir fichiers
 * pendant le slide open/close.
 */
export function RepoPanelPreviewDrawer({
  visible,
  model,
  onClose,
  onRetry,
}: RepoPanelPreviewDrawerProps) {
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
        aria-label={t("home.repoPreviewLabel", { path: model.path })}
        aria-hidden={!visible || undefined}
        inert={!visible ? true : undefined}
      >
        <RepoFilePreview model={model} onClose={onClose} onRetry={onRetry} />
      </aside>
    </div>
  );
}

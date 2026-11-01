import {
  REPO_FADE_IN,
  REPO_FADE_OUT,
  REPO_MOTION_CLASS,
} from "@/features/home/animations";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";

type RepoPanelMaskProps = {
  visible: boolean;
};

/** Mask + blur sous les tiroirs REPO. */
export function RepoPanelMask({ visible }: RepoPanelMaskProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 transition-opacity",
        REPO_MOTION_CLASS,
        REPO_LAYER_CLASS.mask,
        visible ? REPO_FADE_IN : REPO_FADE_OUT,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-bg/85" />
      <div className="absolute inset-0 backdrop-blur-[var(--blur-glass)]" />
    </div>
  );
}

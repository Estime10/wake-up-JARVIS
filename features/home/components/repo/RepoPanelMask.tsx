import { HudOverlay } from "@/features/home/components/HudOverlay";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";

type RepoPanelMaskProps = {
  visible: boolean;
};

/** Overlay sous les tiroirs REPO — même surface que le terminal. */
export function RepoPanelMask({ visible }: RepoPanelMaskProps) {
  return <HudOverlay visible={visible} className={REPO_LAYER_CLASS.mask} />;
}

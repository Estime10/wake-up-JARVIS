import { HudOverlay } from "@/features/home/components/HudOverlay";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";

type RepoPanelMaskProps = {
  visible: boolean;
};

/**
 * Overlay sous les tiroirs REPO — même surface / fade que le terminal
 * (`visible` = `open` direct, pas le délai presence du tiroir).
 */
export function RepoPanelMask({ visible }: RepoPanelMaskProps) {
  return <HudOverlay visible={visible} className={REPO_LAYER_CLASS.mask} />;
}

import type { AssistantState } from "@/features/home/model/assistantMachine";
import {
  queryRingLayers,
  showRingMode,
  stopRingMotion,
} from "@/features/jarvis/model/voiceRing/voiceRingLayers";
import {
  enterListeningRing,
  enterSpeakingRing,
} from "@/features/jarvis/model/voiceRing/voiceRingLevel";
import {
  enterErrorRing,
  enterIdleRing,
  enterOfflineRing,
  enterThinkingRing,
  type EnterRingState,
} from "@/features/jarvis/model/voiceRing/voiceRingStates";

/** Une fonction par état — aucun état replié sur un autre. */
const ENTER_STATE: Record<AssistantState, EnterRingState> = {
  idle: enterIdleRing,
  listening: enterListeningRing,
  thinking: enterThinkingRing,
  speaking: enterSpeakingRing,
  error: enterErrorRing,
  offline: enterOfflineRing,
};

/**
 * Applique l’état assistant sur le SVG mark (transform/opacity only).
 * Retourne un cleanup (niveau mock + tweens).
 */
export function applyVoiceRingState(
  root: HTMLElement,
  state: AssistantState,
  opts: { reducedMotion: boolean },
): () => void {
  const layers = queryRingLayers(root);
  stopRingMotion(layers);
  showRingMode(layers, state, { instant: opts.reducedMotion });
  const stop = ENTER_STATE[state](layers, {
    reducedMotion: opts.reducedMotion,
  });
  return () => {
    stop();
    stopRingMotion(layers);
  };
}

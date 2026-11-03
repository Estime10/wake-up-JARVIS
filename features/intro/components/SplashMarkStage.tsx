import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { MARK_SLOT_SIZE } from "@/features/jarvis/model/markSlotSizes";

/**
 * Emplacement splash — mark seul.
 * JARVIS est révélé une seule fois sur /home (après Flip mark, avant TTS).
 */
export function SplashMarkStage() {
  return <MarkSlot name="splash" className={MARK_SLOT_SIZE.splash} />;
}

import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { MARK_SLOT_SIZE } from "@/features/jarvis/model/markSlotSizes";

/** Emplacement splash — le mark réel est `PersistentMark`. */
export function SplashMarkStage() {
  return <MarkSlot name="splash" className={MARK_SLOT_SIZE.splash} />;
}

import { MarkSlot } from "@/features/jarvis/components/MarkSlot";

/** Emplacement splash — le mark réel est `PersistentMark`. */
export function SplashMarkStage() {
  return (
    <MarkSlot
      name="splash"
      className="size-[min(72vw,22rem)] sm:size-[min(52vw,28rem)]"
    />
  );
}

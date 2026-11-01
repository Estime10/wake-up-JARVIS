import type { MarkSlotName } from "@/features/jarvis/model/markDom";
import { cn } from "@/lib/cn";

type MarkSlotProps = {
  /** Cible de placement pour le mark persistant. */
  name: MarkSlotName;
  className?: string;
};

/** Emplacement réservé — le mark réel reste un nœud fixed unique. */
export function MarkSlot({ name, className }: MarkSlotProps) {
  return (
    <div
      data-mark-slot={name}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

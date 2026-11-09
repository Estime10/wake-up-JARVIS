"use client";

import { useIntroClockParts } from "@/features/intro/hooks/useIntroClockParts";
import { cn } from "@/lib/cn";

type HomeClockProps = {
  visible?: boolean;
  className?: string;
};

/** Horloge colonne gauche — début de section (heure + date). */
export function HomeClock({ visible = true, className }: HomeClockProps) {
  const { time, date } = useIntroClockParts();

  return (
    <p
      className={cn(
        "t-mono flex min-w-0 flex-wrap items-baseline gap-x-2 truncate text-dial text-text uppercase sm:text-sm",
        !visible && "pointer-events-none opacity-0",
        className,
      )}
      suppressHydrationWarning
      aria-hidden={!visible || undefined}
    >
      <span>{time}</span>
      {date ? <span>{date}</span> : null}
    </p>
  );
}

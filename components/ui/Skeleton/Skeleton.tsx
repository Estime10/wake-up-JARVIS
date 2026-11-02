import { cn } from "@/lib/cn";

type SkeletonProps = {
  className?: string;
};

/**
 * Os de squelette HUD — pulse discret, jamais de libellé visible.
 * Accessibilité : le parent porte `aria-busy` + texte `sr-only`.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-surface-2 motion-safe:animate-pulse",
        className,
      )}
      aria-hidden
    />
  );
}

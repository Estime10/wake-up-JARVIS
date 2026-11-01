import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type SplashWordmarkProps = {
  settled?: boolean;
};

/** Wordmark — opacity/y via GSAP en intro ; visible si `settled`. */
export function SplashWordmark({ settled = false }: SplashWordmarkProps) {
  const label = t("intro.wordmark");

  return (
    <p
      data-intro="wordmark"
      className={cn(
        "t-wordmark text-center text-wordmark-display text-text will-change-transform",
        settled ? "opacity-100" : "opacity-0",
      )}
    >
      <span aria-hidden>{label}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </p>
  );
}

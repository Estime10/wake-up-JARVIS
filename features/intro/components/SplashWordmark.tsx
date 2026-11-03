import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { FLIP_ID } from "@/features/jarvis/model/markDom";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type SplashWordmarkProps = {
  /** Visible (sinon opacity-0 — GSAP révèle). */
  settled?: boolean;
  /** Taille : display (briefing/splash) → home (slot réduit). */
  size?: "display" | "home";
};

/** Wordmark JARVIS — Flip splash→home via `data-flip-id`. */
export function SplashWordmark({
  settled = false,
  size = "display",
}: SplashWordmarkProps) {
  const label = t("intro.wordmark");

  return (
    <p
      data-intro="wordmark"
      data-flip-id={FLIP_ID.wordmark}
      className={cn(
        "t-wordmark text-center text-text will-change-transform",
        size === "display" ? "text-wordmark-display" : "text-wordmark",
        settled ? "opacity-100" : "opacity-0",
      )}
    >
      <span aria-hidden>{label}</span>
      <VisuallyHidden>{label}</VisuallyHidden>
    </p>
  );
}

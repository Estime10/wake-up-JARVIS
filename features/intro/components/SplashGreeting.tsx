import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { FLIP_ID } from "@/features/jarvis/model/markDom";
import { cn } from "@/lib/cn";

type SplashGreetingProps = {
  text: string;
  settled?: boolean;
};

/**
 * Salut — opacity/y via GSAP en intro ; visible si `settled`.
 * Curseur terminal décoratif (maquette).
 */
export function SplashGreeting({ text, settled = false }: SplashGreetingProps) {
  return (
    <p
      data-intro="greeting"
      data-flip-id={FLIP_ID.greeting}
      className={cn(
        "t-body text-center text-lg text-text will-change-transform sm:text-xl",
        settled ? "opacity-100" : "opacity-0",
      )}
    >
      <span aria-hidden suppressHydrationWarning>
        {text}
        <span className="greeting-cursor ml-0.5 text-accent">|</span>
      </span>
      <VisuallyHidden>{text}</VisuallyHidden>
    </p>
  );
}

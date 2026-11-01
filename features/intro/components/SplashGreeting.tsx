import { VisuallyHidden } from "@/components/ui/VisuallyHidden";

type SplashGreetingProps = {
  text: string;
};

/** Salut — opacity/y via GSAP ; `text` déjà résolu (i18n côté domaine). */
export function SplashGreeting({ text }: SplashGreetingProps) {
  return (
    <p
      data-intro="greeting"
      className="t-body text-center text-lg text-text opacity-0 will-change-transform sm:text-xl"
    >
      <span aria-hidden>{text}</span>
      <VisuallyHidden>{text}</VisuallyHidden>
    </p>
  );
}

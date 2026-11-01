import { VisuallyHidden } from "@/components/ui/VisuallyHidden";

type SplashGreetingProps = {
  text: string;
};

/**
 * Salut — opacity/y via GSAP ; curseur terminal décoratif (maquette).
 * Texte complet accessible ; lettres + curseur en `aria-hidden`.
 */
export function SplashGreeting({ text }: SplashGreetingProps) {
  return (
    <p
      data-intro="greeting"
      className="t-body text-center text-lg text-text opacity-0 will-change-transform sm:text-xl"
    >
      <span aria-hidden>
        {text}
        <span className="greeting-cursor ml-0.5 text-accent">|</span>
      </span>
      <VisuallyHidden>{text}</VisuallyHidden>
    </p>
  );
}

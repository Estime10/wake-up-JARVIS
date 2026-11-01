import type { ReactNode, Ref } from "react";

type SplashBackdropProps = {
  children: ReactNode;
  onSkip: () => void;
  scopeRef: Ref<HTMLDivElement>;
};

/** Calque plein écran — scope GSAP + skip au clic. Tokens via `bg-bg`. */
export function SplashBackdrop({
  children,
  onSkip,
  scopeRef,
}: SplashBackdropProps) {
  return (
    <div
      ref={scopeRef}
      role="presentation"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg"
      onClick={onSkip}
    >
      {children}
    </div>
  );
}

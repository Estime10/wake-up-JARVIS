import type { ReactNode } from "react";

type VisuallyHiddenProps = {
  children: ReactNode;
};

/** Texte accessible aux lecteurs d'écran, invisible visuellement. */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>;
}

import type { ButtonHTMLAttributes, ReactNode } from "react";

import {
  BUTTON_SIZE_CLASS,
  BUTTON_VARIANT_CLASS,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/Button/buttonVariants";
import { cn } from "@/lib/cn";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

/**
 * Primitive bouton — tokens DA uniquement, label en `.t-label`.
 * Aucun texte en dur : le parent passe une clé i18n résolue.
 */
export function Button({
  variant = "bordered",
  size = "md",
  className,
  type = "button",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "t-label inline-flex items-center justify-center gap-2 rounded-md transition-[color,background-color,border-color,filter] duration-[var(--duration-fast)]",
        "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:pointer-events-none disabled:opacity-40",
        BUTTON_VARIANT_CLASS[variant],
        BUTTON_SIZE_CLASS[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

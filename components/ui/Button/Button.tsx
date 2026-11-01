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
        "t-label inline-flex cursor-pointer items-center justify-center gap-2 rounded-md transition-[color,background-color,border-color,filter] duration-[var(--duration-fast)]",
        // v4 : `outline-hidden`/`outline-none` posent `--tw-outline-style: none` ;
        // `focus-visible:outline` le relirait → style explicite `outline-solid`.
        "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        // Même rendu pour `aria-disabled` (reste focusable ; l'appelant garde le handler).
        "aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
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

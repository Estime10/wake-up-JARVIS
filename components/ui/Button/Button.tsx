import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

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
 * Primitive bouton — tokens DA uniquement.
 * Aucun texte en dur : le parent passe une clé i18n résolue.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "bordered",
      size = "md",
      className,
      type = "button",
      disabled,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 transition-[color,background-color,border-color,filter] duration-[var(--duration-fast)]",
          // v4 : `outline-hidden`/`outline-none` posent `--tw-outline-style: none` ;
          // `focus-visible:outline` le relirait → style explicite `outline-solid`.
          "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
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
  },
);

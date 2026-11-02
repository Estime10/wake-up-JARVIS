"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { HudFrameBrackets } from "@/components/ui/HudFrameBrackets";
import { cn } from "@/lib/cn";

export type HudModalProps = {
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "role">;

/**
 * Chrome modale HUD — glass + équerres partagées, sans border-radius.
 */
export const HudModal = forwardRef<HTMLDivElement, HudModalProps>(
  function HudModal({ children, className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative bg-surface/55 shadow-glass backdrop-blur-[var(--blur-glass)]",
          className,
        )}
        {...rest}
      >
        <HudFrameBrackets />
        {children}
      </div>
    );
  },
);

"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type HudModalSurface = "classic" | "plain";

export type HudModalProps = {
  children: ReactNode;
  /**
   * `plain` = transparent (déjà dans un liquid-glass parent).
   * `classic` = blur legacy.
   */
  surface?: HudModalSurface;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "role">;

/**
 * Chrome modale HUD — surface classic ou plain (nested glass).
 */
export const HudModal = forwardRef<HTMLDivElement, HudModalProps>(
  function HudModal(
    { children, className, surface = "classic", ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative",
          surface === "plain"
            ? "bg-transparent"
            : "bg-surface/55 shadow-glass backdrop-blur-[var(--blur-glass)]",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

"use client";

import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type AuthTextFieldProps = {
  id: string;
  label: string;
  error?: string | undefined;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

/** Champ email / mot de passe — tokens DA, focus visible. */
export function AuthTextField({
  id,
  label,
  error,
  ...inputProps
}: AuthTextFieldProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="t-label text-text-muted">{label}</span>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "t-body min-h-touch border border-line bg-surface-2 px-3 py-2 text-text",
          "placeholder:text-text-muted/70",
          "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid",
          error && "border-danger",
        )}
        {...inputProps}
      />
      {error ? (
        <span id={errorId} className="t-body text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

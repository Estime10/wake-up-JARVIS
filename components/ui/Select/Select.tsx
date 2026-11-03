"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectPlacement = "up" | "down";

export type SelectProps = {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
  className?: string;
  /** Ouverture de la listbox : bas (défaut) ou haut. */
  placement?: SelectPlacement;
};

/**
 * Select custom — listbox (pas de `<select>` natif).
 * Labels via le parent (i18n).
 */
export function Select({
  value,
  options,
  onChange,
  id: idProp,
  "aria-label": ariaLabel,
  className,
  placement = "down",
}: SelectProps) {
  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const triggerId = idProp ?? `${reactId}-trigger`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState(false);

  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selected?.value),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      listRef.current?.focus();
    });
    function onPointerDown(event: PointerEvent): void {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node)) {
        return;
      }
      if (!root.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function closeList(): void {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(next: string): void {
    onChange(next);
    closeList();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      closeList();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = options[(selectedIndex + 1) % options.length];
      if (next) {
        onChange(next.value);
      }
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev =
        options[(selectedIndex - 1 + options.length) % options.length];
      if (prev) {
        onChange(prev.value);
      }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeList();
    }
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <Button
        ref={triggerRef}
        id={triggerId}
        variant="bordered"
        size="md"
        className="t-mono w-full justify-between font-normal tracking-normal normal-case"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <span className="shrink-0 text-text-muted" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </Button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          data-scroll-lock-allow="true"
          className={cn(
            "absolute right-0 left-0 z-40 max-h-60 overflow-y-auto rounded-md border border-line bg-surface shadow-glass outline-none",
            placement === "up"
              ? "bottom-[calc(100%+0.35rem)]"
              : "top-[calc(100%+0.35rem)]",
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <Button
                  variant="ghost"
                  size="bare"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "t-mono w-full justify-start rounded-none px-3 py-2.5 text-sm font-normal tracking-normal normal-case",
                    isSelected
                      ? "bg-surface-2 text-accent"
                      : "text-text hover:bg-surface-2",
                  )}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

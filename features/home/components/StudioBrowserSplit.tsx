"use client";

import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { SideWebBrowser } from "@/features/home/components/SideWebBrowser";
import { SupabaseStudioBrowser } from "@/features/home/components/SupabaseStudioBrowser";
import {
  STUDIO_BROWSER_SHARE_DEFAULT,
  STUDIO_BROWSER_SHARE_MAX,
  STUDIO_BROWSER_SHARE_MIN,
  STUDIO_BROWSER_SHARE_STEP,
  clampStudioBrowserShare,
} from "@/features/home/model/clampStudioBrowserShare";
import { readSessionNumber } from "@/features/home/model/readSessionNumber";
import { t } from "@/lib/i18n";

const SPLIT_KEY = "elsa.studioBrowserSplit.v1";

type StudioBrowserSplitProps = {
  studioUrl: string;
};

function initialShare(): number {
  const saved = readSessionNumber(SPLIT_KEY);
  return saved === null
    ? STUDIO_BROWSER_SHARE_DEFAULT
    : clampStudioBrowserShare(saved);
}

/**
 * Split vertical Studio (haut) / navigateur libre (bas), redimensionnable.
 * Ratio dynamique → flex inline (même pattern que RepoFileTree depth).
 */
export function StudioBrowserSplit({ studioUrl }: StudioBrowserSplitProps) {
  const [studioShare, setStudioShare] = useState(initialShare);
  const shareRef = useRef(studioShare);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startY: number; startShare: number } | null>(null);

  function persistShare(value: number): void {
    try {
      window.sessionStorage.setItem(SPLIT_KEY, String(value));
    } catch {
      /* private mode */
    }
  }

  function applyShare(value: number, persist: boolean): void {
    const next = clampStudioBrowserShare(value);
    setStudioShare(next);
    shareRef.current = next;
    if (persist) {
      persistShare(next);
    }
  }

  function onSplitPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    event.preventDefault();
    dragRef.current = { startY: event.clientY, startShare: shareRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onSplitPointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragRef.current || !splitRef.current) {
      return;
    }
    const height = splitRef.current.getBoundingClientRect().height;
    if (height <= 0) {
      return;
    }
    const delta = (event.clientY - dragRef.current.startY) / height;
    applyShare(dragRef.current.startShare + delta, false);
  }

  function onSplitPointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragRef.current) {
      return;
    }
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    persistShare(shareRef.current);
  }

  function onSplitKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      applyShare(shareRef.current - STUDIO_BROWSER_SHARE_STEP, true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      applyShare(shareRef.current + STUDIO_BROWSER_SHARE_STEP, true);
    }
  }

  return (
    <div
      ref={splitRef}
      className="flex min-h-0 flex-1 flex-col"
      aria-label={t("home.sideBrowserSplitLabel")}
    >
      <div
        className="flex min-h-0 flex-col gap-1"
        style={{ flex: `${studioShare} 1 0%` }}
      >
        <p className="t-mono shrink-0 text-dial tracking-wide text-text-muted uppercase">
          {t("home.sideBrowserStudioLabel")}
        </p>
        <SupabaseStudioBrowser studioUrl={studioUrl} />
      </div>
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-valuemin={Math.round(STUDIO_BROWSER_SHARE_MIN * 100)}
        aria-valuemax={Math.round(STUDIO_BROWSER_SHARE_MAX * 100)}
        aria-valuenow={Math.round(studioShare * 100)}
        tabIndex={0}
        className="my-1 flex h-3 shrink-0 cursor-row-resize items-center justify-center"
        onPointerDown={onSplitPointerDown}
        onPointerMove={onSplitPointerMove}
        onPointerUp={onSplitPointerUp}
        onPointerCancel={onSplitPointerUp}
        onKeyDown={onSplitKeyDown}
      >
        <span className="h-px w-16 bg-line" aria-hidden />
      </div>
      <div
        className="flex min-h-0 flex-col gap-1"
        style={{ flex: `${1 - studioShare} 1 0%` }}
      >
        <p className="t-mono shrink-0 text-dial tracking-wide text-text-muted uppercase">
          {t("home.sideBrowserLabel")}
        </p>
        <SideWebBrowser className="min-h-0 flex-1" />
      </div>
    </div>
  );
}

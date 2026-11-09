"use client";

import { useEffect, useRef, useState } from "react";

import {
  boundsEqual,
  clearStudioWebviewPane,
  measureElementBounds,
  setStudioWebviewPane,
  type WebviewPaneBounds,
} from "@/features/home/tauri/webviewPane";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type TauriWebviewHostProps = {
  /** `null` → panneau masqué / fermé. */
  url: string | null;
  className?: string;
  /** Force un reload / re-navigate. */
  reloadToken?: number;
};

/**
 * Emplacement DOM Studio : en flux, remplit son parent.
 * Le WebView natif Tauri est un calque OS positionné sur ces bounds.
 * (Navigateur libre `elsa-browser` : plus tard — clear orphan côté split.)
 */
export function TauriWebviewHost({
  url,
  className,
  reloadToken = 0,
}: TauriWebviewHostProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const lastReloadRef = useRef(reloadToken);
  const lastBoundsRef = useRef<WebviewPaneBounds | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    return () => {
      void clearStudioWebviewPane().catch(() => {
        /* unmount */
      });
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    let cancelled = false;
    let raf = 0;
    let pollTimer = 0;
    const force = lastReloadRef.current !== reloadToken;
    lastReloadRef.current = reloadToken;
    lastBoundsRef.current = null;

    async function sync(nextForce: boolean): Promise<void> {
      if (cancelled || !hostRef.current) {
        return;
      }
      const bounds = measureElementBounds(hostRef.current);
      if (
        !nextForce &&
        lastBoundsRef.current &&
        boundsEqual(lastBoundsRef.current, bounds)
      ) {
        return;
      }
      lastBoundsRef.current = bounds;
      try {
        if (!url || bounds.width < 8 || bounds.height < 8) {
          await clearStudioWebviewPane();
          if (!cancelled) {
            setError(false);
          }
          return;
        }
        await setStudioWebviewPane(url, bounds, nextForce);
        if (!cancelled) {
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    function schedule(nextForce: boolean): void {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        void sync(nextForce);
      });
    }

    schedule(force);
    const settleTimers = [50, 200, 500, 1000].map((ms) =>
      window.setTimeout(() => schedule(false), ms),
    );

    const frame =
      host.closest<HTMLElement>("[data-tauri-webview-frame]") ?? host;
    const observer = new ResizeObserver(() => {
      schedule(false);
    });
    observer.observe(host);
    if (frame !== host) {
      observer.observe(frame);
    }

    function onResize(): void {
      schedule(false);
    }
    function onScroll(): void {
      schedule(false);
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    pollTimer = window.setInterval(() => schedule(false), 250);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearInterval(pollTimer);
      for (const id of settleTimers) {
        window.clearTimeout(id);
      }
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [url, reloadToken]);

  return (
    <div
      ref={hostRef}
      className={cn("min-h-0 w-full flex-1 bg-transparent", className)}
      aria-hidden
      data-tauri-webview-host="studio"
    >
      {error ? (
        <p
          className="t-mono flex h-full items-center justify-center bg-surface/90 px-4 text-center text-sm text-danger"
          role="alert"
        >
          {t("home.sideBrowserNativeError")}
        </p>
      ) : null}
    </div>
  );
}

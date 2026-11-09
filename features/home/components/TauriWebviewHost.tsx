"use client";

import { useEffect, useRef, useState } from "react";

import {
  boundsEqual,
  clearBrowserWebviewPane,
  clearStudioWebviewPane,
  measureElementBounds,
  setBrowserWebviewPane,
  setStudioWebviewPane,
  type WebviewPaneBounds,
} from "@/features/home/tauri/webviewPane";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type TauriWebviewHostProps = {
  kind: "studio" | "browser";
  /** `null` → panneau masqué / fermé. */
  url: string | null;
  className?: string;
  /** Force un reload / re-navigate. */
  reloadToken?: number;
};

/**
 * Emplacement DOM (comme un iframe) : en flux, remplit son parent.
 * Le WebView natif Tauri est un calque OS positionné sur ces bounds —
 * ce nœud reste vide/transparent. Le CSS du host ne peint pas la page
 * externe : seul `set_position` / `set_size` déplacent le child WKWebView.
 */
export function TauriWebviewHost({
  kind,
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
      const clear =
        kind === "studio" ? clearStudioWebviewPane : clearBrowserWebviewPane;
      void clear().catch(() => {
        /* unmount */
      });
    };
  }, [kind]);

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
          if (kind === "studio") {
            await clearStudioWebviewPane();
          } else {
            await clearBrowserWebviewPane();
          }
          if (!cancelled) {
            setError(false);
          }
          return;
        }
        if (kind === "studio") {
          await setStudioWebviewPane(url, bounds, nextForce);
        } else {
          await setBrowserWebviewPane(url, bounds, nextForce);
        }
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
    // Layout / anim settle — ResizeObserver ne voit pas un simple shift Y.
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

    // Flex / entrée panneau : le frame peut bouger en Y sans resize.
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
  }, [kind, url, reloadToken]);

  return (
    <div
      ref={hostRef}
      className={cn("min-h-0 w-full flex-1 bg-transparent", className)}
      aria-hidden
      data-tauri-webview-host={kind}
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

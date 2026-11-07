"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { normalizeSideBrowserUrl } from "@/features/home/model/normalizeSideBrowserUrl";
import { readSessionString } from "@/features/home/model/readSessionString";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

const STORAGE_KEY = "elsa.sideBrowser.url.v1";

type SideWebBrowserProps = {
  className?: string;
};

function initialUrl(): string | null {
  const saved = readSessionString(STORAGE_KEY);
  if (!saved) {
    return null;
  }
  return normalizeSideBrowserUrl(saved);
}

/**
 * Mini-navigateur colonne droite — barre d’URL + iframe (placeholder UI).
 * Sites anti-frame / CSP : best-effort jusqu’au WebView Tauri (ADR 0013).
 */
export function SideWebBrowser({ className }: SideWebBrowserProps) {
  const [src, setSrc] = useState<string | null>(initialUrl);
  const [draft, setDraft] = useState(() => src ?? "https://");
  const [frameKey, setFrameKey] = useState(0);

  function navigate(raw: string): void {
    const normalized = normalizeSideBrowserUrl(raw);
    if (!normalized) {
      return;
    }
    setDraft(normalized);
    setSrc(normalized);
    setFrameKey((value) => value + 1);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      /* private mode */
    }
  }

  function onSubmit(event: FormEvent): void {
    event.preventDefault();
    navigate(draft);
  }

  return (
    <div
      className={cn("flex min-h-0 flex-col gap-2", className)}
      aria-label={t("home.sideBrowserLabel")}
    >
      <form
        onSubmit={onSubmit}
        className="flex shrink-0 items-center gap-1 border border-line-subtle bg-surface/60 px-1 py-1"
      >
        <label htmlFor="side-browser-url" className="sr-only">
          {t("home.sideBrowserUrlLabel")}
        </label>
        <input
          id="side-browser-url"
          name="url"
          type="text"
          inputMode="url"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("home.sideBrowserUrlPlaceholder")}
          autoComplete="off"
          spellCheck={false}
          className="t-mono min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-text outline-hidden placeholder:text-text-muted"
        />
        <Button
          type="submit"
          variant="hud"
          size="bare"
          className="shrink-0 px-2"
          aria-label={t("home.sideBrowserGo")}
        >
          {t("home.sideBrowserGo")}
        </Button>
        {src ? (
          <Button
            type="button"
            variant="ghost"
            size="bare"
            className="shrink-0 px-2"
            aria-label={t("home.sideBrowserReload")}
            onClick={() => setFrameKey((value) => value + 1)}
          >
            {t("home.sideBrowserReload")}
          </Button>
        ) : null}
      </form>

      <div className="relative min-h-0 flex-1 overflow-hidden border border-line-subtle bg-transparent">
        {src ? (
          <iframe
            key={frameKey}
            title={t("home.sideBrowserFrameTitle")}
            src={src}
            className="h-full w-full border-0 bg-transparent"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <p className="t-mono flex h-full items-center justify-center px-4 text-center text-sm text-text-muted">
            {t("home.sideBrowserEmpty")}
          </p>
        )}
      </div>
      {src ? (
        <p className="t-mono shrink-0 text-dial text-text-muted">
          {t("home.sideBrowserBlocked")}
        </p>
      ) : null}
    </div>
  );
}

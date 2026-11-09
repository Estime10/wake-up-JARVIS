"use client";

import { TauriWebviewHost } from "@/features/home/components/TauriWebviewHost";
import { useIsTauriClient } from "@/features/home/hooks/useIsTauriClient";
import { t } from "@/lib/i18n";

type SupabaseStudioBrowserProps = {
  studioUrl: string;
};

/**
 * Surface Studio — iframe proxy :54332 (web) · WebView :54323 (shell Tauri).
 */
export function SupabaseStudioBrowser({
  studioUrl,
}: SupabaseStudioBrowserProps) {
  const native = useIsTauriClient();

  if (native) {
    return (
      <div
        data-tauri-webview-frame
        className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden border border-transparent"
      >
        <TauriWebviewHost url={studioUrl} className="min-h-0 h-full flex-1" />
      </div>
    );
  }

  return (
    <iframe
      title={t("home.supabaseStudioBrowserTitle")}
      src={studioUrl}
      className="h-full min-h-0 w-full flex-1 border-0 bg-transparent"
      allow="clipboard-read; clipboard-write"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

"use client";

import { useSyncExternalStore } from "react";

import { isTauri } from "@/lib/runtime/isTauri";

function subscribe(): () => void {
  return () => {};
}

/**
 * `isTauri()` côté client — `false` au SSR (évite mismatch Next vs WKWebView).
 */
export function useIsTauriClient(): boolean {
  return useSyncExternalStore(subscribe, isTauri, () => false);
}

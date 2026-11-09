import { invoke } from "@tauri-apps/api/core";

export type WebviewPaneBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WebviewPaneDebugInfo = {
  scale: number;
  winW: number;
  winH: number;
  mainW: number;
  mainH: number;
  insetY: number;
  requested: WebviewPaneBounds;
  childX: number | null;
  childY: number | null;
  childW: number | null;
  childH: number | null;
};

export async function setStudioWebviewPane(
  url: string,
  bounds: WebviewPaneBounds,
  force = false,
): Promise<void> {
  await invoke("webview_pane_set_studio", { url, bounds, force });
}

export async function clearStudioWebviewPane(): Promise<void> {
  await invoke("webview_pane_clear_studio");
}

export async function debugWebviewPane(
  bounds: WebviewPaneBounds,
  label?: string,
): Promise<WebviewPaneDebugInfo> {
  return invoke<WebviewPaneDebugInfo>("webview_pane_debug", { bounds, label });
}

/**
 * Mesure l’intérieur de `[data-tauri-webview-frame]` via clientLeft/Top/Width/Height
 * (content-box = zone iframe). Le frame **doit** garder un `border` (même
 * transparent) : sans border, clientLeft/Top changent et le WKWebView décale.
 *
 * Valeurs en CSS px (= points logiques Tauri pour le child WKWebView).
 */
export function measureElementBounds(element: HTMLElement): WebviewPaneBounds {
  const frame =
    element.closest<HTMLElement>("[data-tauri-webview-frame]") ?? element;
  const rect = frame.getBoundingClientRect();
  return {
    x: Math.round(rect.left + frame.clientLeft),
    y: Math.round(rect.top + frame.clientTop),
    width: Math.round(frame.clientWidth),
    height: Math.round(frame.clientHeight),
  };
}

export function boundsEqual(
  a: WebviewPaneBounds,
  b: WebviewPaneBounds,
): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

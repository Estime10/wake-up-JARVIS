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

/** Aligné sur `--radius-sm` du liquid-glass — inset pour rester dans le chrome. */
const LIQUID_GLASS_RADIUS_PX = 4;

/**
 * Mesure l’intérieur de `[data-tauri-webview-frame]`, borné au liquid-glass
 * `side-right` si présent. Le frame **doit** garder un `border` (même
 * transparent) : sans border, clientLeft/Top changent et le WKWebView décale.
 *
 * Valeurs en CSS px (= points logiques Tauri pour le child WKWebView).
 */
export function measureElementBounds(element: HTMLElement): WebviewPaneBounds {
  const frame =
    element.closest<HTMLElement>("[data-tauri-webview-frame]") ?? element;
  const glass =
    element.closest<HTMLElement>("[data-home='side-right']") ?? frame;

  const frameRect = frame.getBoundingClientRect();
  const glassRect = glass.getBoundingClientRect();

  // Content-box frame ∩ content-box glass, puis inset radius (coins liquid).
  const left = Math.max(
    frameRect.left + frame.clientLeft,
    glassRect.left + glass.clientLeft,
  );
  const top = Math.max(
    frameRect.top + frame.clientTop,
    glassRect.top + glass.clientTop,
  );
  const right = Math.min(
    frameRect.left + frame.clientLeft + frame.clientWidth,
    glassRect.left + glass.clientLeft + glass.clientWidth,
  );
  const bottom = Math.min(
    frameRect.top + frame.clientTop + frame.clientHeight,
    glassRect.top + glass.clientTop + glass.clientHeight,
  );

  const inset = LIQUID_GLASS_RADIUS_PX;
  const x = Math.round(left + inset);
  const y = Math.round(top + inset);
  const width = Math.round(Math.max(0, right - left - inset * 2));
  const height = Math.round(Math.max(0, bottom - top - inset * 2));

  return { x, y, width, height };
}

export function boundsEqual(
  a: WebviewPaneBounds,
  b: WebviewPaneBounds,
): boolean {
  return (
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  );
}

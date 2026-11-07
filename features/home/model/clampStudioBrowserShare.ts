/** Bornes du split Studio (haut) / navigateur libre (bas). */
export const STUDIO_BROWSER_SHARE_MIN = 0.28;
export const STUDIO_BROWSER_SHARE_MAX = 0.72;
export const STUDIO_BROWSER_SHARE_DEFAULT = 0.5;
export const STUDIO_BROWSER_SHARE_STEP = 0.04;

/**
 * Clamp le ratio vertical Studio / navigateur libre.
 */
export function clampStudioBrowserShare(value: number): number {
  if (!Number.isFinite(value)) {
    return STUDIO_BROWSER_SHARE_DEFAULT;
  }
  return Math.min(
    STUDIO_BROWSER_SHARE_MAX,
    Math.max(STUDIO_BROWSER_SHARE_MIN, value),
  );
}

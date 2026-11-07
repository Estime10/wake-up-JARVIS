import { describe, expect, it } from "vitest";

import {
  STUDIO_BROWSER_SHARE_DEFAULT,
  STUDIO_BROWSER_SHARE_MAX,
  STUDIO_BROWSER_SHARE_MIN,
  clampStudioBrowserShare,
} from "@/features/home/model/clampStudioBrowserShare";

describe("clampStudioBrowserShare", () => {
  it("laisse passer une valeur dans les bornes", () => {
    expect(clampStudioBrowserShare(0.5)).toBe(0.5);
  });

  it("borne min / max", () => {
    expect(clampStudioBrowserShare(0)).toBe(STUDIO_BROWSER_SHARE_MIN);
    expect(clampStudioBrowserShare(1)).toBe(STUDIO_BROWSER_SHARE_MAX);
  });

  it("replie les non-finis sur le défaut", () => {
    expect(clampStudioBrowserShare(Number.NaN)).toBe(
      STUDIO_BROWSER_SHARE_DEFAULT,
    );
  });
});

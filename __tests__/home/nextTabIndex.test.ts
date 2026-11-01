import { describe, expect, it } from "vitest";

import { nextTabIndex } from "@/features/home/model/tabKeyboard";

describe("nextTabIndex", () => {
  it("boucle ← →", () => {
    expect(nextTabIndex("ArrowRight", 0, 3)).toBe(1);
    expect(nextTabIndex("ArrowRight", 2, 3)).toBe(0);
    expect(nextTabIndex("ArrowLeft", 0, 3)).toBe(2);
  });

  it("Home / End", () => {
    expect(nextTabIndex("Home", 2, 3)).toBe(0);
    expect(nextTabIndex("End", 0, 3)).toBe(2);
  });

  it("ignore les autres touches", () => {
    expect(nextTabIndex("Enter", 1, 3)).toBeNull();
    expect(nextTabIndex("Tab", 1, 3)).toBeNull();
  });
});

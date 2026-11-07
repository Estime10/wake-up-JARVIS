import { describe, expect, it } from "vitest";

import { normalizeSideBrowserUrl } from "@/features/home/model/normalizeSideBrowserUrl";

describe("normalizeSideBrowserUrl", () => {
  it("accepte https et ajoute le schéma", () => {
    expect(normalizeSideBrowserUrl("https://example.com/a")).toBe(
      "https://example.com/a",
    );
    expect(normalizeSideBrowserUrl("example.com")).toBe("https://example.com/");
  });

  it("refuse les schémas non http(s)", () => {
    expect(normalizeSideBrowserUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeSideBrowserUrl("file:///etc/passwd")).toBeNull();
  });

  it("transforme une requête libre en recherche", () => {
    const url = normalizeSideBrowserUrl("supabase docs");
    expect(url).toContain("duckduckgo.com");
    expect(url).toContain("supabase");
  });
});

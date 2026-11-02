import { describe, expect, it } from "vitest";

import { buildRepoTree } from "@/lib/github/buildRepoTree";

describe("buildRepoTree", () => {
  it("imbrique fichiers et dossiers", () => {
    const tree = buildRepoTree([
      { path: "README.md", type: "blob", size: 120 },
      { path: "app", type: "tree" },
      { path: "app/page.tsx", type: "blob", size: 40 },
    ]);

    expect(tree).toEqual([
      {
        kind: "dir",
        name: "app",
        children: [
          {
            kind: "file",
            name: "page.tsx",
            sizeLabel: "40 o",
          },
        ],
      },
      {
        kind: "file",
        name: "README.md",
        sizeLabel: "120 o",
      },
    ]);
  });
});

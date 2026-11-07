import { describe, expect, it } from "vitest";

import { withUserHonorific } from "@/lib/user/userHonorific";

describe("withUserHonorific", () => {
  it("remplace DevinChat par patron ou bosse", () => {
    const text = withUserHonorific("Salut DevinChat. Je t'écoute, DevinChat.");
    expect(text).not.toContain("DevinChat");
    expect(
      text === "Salut patron. Je t'écoute, patron." ||
        text === "Salut bosse. Je t'écoute, bosse.",
    ).toBe(true);
  });

  it("laisse intact un texte sans DevinChat", () => {
    expect(withUserHonorific("J'ouvre le terminal.")).toBe(
      "J'ouvre le terminal.",
    );
  });
});

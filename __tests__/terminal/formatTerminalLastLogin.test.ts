import { describe, expect, it } from "vitest";

import { formatTerminalLastLogin } from "@/features/home/model/formatTerminalLastLogin";

describe("formatTerminalLastLogin", () => {
  it("formate style macOS Terminal", () => {
    const date = new Date(2026, 10, 1, 0, 26, 51);
    expect(formatTerminalLastLogin(date, "ttys000")).toBe(
      "Last login: Sun Nov  1 00:26:51 on ttys000",
    );
  });
});

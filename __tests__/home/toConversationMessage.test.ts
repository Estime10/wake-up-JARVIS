import { describe, expect, it } from "vitest";

import { toConversationMessage } from "@/features/home/model/toConversationMessage";

describe("toConversationMessage", () => {
  it("mappe createdAt ISO vers HH:MM local", () => {
    const msg = toConversationMessage({
      id: "1",
      role: "assistant",
      text: "hello",
      createdAt: "2026-11-02T08:05:00.000Z",
    });
    expect(msg.id).toBe("1");
    expect(msg.role).toBe("assistant");
    expect(msg.text).toBe("hello");
    expect(msg.time).toMatch(/^\d{2}:\d{2}$/);
  });
});

import { describe, expect, it } from "vitest";

import { selectMessagePage } from "@/lib/memory/selectMessagePage";
import type { Message } from "@/lib/schemas";

function msg(id: string, createdAt: string): Message {
  return {
    id,
    role: "user",
    text: id,
    createdAt,
  };
}

describe("selectMessagePage", () => {
  const all = [
    msg("a", "2026-01-01T10:00:00.000Z"),
    msg("b", "2026-01-01T11:00:00.000Z"),
    msg("c", "2026-01-01T12:00:00.000Z"),
    msg("d", "2026-01-01T13:00:00.000Z"),
    msg("e", "2026-01-01T14:00:00.000Z"),
  ];

  it("sans query renvoie tout le fil", () => {
    expect(selectMessagePage(all).map((m) => m.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("limit prend les N plus récents (ordre croissant)", () => {
    expect(selectMessagePage(all, { limit: 3 }).map((m) => m.id)).toEqual([
      "c",
      "d",
      "e",
    ]);
  });

  it("before + limit charge une page plus ancienne", () => {
    expect(
      selectMessagePage(all, {
        limit: 2,
        before: { createdAt: "2026-01-01T12:00:00.000Z", id: "c" },
      }).map((m) => m.id),
    ).toEqual(["a", "b"]);
  });

  it("before seul filtre sans tronquer", () => {
    expect(
      selectMessagePage(all, {
        before: { createdAt: "2026-01-01T13:00:00.000Z", id: "d" },
      }).map((m) => m.id),
    ).toEqual(["a", "b", "c"]);
  });
});

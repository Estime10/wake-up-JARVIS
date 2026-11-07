import { describe, expect, it } from "vitest";

import {
  collectMailAccountIds,
  collectMailLabels,
  filterByAccount,
  filterFrom,
  filterSearch,
  filterToday,
  filterUnread,
  pickMailAt,
} from "@/features/assistant/model/filterMailItems";
import type { MailSummary } from "@/lib/schemas";

function mail(
  partial: Partial<MailSummary> & Pick<MailSummary, "id" | "from" | "subject">,
): MailSummary {
  const now = new Date();
  return {
    accountId: "perso",
    unread: false,
    isSent: false,
    time: "12:00",
    receivedAt: now.toISOString(),
    excerpt: "",
    ...partial,
  };
}

describe("filterMailItems", () => {
  it("filtre non lus hors SENT", () => {
    const items = [
      mail({ id: "1", from: "a", subject: "x", unread: true }),
      mail({ id: "2", from: "b", subject: "y", unread: true, isSent: true }),
      mail({ id: "3", from: "c", subject: "z", unread: false }),
    ];
    expect(filterUnread(items).map((item) => item.id)).toEqual(["1"]);
  });

  it("filtre aujourd’hui et from/search/account", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const items = [
      mail({
        id: "1",
        from: "Alice <a@x.com>",
        subject: "Facture",
        accountId: "pro",
        category: "urgent",
        excerpt: "à payer",
        receivedAt: today.toISOString(),
      }),
      mail({
        id: "2",
        from: "Bob",
        subject: "Hello",
        accountId: "perso",
        receivedAt: yesterday.toISOString(),
      }),
    ];
    expect(filterToday(items).map((item) => item.id)).toEqual(["1"]);
    expect(filterFrom(items, "alice").map((item) => item.id)).toEqual(["1"]);
    expect(filterSearch(items, "facture").map((item) => item.id)).toEqual([
      "1",
    ]);
    expect(filterByAccount(items, "pro").map((item) => item.id)).toEqual(["1"]);
    expect(collectMailLabels(items)).toEqual(["urgent"]);
    expect(collectMailAccountIds(items)).toEqual(["perso", "pro"]);
    expect(pickMailAt(items, 1)?.id).toBe("1");
    expect(pickMailAt(items, 9)).toBeNull();
  });
});

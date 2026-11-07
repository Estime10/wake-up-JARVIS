import type { MailSummary } from "@/lib/schemas";

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameLocalDay(iso: string, day: Date): boolean {
  const received = new Date(iso);
  const start = startOfLocalDay(day);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return received >= start && received < end;
}

/** Mails non lus (hors SENT). */
export function filterUnread(items: readonly MailSummary[]): MailSummary[] {
  return items.filter((item) => item.unread && !item.isSent);
}

/** Mails reçus aujourd’hui (local). */
export function filterToday(items: readonly MailSummary[]): MailSummary[] {
  const today = new Date();
  return items.filter(
    (item) => !item.isSent && isSameLocalDay(item.receivedAt, today),
  );
}

/** Mails reçus hier (local). */
export function filterYesterday(items: readonly MailSummary[]): MailSummary[] {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return items.filter(
    (item) => !item.isSent && isSameLocalDay(item.receivedAt, yesterday),
  );
}

/** Labels présents sur les mails récents. */
export function collectMailLabels(items: readonly MailSummary[]): string[] {
  const labels = new Set<string>();
  for (const item of items) {
    const label = item.category?.trim();
    if (label) {
      labels.add(label);
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b, "fr"));
}

/** CompteIds distincts (boîtes). */
export function collectMailAccountIds(items: readonly MailSummary[]): string[] {
  return [...new Set(items.map((item) => item.accountId))].sort();
}

export function filterByAccount(
  items: readonly MailSummary[],
  accountQuery: string,
): MailSummary[] {
  const q = accountQuery.trim().toLowerCase();
  return items.filter(
    (item) =>
      !item.isSent &&
      (item.accountId.toLowerCase() === q ||
        item.accountId.toLowerCase().includes(q)),
  );
}

export function filterFrom(
  items: readonly MailSummary[],
  text: string,
): MailSummary[] {
  const q = text.trim().toLowerCase();
  return items.filter(
    (item) => !item.isSent && item.from.toLowerCase().includes(q),
  );
}

export function filterSearch(
  items: readonly MailSummary[],
  text: string,
): MailSummary[] {
  const q = text.trim().toLowerCase();
  return items.filter((item) => {
    if (item.isSent) {
      return false;
    }
    return (
      item.subject.toLowerCase().includes(q) ||
      item.from.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      (item.category?.toLowerCase().includes(q) ?? false)
    );
  });
}

/** 1-based index dans une liste déjà filtrée. */
export function pickMailAt(
  items: readonly MailSummary[],
  n: number,
): MailSummary | null {
  if (!Number.isFinite(n) || n < 1 || n > items.length) {
    return null;
  }
  return items[n - 1] ?? null;
}

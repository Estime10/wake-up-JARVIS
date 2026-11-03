/**
 * Compte les mails dont `receivedAt` tombe sur le jour local de `now`.
 */
export function countMailsToday(
  mails: ReadonlyArray<{ receivedAt: string }>,
  now: Date = new Date(),
): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const startMs = start.getTime();
  const endMs = end.getTime();

  let count = 0;
  for (const mail of mails) {
    const ms = Date.parse(mail.receivedAt);
    if (Number.isNaN(ms)) {
      continue;
    }
    if (ms >= startMs && ms < endMs) {
      count += 1;
    }
  }
  return count;
}

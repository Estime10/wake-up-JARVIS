/** Intervalle relève Gmail → DB (client, onglet visible). */
export const MAIL_POLL_INTERVAL_MS = 10 * 60_000;

const MAIL_POLL_AT_KEY = "jarvis_mail_poll_at";

export function isMailPollStale(
  now: number = Date.now(),
  staleMs: number = MAIL_POLL_INTERVAL_MS,
): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  const raw = sessionStorage.getItem(MAIL_POLL_AT_KEY);
  if (!raw) {
    return true;
  }
  const at = Number(raw);
  return !Number.isFinite(at) || now - at > staleMs;
}

export function markMailPolled(now: number = Date.now()): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(MAIL_POLL_AT_KEY, String(now));
}

/** POST /api/mail/poll — Gmail → DB (Realtime met à jour l’UI). */
export async function runMailPoll(): Promise<boolean> {
  const response = await fetch("/api/mail/poll", { method: "POST" });
  if (!response.ok) {
    return false;
  }
  markMailPolled();
  return true;
}

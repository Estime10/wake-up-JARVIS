/**
 * Message Gmail envoyé (libellé système SENT) — hors feed UI reçus.
 */
export function isGmailSentMessage(labelIds: readonly string[]): boolean {
  return labelIds.some((id) => id.toUpperCase() === "SENT");
}

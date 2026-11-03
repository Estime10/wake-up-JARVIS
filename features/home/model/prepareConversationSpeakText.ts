/**
 * Texte bulle → TTS : uniquement la première ligne (ex. résumé mails / repos).
 * Le détail reste à l’écran, pas lu à voix haute.
 */
export function prepareConversationSpeakText(text: string): string {
  const firstLine = text
    .split(/\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) {
    return "";
  }

  return firstLine
    .replace(/\s+/g, " ")
    .replace(/[:：]\s*$/u, "")
    .trim();
}

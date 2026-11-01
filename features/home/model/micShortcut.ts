/** Ctrl+Maj+Espace — bascule l'écoute (un seul écouteur : useAssistantSession). */
export function isMicShortcut(event: KeyboardEvent): boolean {
  return (
    event.code === "Space" &&
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey
  );
}

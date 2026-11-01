/**
 * Pattern ARIA Tabs (activation automatique) : ← → bouclent, Home/End
 * vont aux extrémités. Renvoie l'index cible, ou null si la touche est ignorée.
 */
export function nextTabIndex(
  key: string,
  index: number,
  count: number,
): number | null {
  switch (key) {
    case "ArrowRight":
      return (index + 1) % count;
    case "ArrowLeft":
      return (index - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

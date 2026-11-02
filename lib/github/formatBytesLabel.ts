/** Libellé taille FR (`1,3 Ko`) pour l’UI repo. */
export function formatBytesLabel(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Ko`;
  }
  const mb = kb / 1024;
  return `${mb.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

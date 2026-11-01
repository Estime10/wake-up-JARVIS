type ClassValue = string | false | null | undefined;

/** Concatène des classes Tailwind conditionnelles (sans dépendance). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

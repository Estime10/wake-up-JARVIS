/** Détecte une URL dashboard cloud Supabase (à ne jamais embedder en prod). */
export function isCloudStudioUrl(url: string): boolean {
  return /^https:\/\/supabase\.com\/dashboard\/project\//.test(url.trim());
}

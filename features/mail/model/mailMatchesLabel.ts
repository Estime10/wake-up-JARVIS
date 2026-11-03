import {
  mailLabelTopFolder,
  normalizeMailLabelKey,
} from "@/features/mail/model/mailLabelColors";

/**
 * Une catégorie matche le label demandé si :
 * - égalité / préfixe chemin (`DEV`, `DEV/GitHub`)
 * - dossier racine égal (`DEV/foo`)
 * - token dans la racine (`TECH & DEV` matche `DEV`)
 */
export function mailMatchesLabel(
  category: string | undefined,
  labelQuery: string,
): boolean {
  const query = normalizeMailLabelKey(labelQuery);
  if (!category?.trim() || query.length === 0) {
    return false;
  }

  const cat = normalizeMailLabelKey(category);
  if (cat === query || cat.startsWith(`${query}/`)) {
    return true;
  }

  const top = normalizeMailLabelKey(mailLabelTopFolder(category));
  if (top === query || top.startsWith(`${query}/`)) {
    return true;
  }

  const tokens = top.split(/[&/\s]+/).filter((token) => token.length > 0);
  return tokens.includes(query);
}

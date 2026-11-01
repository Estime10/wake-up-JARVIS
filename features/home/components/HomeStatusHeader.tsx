import { t } from "@/lib/i18n";

type HomeStatusHeaderProps = {
  listening: boolean;
};

/**
 * Header home — porte le SEUL `role="status"` (« Micro actif », PLAN 3.5).
 * Zone toujours montée (une région live doit exister avant son contenu).
 * Provisoire : lecteur d'écran seulement, en attendant l'AppHeader visible
 * (indicateur « Micro actif » texte + icône, maquette SKETCH).
 */
export function HomeStatusHeader({ listening }: HomeStatusHeaderProps) {
  return (
    <header className="sr-only">
      <p role="status">{listening ? t("home.micActive") : null}</p>
    </header>
  );
}

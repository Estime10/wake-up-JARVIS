import type { MetadataRoute } from "next";

import { icons } from "@/lib/assets";
import { t } from "@/lib/i18n";
import { theme } from "@/lib/theme/tokens";

/** Seul manifest de l'app (pas de public/manifest.json). Couleurs = tokens DA. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    lang: "fr",
    name: t("app.name"),
    short_name: t("app.shortName"),
    description: t("app.description"),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: theme.color.bg,
    theme_color: theme.color.bg,
    icons: [
      {
        src: icons.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icons.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icons.iconMaskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

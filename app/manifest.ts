import type { MetadataRoute } from "next";

import { icons } from "@/lib/assets";

/** Seul manifest de l'app (pas de public/manifest.json). Couleurs = fond DA v3-blanc. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    lang: "fr",
    name: "JARVIS",
    short_name: "JARVIS",
    description: "Assistant JARVIS",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B0B0C",
    theme_color: "#0B0B0C",
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

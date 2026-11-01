/**
 * Miroir des tokens CSS `@theme` / `:root`.
 * Uniquement pour les contextes hors Tailwind (manifest, Canvas, tests).
 * Source de vérité visuelle = `app/globals.css`.
 */
export const theme = {
  color: {
    bg: "#0B0B0C",
    surface: "#141416",
    surface2: "#1C1C1F",
    text: "#E8E8E6",
    textMuted: "#9A9A97",
    line: "#6A6A6E",
    accent: "#ECEAE4",
    attention: "#F5B84A",
    danger: "#FF6B6B",
    success: "#5EE3A1",
  },
} as const;

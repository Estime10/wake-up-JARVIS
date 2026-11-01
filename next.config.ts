import type { NextConfig } from "next";

// Cache Components désactivé pour la phase UI : pas de données serveur,
// et le rendu partiel est incompatible avec une CSP à nonce (voir ADR 0002).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

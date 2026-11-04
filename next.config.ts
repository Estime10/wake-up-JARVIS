import type { NextConfig } from "next";

// Cache Components désactivé pour la phase UI : pas de données serveur,
// et le rendu partiel est incompatible avec une CSP à nonce (voir ADR 0002).
// CSP elle-même : uniquement dans proxy.ts (pas ici).
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // microphone=() tant que la voix réelle n'est pas branchée (V0b).
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

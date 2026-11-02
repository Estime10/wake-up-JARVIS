import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { connection } from "next/server";

import { Providers } from "@/app/providers";
import { JarvisShell } from "@/features/jarvis/JarvisShell";
import { t } from "@/lib/i18n";

import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: t("app.name"),
  description: t("app.description"),
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Force le rendu à la requête pour que le nonce CSP (proxy.ts) soit appliqué.
  await connection();

  return (
    <html
      lang="fr"
      className={`${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <JarvisShell>{children}</JarvisShell>
        </Providers>
      </body>
    </html>
  );
}

"use client";

import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { Button } from "@/components/ui/Button";
import { SystemNoticeScreen } from "@/features/system";
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

type GlobalErrorPageProps = {
  error: unknown;
  retry: () => void;
};

/**
 * Crash root layout — remplace html/body.
 * Pas de Providers / JarvisShell ici.
 */
export default function GlobalErrorPage({ retry }: GlobalErrorPageProps) {
  return (
    <html
      lang="fr"
      className={`${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <SystemNoticeScreen
          title={t("system.errorTitle")}
          body={t("system.errorBody")}
          action={
            <Button type="button" variant="hud" size="bare" onClick={retry}>
              {t("system.errorRetry")}
            </Button>
          }
        />
      </body>
    </html>
  );
}

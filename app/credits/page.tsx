import type { Metadata } from "next";
import Link from "next/link";

import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Crédits — E.L.S.A.",
  description: "Licences Piper, eSpeak NG et voix fr_FR-siwis-medium.",
};

export default function CreditsPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-bg px-6 py-12 text-text">
      <p className="text-xs font-medium uppercase tracking-[var(--tracking-label)] text-text/60">
        E.L.S.A.
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[var(--tracking-title)] uppercase">
        Crédits &amp; licences
      </h1>
      <p className="mt-3 text-sm text-text/80">
        Projet personnel DevinChat, non commercial. Détail repo :{" "}
        <code className="text-xs">CREDITS.md</code> ·{" "}
        <code className="text-xs">NOTICE</code>.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[var(--tracking-label)]">
          Piper TTS
        </h2>
        <p className="text-sm text-text/85">
          <a
            className="underline underline-offset-2 hover:text-text"
            href="https://github.com/OHF-Voice/piper1-gpl"
            rel="noreferrer"
            target="_blank"
          >
            OHF-Voice / Piper
          </a>{" "}
          — GPL-3.0-or-later. Phonétisation via eSpeak NG (GPL). En shell :
          loopback <code className="text-xs">127.0.0.1:5911</code> uniquement.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[var(--tracking-label)]">
          Voix fr_FR-siwis-medium
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-text/85">
          <li>Dataset : siwis</li>
          <li>
            SHA-256 :{" "}
            <code className="break-all text-xs">
              641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99
            </code>
          </li>
          <li>Licence modèle typique : CC BY 4.0</li>
        </ul>
        <p className="text-sm text-text/70">
          Usage personnel OK. Avant vente ou distribution publique : revalider
          la chaîne SIWIS / lessac / Piper GPL.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[var(--tracking-label)]">
          Mentions
        </h2>
        <p className="text-sm text-text/70">
          JARVIS et Iron Man sont des marques Marvel (The Walt Disney Company).
          Aucun lien avec Marvel ni Disney.
        </p>
      </section>

      <p className="mt-12 text-sm">
        <Link
          className="underline underline-offset-2 hover:text-text"
          href={ROUTES.login}
        >
          Retour connexion
        </Link>
      </p>
    </main>
  );
}

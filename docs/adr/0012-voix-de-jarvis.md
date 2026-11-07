# 0012 — Voix d’E.L.S.A. : Piper siwis (FR local)

- **Statut** : Proposé
- **Date** : 2026-11-03
- **Révisé** : 2026-11-07 (rebrand produit E.L.S.A. ; fichier conservé `0012-voix-de-jarvis.md`)
- **Relecteurs** : ARCHITECT, HACKER, THE JUDGE, PIXEL

## Contexte

Le TTS navigateur (`speechSynthesis`, Thomas) est inégal. DevinChat a choisi **Piper `fr_FR-siwis-medium`** (locale, gratuite) pour le salut et les réponses d’**E.L.S.A.** Une proposition ENGINE (`proposals/voice-piper/`) n’était pas encore dans ce repo : implémentation web alignée sur le plan `docs/plans/PLAN-voix-piper-jarvis.md`.

## Décision

- **Synthèse** : Piper HTTP en loopback (`127.0.0.1`) ; proxy Next `POST /api/voice/piper` (session ADR 0008, same-origin, JSON `{text}`, max 4096 o, off en prod sauf flag).
- **Texte** : `normalizeFr` + `splitSentences` avant lecture ; phrases enchaînées avec prefetch.
- **Repli** : `speechSynthesis` seulement si Piper échoue **avant** le premier audio.
- **Stop** : `AbortSignal` coupe lecture + file.
- **Hors scope immédiat** : sidecar Tauri / canal live distant (étapes 4–5 du plan — décision séparée).

## Options envisagées

1. **Piper siwis local + proxy** — retenue.
2. **Voix cloud** — écarté (latence, coût, données).
3. **Rester sur speechSynthesis** — écarté (qualité FR).

## Conséquences

- **Gain** : FR stable, contrôle stop, pas de dépendance cloud.
- **Risque** : licence SIWIS (dérivée lessac « research ») — OK perso, à revérifier avant distribution ; Piper GPL.
- **Coût** : binaire Piper + modèle ~60 Mo sur le Mac ; proxy à sécuriser (HACKER).

# 0009 — Capabilities Tauri : allowlist d’invoke

- **Statut** : Proposé
- **Niveau** : 2 (IPC shell ↔ WebView, origines distantes)
- **Date** : 2026-11-09
- **Relecteurs** : HACKER, ARCHITECT, THE JUDGE

## Contexte

Le shell E.L.S.A. charge l’UI depuis `127.0.0.1:3000` (DX) ou `https://wake-up-jarvis.vercel.app` (V0). Sans cadre capabilities, un `invoke` Rust exposé à une origine non maîtrisée = RCE / fuite locale. Le numéro **0009** était réservé dans les plans.

## Décision

- **Une capability `default`** liée à la fenêtre `main` uniquement.
- **`remote.urls` allowlist** explicite : loopback `:3000` + origine prod Vercel — **aucune** origine `*` / CDN tiers.
- **Chaque commande Rust** = permission dédiée (`allow-…`) dans `src-tauri/permissions/*.toml` ; pas de `shell` / `fs` larges / HTTP générique côté front.
- **WebViews enfants** (Studio, futur browser) : **pas** d’IPC — pose via le WebView principal seulement.
- **Nouvelles commandes** (voix, agent) : ADR + permission + revue HACKER avant merge.

## Options envisagées

1. **Allowlist par commande + remote borné** — retenu (CA-T5).
2. **Capabilities ouvertes / remote `*`** — écarté : surface d’attaque inacceptable.
3. **IPC aussi sur les WV enfants** — écarté : double origine, risque XSS Studio.

## Conséquences

- **Gain** : modèle de menace lisible ; prod URL sans droits Rust « ouverts ».
- **Risque** : oubli d’ajouter une permission → invoke cassé (fail closed, OK).
- **Coût** : un fichier permission + entrée `capabilities/default.json` par commande.

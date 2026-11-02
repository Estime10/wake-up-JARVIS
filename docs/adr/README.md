# Décisions d'architecture (ADR)

Un **ADR** (Architecture Decision Record) note **une** décision importante : pourquoi on l'a prise, ce qu'on a écarté, et ce que ça coûte.
Règle : **une page maximum** par ADR. On ne réécrit pas un ADR accepté : on en crée un nouveau qui le **remplace**.

Statuts possibles : **Proposé** → **Accepté** (validé par DevinChat) → éventuellement **Remplacé par 00XX** ou **Abandonné**.

## Index

| N°                                            | Titre                                                                                                      | Statut  | Date       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------- | ---------- |
| [0001](./0001-ui-d-abord-ports-et-mocks.md)   | UI d'abord, avec ports et adapters mock                                                                    | Proposé | 2026-11-01 |
| [0002](./0002-stack-front.md)                 | Stack front : Next.js 16, TS strict, Tailwind v4, GSAP, Vitest + Playwright, ESLint, sans Cache Components | Proposé | 2026-11-01 |
| [0003](./0003-pwa-manifest-seul.md)           | PWA via `app/manifest.ts` seul, sans service worker pour l'instant                                         | Proposé | 2026-11-01 |
| [0004](./0004-animations.md)                  | Animations : SVG + CSS + GSAP, Canvas 2D pour la voix, Three.js reporté, reduced motion obligatoire        | Proposé | 2026-11-01 |
| [0005](./0005-cible-macos.md)                 | Cible macOS uniquement : Ctrl+Maj+Espace, signature Touch ID ou mot de passe du Mac                        | Proposé | 2026-11-01 |
| [0006](./0006-execution-terminal.md)          | _(cadre futur)_ Exécution terminal : agent Tauri v2, file Supabase, ordres signés, signature WebAuthn      | Proposé | 2026-11-01 |
| [0007](./0007-mot-de-reveil.md)               | _(cadre futur)_ Mot de réveil : openWakeWord local, réveil de l'écran seulement                            | Proposé | 2026-11-01 |
| [0008](./0008-auth-email-memoire-supabase.md) | Auth e-mail + MemoryPort Supabase (V0b partiel) ; pages système ; pas d’offline navigateur                 | Proposé | 2026-11-02 |
| [0010](./0010-tri-des-mails.md)               | Tri des mails : Gmail readonly, Vault, tri déterministe, résumé sur demande (étape 1 = connexion seule)    | Proposé | 2026-11-02 |
| [0011](./0011-github-repos-lecture.md)        | GitHub : lecture repos (privés + publics), fine-grained PAT dans Vault (étape 1 = connexion seule)         | Proposé | 2026-11-02 |

Les ADR **0002, 0003 et 0004** ont été **révisés le 2026-11-01 après relecture PIXEL** (CSP et `connection()`, règle `style`, icônes PWA, `quickTo` et Flip). Leur statut reste « Proposé ».

Qui relit : **DevinChat** valide (passe en « Accepté ») ; **THE JUDGE** relit tous les ADR ; **HACKER** relit obligatoirement 0006, 0007, 0008, **0010** et **0011** (niveau 3 jetons) ; **PIXEL** relit 0002 à 0004 et 0008 ; **SKETCH** relit 0004.

## Modèle (copier dans `00XX-titre-court.md`)

```markdown
# 00XX — Titre de la décision

- **Statut** : Proposé
- **Date** : AAAA-MM-JJ
- **Relecteurs** : …

## Contexte

Quel problème ? Quelles contraintes ? (3–5 lignes)

## Décision

Ce qu'on fait, en une ou deux phrases claires.

## Options envisagées

1. **Option retenue** — pourquoi.
2. **Option B** — pourquoi non.
3. **Option C** — pourquoi non.

## Conséquences

- **Gain** : …
- **Risque** : …
- **Coût** : …
```

Liens : [PLAN-UI.md](../../PLAN-UI.md) · [README du projet](../../README.md)

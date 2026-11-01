# 0001 — UI d'abord, avec ports et adapters mock

- **Statut** : Proposé
- **Date** : 2026-11-01
- **Relecteurs** : THE JUDGE, PIXEL

## Contexte

JARVIS aura plus tard un LLM, une voix réelle, Supabase, Gmail et un agent terminal sur le Mac. Tout faire d'un coup est risqué : beaucoup d'inconnues, de la sécurité sensible, et rien de visible avant longtemps. On veut d'abord une interface solide, accessible, et testable.

## Décision

On construit **toute l'UI d'abord**, avec des **données et comportements simulés**. L'UI ne parle qu'à des **interfaces (ports)** : `LlmPort`, `VoicePort`, `ActionPort`, `MemoryPort`, `MailPort`. Des **adapters mock** (`adapters/mock`) les implémentent. Un seul fichier (`app/providers.tsx`) choisit les adapters. ESLint interdit d'importer `@/adapters/*` ailleurs.

## Options envisagées

1. **UI d'abord + ports + mocks** — retenue : on avance vite, on teste tout, et on branchera le vrai sans toucher l'UI.
2. **Brancher directement Supabase et un LLM** — non : clés, coûts et bugs réseau dès le premier jour ; l'UI dépendrait des détails des services.
3. **Commencer par l'agent terminal** — non : la partie la plus dangereuse, sans interface pour confirmer les actions.

## Conséquences

- **Gain** : UI testable sans réseau ni secret ; démos possibles tout de suite ; `/dev/states` montre chaque état ; le branchement réel (V0b) ne change que `providers.tsx` et ajoute des adapters.
- **Risque** : des ports mal pensés obligeront à les modifier quand on branchera le vrai (ex. streaming, erreurs, annulation). Parade : ports simples, `AbortSignal` partout, sorties validées par Zod.
- **Coût** : un peu de code en plus (interfaces + mocks + fixtures) ; les mocks doivent rester réalistes (latence, erreurs, déclencheurs `#action`, `#erreur`…).

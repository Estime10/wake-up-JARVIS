# 0002 — Stack front

- **Statut** : Proposé
- **Date** : 2026-11-01
- **Révisé le 2026-11-01 après relecture PIXEL**
- **Relecteurs** : PIXEL, THE JUDGE

## Contexte

La constitution d'équipe demande : simplicité d'abord, Next.js App Router, Server Components par défaut, TypeScript strict sans `any`, Tailwind v4, GSAP avec reduced motion, Vitest + Playwright, Vercel. Il faut aussi trancher le linter et les options par défaut de `create-next-app` (vérifiées le 01/11/2026 : Next 16.4.3).

## Décision

- **Next.js 16, App Router, Turbopack**, code à la racine (sans `src/`), alias `"@/*": ["./*"]`, `proxy.ts` à côté de `app/`. Node ≥ 24.15 ou ≥ 26.
- **TypeScript 5 strict** + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc. ; `no-explicit-any` en erreur. TS 7 plus tard, dans une étape à part.
- **Tailwind CSS v4** via `@tailwindcss/turbopack` (tokens dans `@theme`), polices **IBM Plex Sans / Mono** via `next/font/google`.
- **GSAP + @gsap/react**, **Zod** aux frontières.
- **Vitest** + Testing Library (alias via `resolve: { tsconfigPaths: true }`, sans `vite-tsconfig-paths` ; `*.test.ts(x)`), **Playwright** + **@axe-core/playwright** (`*.spec.ts` dans `e2e/`).
- **ESLint** (`eslint-config-next`) plutôt que Biome, **Prettier** + `eslint-config-prettier`, **Husky** + lint-staged.
- **Sans Cache Components** (`--no-cache-components`), sans React Compiler.
- **CSP à nonce** : `RootLayout` est `async` et appelle `await connection()` (de `next/server`). Sans ça, `/` reste statique, sans nonce, et les scripts sont bloqués en production (testé par PIXEL).
- **Règle `style`** : aucun `style={…}` dans le HTML rendu au serveur (la CSP `style-src 'nonce-…'` le bloque) ; classes Tailwind, ou GSAP après le montage.
- **`"use client"` seulement aux points d'entrée** ; un seul composant client (`MainScreen`) porte l'état de l'assistant, `app/page.tsx` reste serveur.

## Options envisagées

1. **ESLint** — retenu : `no-restricted-imports` impose la règle des ports, `react/no-danger` interdit `dangerouslySetInnerHTML`, règles Next et a11y incluses.
2. **Biome** — non pour l'instant : plus rapide, mais ces garde-fous sont moins directs. Peut être revu.
3. **Cache Components activé (défaut Next 16)** — non : pas de données serveur à mettre en cache dans la phase UI, et la doc Next indique que le rendu partiel (PPR) est **incompatible avec une CSP à nonce**, qu'on veut stricte.

## Conséquences

- **Gain** : stack standard, bien documentée ; garde-fous automatiques (lint, typecheck, tests) ; CSP stricte possible.
- **Risque** : CSP à nonce = toutes les pages en rendu dynamique (plus de CDN statique) ; oublier `await connection()` casse la prod sans erreur au build ; un `style={}` oublié est bloqué en prod ; options TS strictes parfois verbeuses. Parade : spec Playwright qui écoute la console (0 erreur CSP) dès l'étape 4.
- **Coût** : rendu dynamique négligeable pour une app perso ; réévaluer Cache Components en V0b si besoin de cache serveur.

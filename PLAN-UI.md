# PLAN-UI — wake-up-JARVIS (phase UI seule)

> Projet perso de **DevinChat**. Document de travail pour la **phase UI**.
> Vérifié en ligne le **01/11/2026** (docs officielles Next.js, GSAP, Playwright, Serwist, Tailwind, registre npm).
> Direction artistique et tokens **validés par SKETCH le 01/11/2026** (seuls le grain et les scanlines restent à régler à l'œil à l'étape 2).
> **DA v3 « blanc nacré » validée par DevinChat le 01/11/2026** : fond `#0B0B0C`, accent `#ECEAE4`, ambre `#F5B84A` réservé à la signature Touch ID (voir 3.1, 3.3, 3.6, 3.7). Les anciennes DA (v1 et v2, accent cyan) sont **remplacées**.
> **Relecture front de PIXEL intégrée le 01/11/2026** (PIXEL a testé ses remarques dans un projet de travail : CSP, chemins, Vitest, GSAP, PWA).
> Les règles de sécurité des actions et la CSP restent **à valider par HACKER**.
> Décisions d'architecture : **[docs/adr/](./docs/adr/README.md)**.
> Cible : **macOS uniquement** (voir [ADR 0005](./docs/adr/0005-cible-macos.md)).
> Ce plan ne contient aucun secret et aucune valeur `.env`.
> **Avancement : l'étape 1 (init) est faite** sur le Mac de DevinChat. Prochaine étape : 2.

Versions constatées sur npm le 01/11/2026 (pour info, `@latest` installera les versions du jour) :
`next` 16.4.3 · `create-next-app` 16.4.3 · `tailwindcss` 4.3.3 · `gsap` 3.15.0 · `@gsap/react` 2.1.2 · `zod` 4.6.7 · `vitest` 5.0.5 · `@playwright/test` 1.64.1 · `@axe-core/playwright` 4.14.0 · `pnpm` 12.16.1 · Node LTS : 24.x (« Krypton ») et 26.x (« Lithium »).

Node demandé : **≥ 24.15 ou ≥ 26** (jsdom 30, utilisé par Vitest). Le Mac de DevinChat a **Node 25.5.0** : il doit passer par **`brew upgrade node` avant que Vitest tourne** (étape 5). Voir 1.2 et section 7.

---

## Sommaire

0. [Objectif et hors scope](#0-objectif-de-la-phase-ui-et-hors-scope)
1. [Stack, initialisation, arborescence](#1-stack-initialisation-et-arborescence)
2. [Écrans, composants, machine d'états](#2-écrans-et-composants)
3. [Tokens, direction artistique, accessibilité](#3-tokens-direction-artistique-et-accessibilité)
4. [Étapes (un commit chacune)](#4-découpage-en-étapes-un-commit-par-étape)
5. [Après l'UI](#5-après-lui--feuille-de-route)
6. [Annexe sécurité](#6-annexe--sécurité-déjà-dans-lui)
7. [Points non vérifiés et choix faits](#7-points-non-vérifiés-et-choix-faits)
8. [Décisions (ADR)](./docs/adr/README.md)

---

## 0) Objectif de la phase UI et hors scope

**Objectif** : construire toute l'interface de JARVIS — intro, écran principal, anneau de voix et ses états, conversation, saisie avec voix _simulée_, carte de confirmation d'action, journal, panneau mails — avec des **données et des comportements simulés** (mocks).
Tout passe par des **interfaces (ports)**. Plus tard, on remplace les mocks par les vrais services **sans toucher l'UI**.

**À la fin de la phase UI, on doit pouvoir :**

- voir l'intro complète au premier lancement, l'intro courte ensuite, ou aucune intro (réglage) ;
- écrire un message, recevoir une réponse simulée écrite (et « parlée » simulée) ;
- simuler la voix (raccourci réglable, Ctrl+Maj+Espace par défaut, ou clic sur le micro) avec une transcription qui s'affiche et reste corrigeable ;
- voir une carte de confirmation pour chaque niveau de risque, et tous ses états ;
- parcourir le journal et les mails factices ;
- voir les états erreur et hors ligne ;
- installer l'app (PWA) ;
- tout tester au clavier, avec un lecteur d'écran, et en « reduced motion » ;
- voir tous les états d'un coup sur `/dev/states`.

**Hors scope (rien de tout ça dans cette phase) :**

- pas de terminal, pas d'agent macOS, aucune commande réellement exécutée ;
- pas de Supabase (ni base, ni auth, ni mémoire) ;
- pas de LLM réel ;
- pas de voix réelle (ni micro, ni reconnaissance, ni synthèse vocale, ni Web Audio) ;
- pas de Gmail (les mails sont factices) ;
- pas de Three.js / mode cinéma ;
- pas de notifications push, pas de cache hors ligne par service worker ;
- pas de vrai mot de réveil (l'indicateur « Réveil actif » existe dans l'UI, la détection est simulée).

---

## 1) Stack, initialisation et arborescence

### 1.1 Stack retenue (et pourquoi)

| Besoin          | Choix                                                                                                                                                              | Pourquoi                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Framework       | **Next.js 16 (App Router)**, Turbopack (par défaut)                                                                                                                | Demandé par la constitution, Server Components par défaut            |
| Langage         | **TypeScript strict**, zéro `any`                                                                                                                                  | Constitution                                                         |
| Style           | **Tailwind CSS v4** via `@tailwindcss/turbopack` (règle Turbopack dans `next.config.ts`, générée par `create-next-app` 16.4.3), `@import "tailwindcss"` + `@theme` | Constitution, tokens en variables CSS                                |
| Lint et format  | **ESLint** (`eslint-config-next`) + **Prettier** (`eslint-config-prettier`) ; **Husky** + **lint-staged** au commit                                                | Voir choix ci-dessous                                                |
| Animation       | **GSAP** + **@gsap/react** (`useGSAP`, `gsap.matchMedia`)                                                                                                          | GSAP et tous ses plugins sont gratuits sur npm depuis la 3.13        |
| Validation      | **Zod** (v4) aux frontières                                                                                                                                        | Constitution                                                         |
| Tests unitaires | **Vitest** + Testing Library (guide officiel Next.js)                                                                                                              | Constitution                                                         |
| Tests E2E       | **Playwright** + **@axe-core/playwright**                                                                                                                          | Constitution + accessibilité automatisée                             |
| Polices         | **IBM Plex Sans** + **IBM Plex Mono** via `next/font/google`                                                                                                       | Auto-hébergées au build : aucune requête vers Google côté navigateur |
| PWA             | **`app/manifest.ts` natif Next.js, sans service worker** dans cette phase                                                                                          | Voir choix ci-dessous                                                |
| Hébergement     | **Vercel** (preview optionnelle, avec le oui de DevinChat)                                                                                                         | Constitution                                                         |

**Choix ESLint plutôt que Biome.** `create-next-app` propose les deux. On garde ESLint parce que :

1. `eslint-config-next` apporte les règles Next.js + React Hooks + `jsx-a11y` de base ;
2. on a besoin de `no-restricted-imports` avec des motifs pour **imposer la règle « l'UI ne connaît que les ports »** (interdire les adapters hors de la racine de composition) ;
3. on a besoin de `react/no-danger` (interdire `dangerouslySetInnerHTML`).
   Biome est plus rapide mais ces garde-fous sont moins directs. Rien n'empêche de revoir ce choix plus tard. Prettier s'occupe du format ; `eslint-config-prettier` coupe les règles ESLint qui le contrediraient.

**Choix PWA : manifeste natif, pas de Serwist pour l'instant.**

- Le guide officiel Next.js montre `app/manifest.ts` et précise qu'on peut déclencher l'installation **sans support hors ligne**.
- `@serwist/next` est documenté d'abord pour **webpack** ; pour Turbopack (défaut de Next 16), Serwist a un guide séparé (`@serwist/turbopack`). C'est une dépendance + une config + un fichier `sw.ts` de plus, pour un cache hors ligne dont la phase UI n'a pas besoin.
- L'état « hors ligne » de l'UI se fait avec les événements `online` / `offline` du navigateur (pas besoin de service worker).
- On réévaluera Serwist (`@serwist/turbopack`) en V0b si on veut une vraie page hors ligne en cache.
- On **n'utilise pas** le hook expérimental `useOffline` de Next (expérimental = peut changer).

### 1.2 Prérequis sur le Mac (zsh, Homebrew)

```zsh
brew upgrade node  # obligatoire sur le Mac de DevinChat (Node 25.5.0) avant que Vitest tourne (étape 5)
node -v          # doit afficher v24.15 ou plus (24.x LTS), ou v26 ou plus
corepack enable  # si pnpm n'est pas déjà installé ; sinon : brew install pnpm
pnpm -v
```

> **Node — décision.** Le Mac de DevinChat a **Node v25.5.0** (version impaire, pas LTS). PIXEL demande **Node ≥ 24.15 ou ≥ 26** pour **jsdom 30** (Vitest, étape 5). Décision : lancer **`brew upgrade node`** sur le Mac **avant que Vitest tourne**, puis vérifier avec `node -v`. Playwright (étape 4) annonce Node 22.x, 24.x ou 26.x : la 25.x n'est pas vérifiée pour lui.
>
> Playwright demande aussi macOS 14 (Sonoma) ou plus récent.

### 1.3 Initialisation — faite (étape 1)

Ce qui a réellement été fait sur le Mac de DevinChat :

1. Le dossier du dépôt s'appelle `wake-up-JARVIS` et contenait déjà son `.git`. npm refuse les majuscules dans un nom de paquet : `create-next-app` a donc été lancé dans un **dossier temporaire**, avec le nom en minuscules `wake-up-jarvis`.
2. Le contenu généré a ensuite été **déplacé dans `wake-up-JARVIS/` en gardant son `.git`** (le projet généré n'avait pas de `.git` à lui, grâce à `--disable-git`).
3. Pas de `--turbopack` : ce flag n'existe pas en 16.4.3 (Turbopack est déjà le défaut). Pas de dossier `src/` : le code part de la racine, alias `"@/*": ["./*"]`.
4. Ajouts faits dans la même étape : TS durci (1.4), Prettier + `eslint-config-prettier`, Husky + lint-staged, scripts (1.6), Cache Components désactivé dans `next.config.ts`, page par défaut nettoyée, `lang="fr"`.
5. **Un seul commit** à la fin de l'étape 1 (fait par DevinChat).

Commande de création (trace, pour pouvoir refaire à l'identique) :

```zsh
cd "$(mktemp -d)"   # dossier temporaire

pnpm create next-app@latest wake-up-jarvis \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-react-compiler \
  --no-cache-components \
  --agents-md \
  --no-agent-feedback \
  --use-pnpm \
  --disable-git

# puis déplacer le contenu de wake-up-jarvis/ dans le dossier wake-up-JARVIS/ du dépôt, sans toucher à son .git
```

Pourquoi ces flags :

- `--ts --tailwind --eslint --app` : ce sont déjà les défauts, on les écrit pour que la commande soit explicite et reproductible.
- `--no-src-dir` : le code part de la racine (`app/`, `features/`…), sans dossier `src/`.
- `--no-react-compiler` : simplicité, pas de besoin prouvé.
- `--no-cache-components` : _Cache Components_ est le défaut pour l'App Router en Next 16. On le coupe pour cette phase : pas de données serveur à mettre en cache, et la doc Next indique que le rendu partiel (PPR) est **incompatible avec une CSP à nonce** (voir annexe sécurité). À réévaluer en V0b.
- `--agents-md` : ajoute un `AGENTS.md` utile si DevinChat utilise un agent dans son IDE (inoffensif).
- `--no-agent-feedback` : ne prépare aucun retour anonymisé vers Next.js.
- `--use-pnpm` : pnpm comme gestionnaire de paquets.
- `--disable-git` : le dépôt existait déjà avec son `.git`.

> pnpm 10+ bloque les scripts d'installation des dépendances par défaut. `create-next-app` écrit lui-même la config pour `sharp` et `unrs-resolver` (dans `pnpm-workspace.yaml` pour pnpm ≥ 11). Si pnpm affiche un avertissement « ignored build scripts », lancer `pnpm approve-builds` et n'accepter que ce qui est connu.

**Dépendances ajoutées ensuite (aux étapes concernées, pas toutes d'un coup) :**

```zsh
# Étape 4 — CSP : Playwright, pour la spec qui écoute la console
pnpm create playwright     # répondre : TypeScript, dossier "e2e", GitHub Actions = non (pour l'instant), installer les navigateurs = oui

# Étape 5 — tests unitaires
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @types/node@^24

# Étape 7 — validation aux frontières
pnpm add zod

# Étape 9 — animations
pnpm add gsap @gsap/react

# Étape 22 — accessibilité automatisée
pnpm add -D @axe-core/playwright
```

- `pnpm create playwright` crée `playwright.config.ts` et un dossier de tests (`tests/` par défaut, ou `e2e/` si `tests/` existe ; on choisit `e2e`).
- `@types/node@^24` : Vitest 5 demande `@types/node` `^22 || >=24` ; le template installe `^20`.
- Plus de `vite-tsconfig-paths` : Vite lit les alias du `tsconfig.json` avec `resolve: { tsconfigPaths: true }` (voir 1.7).

### 1.4 TypeScript strict (fait à l'étape 1)

`create-next-app` installe TypeScript `^5` avec `"strict": true`. `tsconfig.json` a été durci (le reste du fichier généré est gardé) :

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true, // tab[i] est T | undefined
    "exactOptionalPropertyTypes": true, // { a?: string } n'accepte pas a: undefined
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowJs": false, // tout en TS
    // ... garder target, lib, module, moduleResolution "bundler", jsx, plugins next, paths
    "paths": { "@/*": ["./*"] },
  },
}
```

Optionnel (plus strict, plus verbeux, à décider par DevinChat) : `noPropertyAccessFromIndexSignature`.

**Zéro `any`** : `eslint-config-next/typescript` inclut les règles recommandées de typescript-eslint (dont `@typescript-eslint/no-explicit-any`). On la passe en `error` explicitement (voir 1.5).

> **TypeScript 7** (version native, `latest` sur npm aujourd'hui : 7.0.2) est supporté par Next 16 via `pnpm add -D typescript@^7` (la doc Next l'indique). On **reste sur TS 5 installé par le template** pour la phase UI (simplicité, compatibilité des outils) ; passage à TS 7 = une étape séparée plus tard si besoin.

### 1.5 ESLint : règles en plus

- `@typescript-eslint/no-explicit-any` et `react/no-danger` en `error` : dès le début (déjà en place depuis l'étape 1, avec `no-console`).
- `no-restricted-imports` (règle des ports) : **à l'étape 7 seulement**, quand `adapters/` existe.
- `eslint-config-prettier` reste **en dernier** dans la config.

Bloc à ajouter dans `eslint.config.mjs` :

```js
{
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "react/no-danger": "error",
    // étape 7 :
    "no-restricted-imports": ["error", {
      patterns: [{
        group: ["@/adapters", "@/adapters/**", "**/adapters/**"],
        message: "L'UI ne connaît que les ports (@/ports). Les adapters ne s'importent que dans app/providers.tsx."
      }]
    }]
  }
},
{
  files: ["app/providers.tsx", "adapters/**", "**/*.test.ts", "**/*.test.tsx"],
  rules: { "no-restricted-imports": "off" }
}
```

### 1.6 Scripts `package.json`

**Déjà présents (étape 1)** : `dev`, `build`, `start`, `lint`, `typecheck`, `format`, `format:check`, `check`, `prepare` (installe les hooks Husky).

- `lint` lance directement `eslint` (en Next 16, `next lint` n'existe plus).
- `typecheck` lance `next typegen` puis `tsc --noEmit` (`next typegen` génère les types de routes, doc Next).

**À ajouter plus tard :**

```jsonc
{
  "scripts": {
    "e2e": "playwright test", // étape 4
    "e2e:ui": "playwright test --ui", // étape 4
    "test": "vitest run", // étape 5
    "test:watch": "vitest", // étape 5
  },
}
```

À l'étape 5, ajouter `pnpm test` dans `check`. « Vert » = `pnpm check` sans erreur.

### 1.7 Vitest (guide officiel Next.js, adapté)

`vitest.config.mts` :

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true }, // alias @/* lus dans tsconfig.json, sans plugin en plus
  test: {
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"], // .spec.ts est réservé à Playwright (e2e/)
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

`vitest.setup.ts` :

```ts
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

> Le guide Next.js précise : Vitest ne sait pas tester les Server Components `async` → on les couvre en E2E (Playwright).

### 1.8 Arborescence feature-based (racine, sans `src/`)

```
wake-up-JARVIS/                # dossier du dépôt (nom du paquet : wake-up-jarvis)
├─ AGENTS.md
├─ README.md
├─ PLAN-UI.md
├─ docs/adr/
├─ docs/design/v3/             # maquettes v3 « blanc nacré » (PNG) + README.md + README-front.md
├─ next.config.ts              # Turbopack + Tailwind, Cache Components coupé, headers() : nosniff, Referrer-Policy, Permissions-Policy
├─ proxy.ts                    # (étape 4) CSP à nonce — SEUL endroit de la CSP ; "proxy" = ancien "middleware" en Next 16
├─ eslint.config.mjs
├─ .husky/                     # hook de commit → lint-staged (étape 1)
├─ vitest.config.mts           # (étape 5)
├─ vitest.setup.ts             # (étape 5) afterEach(cleanup)
├─ playwright.config.ts        # (étape 4)
├─ public/                     # fichiers statiques (pas de TypeScript ici)
│  ├─ assets/jarvis-mark.svg   # source du logo JARVIS
│  └─ icons/                   # (étape 21) icon-192.png, icon-512.png, icon-maskable-512.png (exports PNG faits une fois, voir 3.7)
├─ e2e/                        # tests Playwright, fichiers *.spec.ts uniquement
│  ├─ csp.spec.ts              # (étape 4)
│  ├─ intro.spec.ts
│  ├─ conversation.spec.ts
│  ├─ action-card.spec.ts
│  ├─ keyboard.spec.ts
│  └─ a11y.spec.ts
├─ app/                        # routes + composition
│  ├─ layout.tsx               # Server, async : await connection(), polices, <html lang="fr">, metadata, viewport
│  ├─ globals.css              # @import "tailwindcss" + @theme (tokens)
│  ├─ manifest.ts              # (étape 21) PWA — SEUL manifest de l'app
│  ├─ apple-icon.png           # (étape 21) 180 × 180 px
│  ├─ icon.svg                 # (étape 21) favicon vectoriel
│  ├─ favicon.ico              # (étape 21) remplace celui de Next
│  ├─ providers.tsx            # Client : SEUL endroit qui crée les adapters mock
│  ├─ ports-context.tsx        # Client : PortsProvider + usePorts() (déplacé depuis ports/)
│  ├─ page.tsx                 # Server : rend <MainScreen />
│  ├─ not-found.tsx
│  └─ dev/states/              # (squelette à l'étape 2, puis un bloc par étape) — 404 en production
│     ├─ page.tsx              # Server
│     └─ islands.tsx           # Client : îlots interactifs de la galerie
├─ features/                   # écrans uniquement — créés à la demande
│  ├─ intro/                   # SplashEntry.tsx (orchestrateur) + components/ hooks/ model/
│  ├─ conversation/            # MainScreen (Client, point d'entrée), Conversation, Composer…
│  ├─ actions/                 # ActionCard et cycle de vie affiché
│  ├─ journal/
│  ├─ mail/
│  └─ settings/
├─ components/ui/              # réutilisables PascalCase : JarvisMark.tsx, VisuallyHidden.tsx, Button…
├─ lib/                        # domaine PUR (aucun React, aucun navigateur, aucun fetch)
│  ├─ assets/index.ts          # SEUL point d'import des chemins public/ (jarvisMark, icons.*)
│  ├─ assistant/
│  │  ├─ machine.ts            # type AssistantState + transition(state, event) → state
│  │  └─ machine.test.ts
│  ├─ actions/
│  │  ├─ risk.ts               # niveaux de risque 1/2/3 + règles (focus, Entrée, signature)
│  │  ├─ lifecycle.ts          # états d'une carte d'action + transitions
│  │  └─ *.test.ts
│  ├─ greeting.ts              # salut selon l'heure (+ greeting.test.ts)
│  ├─ schemas.ts               # schémas Zod (messages, propositions d'action, mails, journal, préférences)
│  └─ motion.ts                # durées/easings pour GSAP (miroir des tokens CSS)
├─ ports/                      # interfaces TypeScript seulement (aucun React)
│  ├─ llm-port.ts
│  ├─ voice-port.ts
│  ├─ action-port.ts
│  ├─ memory-port.ts
│  ├─ mail-port.ts
│  └─ index.ts                 # type Ports = { llm, voice, action, memory, mail }
├─ fixtures/                   # SEULES données factices (validées par Zod) : adapters mock, tests, /dev/states
└─ adapters/
   └─ mock/                    # implémentations factices des ports
      ├─ mock-llm.ts
      ├─ mock-voice.ts         # amplitude factice (sinus + bruit)
      ├─ mock-action.ts
      ├─ mock-memory.ts
      └─ mock-mail.ts
```

Règles de rangement :

- **`features/` = écrans** : orchestrateur PascalCase à la racine (`SplashEntry.tsx`) ; sous-fichiers dans `components/`, `hooks/`, `model/`. Créés à la demande, pas de dossiers vides.
- **`components/ui/` = composants réutilisables** : PascalCase (`JarvisMark.tsx`). Visuel pur, pas de logique métier ni d'appel aux ports.
- **Nommage** : composants PascalCase ; hooks/fonctions camelCase (`useIntroTimeline.ts`, `createIntroTimeline.ts`). **Pas de kebab-case.**
- **`public/` = fichiers binaires/SVG** ; **`lib/assets`** = barrel des chemins (`import { jarvisMark, icons } from "@/lib/assets"`). Pas de TypeScript dans `public/`.
- **Sous-dossiers d'écran créés à la demande** : `components/` (UI de l'écran), `hooks/` (logique client), `model/` (timeline, mappers…) seulement au premier besoin.
- **Un seul dossier `fixtures/`**, à la racine : pas de `features/*/mocks` en doublon. Il est à la racine (et pas dans `adapters/mock/`) parce que le motif ESLint `**/adapters/**` bloquerait son import depuis `/dev/states`.
- **`ports-context.tsx` est déplacé dans `app/`** (choix fait plutôt que d'acter une exception) : c'est du React client, alors que `ports/` ne contient que des interfaces.
- Fichiers de test : `*.test.ts(x)` à côté du code (Vitest) ; `*.spec.ts` uniquement dans `e2e/` (Playwright).

### 1.9 La règle d'or : l'UI ne connaît que les ports

```
 composants  →  hooks  →  usePorts()  →  interfaces (ports)
                              ▲
   app/providers.tsx + app/ports-context.tsx : branchent les implémentations (adapters/mock)
```

- Un composant ou un hook **n'importe jamais** un adapter (`@/adapters`, `@/adapters/**`, `**/adapters/**` : bloqué par ESLint à partir de l'étape 7).
- Il appelle `usePorts().llm.reply(...)`, `usePorts().action.execute(...)`, etc. (`usePorts` vient de `@/app/ports-context`).
- Pour passer au vrai (V0b), on écrit `adapters/supabase`, `adapters/llm-…`, et on change **seulement** `providers.tsx`.
- Le domaine (`lib`) ne dépend de rien : ni React, ni ports, ni navigateur.
- Tout ce qui sort d'un adapter est **validé par Zod** avant d'arriver à l'UI (frontière).

Extrait des ports (exemple, à affiner en codant) :

```ts
// ports/llm-port.ts
export type LlmChunk =
  | { type: "text"; text: string }
  | { type: "action-proposal"; proposal: ActionProposal } // jamais exécutée ici
  | { type: "done" };

export interface LlmPort {
  reply(input: { text: string }, signal: AbortSignal): AsyncIterable<LlmChunk>;
}

// ports/voice-port.ts
export interface VoicePort {
  startListening(handlers: {
    onTranscript: (partial: string) => void;
    onLevel: (level: number) => void; // 0..1, ~30 fois/s : jamais dans un state React (voir 3.4)
  }): { stop: () => void };
  speak(
    text: string,
    handlers: { onLevel: (level: number) => void },
    signal: AbortSignal,
  ): Promise<void>;
  onWakeWord(handler: () => void): () => void; // mot de réveil (simulé ici, openWakeWord dans l'agent plus tard) ; renvoie « se désabonner »
}

// ports/action-port.ts
export interface ActionPort {
  requestSignature(
    actionId: string,
    signal: AbortSignal,
  ): Promise<"signed" | "refused">; // Touch ID ou mot de passe du Mac (WebAuthn), simulé ici
  execute(actionId: string, signal: AbortSignal): AsyncIterable<ActionEvent>; // sortie ligne par ligne, puis fin
  cancel(actionId: string): Promise<void>;
  history(): Promise<JournalEntry[]>;
}

// ports/memory-port.ts
export interface MemoryPort {
  listMessages(): Promise<Message[]>;
  appendMessage(message: Message): Promise<void>;
}

// ports/mail-port.ts
export interface MailPort {
  listRecent(limit: number): Promise<MailSummary[]>; // lecture seule
}
```

**Préférences locales** (intro déjà vue, mode d'intro, raccourci micro, réveil, panneau ouvert, son coupé) : pas un service, donc pas de port. Un seul module `features/settings/model/preferences.ts` lit/écrit `localStorage` et **valide avec Zod** (une valeur corrompue = valeurs par défaut). Les composants le lisent avec **`useSyncExternalStore`** : `getServerSnapshot` renvoie une valeur **neutre** (`null` = « pas encore connu »), la vraie valeur arrive après l'hydratation. Pas de script inline pour lire `localStorage` avant React (la CSP l'interdirait, et ce n'est pas utile).

**Déclencheurs déterministes du mock LLM** (pour les tests et les démos) :

| Message contient  | Effet simulé                                                 |
| ----------------- | ------------------------------------------------------------ |
| (rien de spécial) | réponse texte en flux, ~1 s de « réflexion »                 |
| `#action`         | propose une action niveau 1 (`ls -la ~/code`)                |
| `#modif`          | propose une action niveau 2 (ex. `git -C ~/code/demo pull`)  |
| `#risque`         | propose une action niveau 3 (ex. `rm -rf ~/code/demo/build`) |
| `#erreur`         | passe en état erreur                                         |
| `#lent`           | réflexion longue (5 s)                                       |

---

## 2) Écrans et composants

### 2.0 Server, client, partagé : les règles

Légende de la colonne « Type » :

- **S** = Server Component : pas de directive, jamais importé par un composant client.
- **E** = **point d'entrée client** : le fichier commence par `"use client"`.
- **C** = client **par import** : pas de directive ; utilise état, événements, navigateur ou GSAP ; n'est importé **que** depuis un point d'entrée E (s'il était importé depuis un composant serveur, le build le signalerait).
- **P** = **partagé** : pas de directive, pas de hook ; s'affiche aussi bien côté serveur que côté client.

Règles :

- `"use client"` **seulement aux points d'entrée** : `Providers`, `app/ports-context.tsx`, `MainScreen`, `IntroOverlay`, `SidePanel`, `SettingsDialog`, `CopyButton`, îlots de `/dev/states` (`app/dev/states/islands.tsx`).
- `app/page.tsx` reste **serveur** et rend `<MainScreen />`.
- **Un seul état d'assistant** : `useAssistant()` est appelé **une seule fois**, dans `MainScreen` (`features/conversation/main-screen.tsx`). `MainScreen` passe l'état et les callbacks en props à `VoiceRing`, `HeaderRing`, `StatusAnnouncer`, `Composer` et `Conversation`. (Un `useReducer` local dans chaque composant ne partagerait rien. L'autre option, un `AssistantProvider`, n'est pas retenue : un seul composant suffit.)
- **Aucun `style={…}` dans le HTML rendu au serveur** (y compris le premier rendu des composants client) : en production, la CSP `style-src 'nonce-…'` bloque les attributs `style`. On utilise des classes Tailwind ; les valeurs qui bougent sont posées **par GSAP après le montage** (GSAP écrit via `element.style`, ce que la CSP laisse passer).

### 2.1 Écrans

| Écran             | Route         | Rôle                                                                                                 |
| ----------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Écran principal   | `/`           | Conversation + saisie + anneau + panneau droit (Journal / Mails) ; l'intro se superpose au-dessus    |
| Galerie des états | `/dev/states` | Tous les états de tous les composants, côte à côte, pour vérifier visuellement et faire des captures |
| Page introuvable  | `not-found`   | Message simple, lien retour                                                                          |

`/dev/states` est **créée dès l'étape 2** (squelette), puis **chaque étape y ajoute son bloc**. Elle est **désactivée en production** :

```ts
// app/dev/states/page.tsx (Server)
import { notFound } from "next/navigation";

const isEnabled =
  process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";

export default function DevStatesPage() {
  if (!isEnabled) notFound();
  return <DevStatesGallery />;
}
```

(`VERCEL_ENV` est une variable système fournie par Vercel, pas un secret. La galerie est aussi en `robots: noindex`.)

### 2.2 Composants

#### Coquille

| Composant                                              | Type | Rôle                                                                                                                                                                                                                                                                                    | Props / états                                                                                      | Données simulées                                                      |
| ------------------------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `RootLayout` (`app/layout.tsx`)                        | S    | `async` + `await connection()` (rendu dynamique, nécessaire pour le nonce CSP) ; `<html lang="fr">`, polices, metadata, viewport (theme-color `#0B0B0C`)                                                                                                                                | —                                                                                                  | —                                                                     |
| `Providers` (`app/providers.tsx`)                      | E    | Crée les adapters mock, fournit `PortsProvider`                                                                                                                                                                                                                                         | `children`                                                                                         | Tous les mocks                                                        |
| `MainScreen` (`features/conversation/main-screen.tsx`) | E    | **Seul** composant qui appelle `useAssistant()` ; rend `AppShell`, `AppHeader`, `VoiceRing`, `HeaderRing`, `StatusAnnouncer`, `Conversation`, `Composer`, `SidePanel`, `IntroOverlay` ; fournit l'abonnement au niveau de voix (jamais en state)                                        | —                                                                                                  | via `usePorts()`                                                      |
| `AppShell`                                             | P    | Grille : header, zone centrale, panneau droit ; lien d'évitement « Aller à la saisie »                                                                                                                                                                                                  | `children`                                                                                         | —                                                                     |
| `AppHeader`                                            | C    | Titre « JARVIS » (wordmark, voir 3.6), statut, mini-anneau 40 px, indicateur de réveil, indicateur « Micro actif » en écoute (porte le **seul** `role="status"` de l'écoute, voir « État écoute »), badge « Hors ligne » (texte + icône nuage barré) quand c'est le cas, bouton panneau | `state`                                                                                            | —                                                                     |
| `WakeWordIndicator`                                    | C    | Indicateur **permanent** « Réveil actif » (texte + icône oreille/onde) ou « Réveil coupé », avec un bouton 44 px pour couper / réactiver (même réglage que dans `SettingsDialog`)                                                                                                       | `enabled`                                                                                          | Préférence `localStorage` ; détection simulée par le `VoicePort` mock |
| `HeaderRing`                                           | C    | Anneau 40 px qui apparaît quand le grand anneau sort de l'écran (IntersectionObserver, fondu d'opacité, pas de redimensionnement animé)                                                                                                                                                 | `state: AssistantState`                                                                            | —                                                                     |
| `SidePanel`                                            | E    | Panneau droit repliable, onglets Journal / Mails                                                                                                                                                                                                                                        | `open`, `activeTab` ; bouton avec `aria-expanded` / `aria-controls` ; onglets au clavier (flèches) | —                                                                     |
| `StatusAnnouncer`                                      | C    | Une seule zone `aria-live="polite"` qui annonce « Réfléchit… », « De nouveau en ligne », etc. **N'annonce pas l'entrée en écoute** : « Micro actif » est déjà annoncé par le `role="status"` du header (décision ARCHITECT 2026-11-01, pas de double annonce).                          | `message`                                                                                          | —                                                                     |

#### intro

| Composant                                     | Type                 | Rôle                                                                                                                                                                       | Props / états                                                                                                             | Données                                                              |
| --------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `IntroOverlay`                                | E                    | Joue l'intro complète (~3,5 s) ou courte (~0,8 s), ou rien                                                                                                                 | `mode: "full" \| "short" \| "none" \| null` (`null` = pas encore connu, rendu neutre) ; états internes `playing` / `done` | Préférences via `useSyncExternalStore` ; salut calculé après montage |
| `IntroRing`                                   | C                    | SVG : point de lumière, anneau, 2–3 arcs, ligne de scan ; porte `data-flip-id="ring"`                                                                                      | piloté par la timeline GSAP                                                                                               | —                                                                    |
| `IntroGreeting`                               | C                    | « JARVIS » puis « Bonsoir, DevinChat » lettre par lettre                                                                                                                   | `text` ; lettres en `aria-hidden`, texte complet en `VisuallyHidden`                                                      | `greeting(hour)`                                                     |
| `SkipIntroButton`                             | C                    | Bouton « Passer » 44 px, visible et focusable dès le début                                                                                                                 | `onSkip`                                                                                                                  | —                                                                    |
| `JarvisMark` (`components/ui/JarvisMark.tsx`) | à préciser par PIXEL | Logo JARVIS en SVG ; source `public/assets/jarvis-mark.svg` (chemin via `@/lib/assets`) ; ids du masque et des dégradés générés par **`useId`** ; règles SVG de l'annexe 6 | —                                                                                                                         | —                                                                    |

Règles intro :

- Échap, clic n'importe où, bouton « Passer », ou **n'importe quelle frappe** → l'intro saute à la fin.
- La zone de saisie est **déjà rendue et focusée** sous l'intro : une touche tapée arrive dans le champ, rien n'est perdu.
- **Mode d'intro et salut sans écart d'hydratation** : le mode vient de `localStorage` via `useSyncExternalStore` avec un snapshot serveur neutre (`null`) ; tant qu'il vaut `null`, rien d'animé ni de texte de salut. Le salut (`greeting(hour)`) est calculé **après le montage** (heure locale du Mac). Pas de script inline.
- Fin de l'intro : l'anneau se pose à sa place avec **GSAP Flip** (voir 3.4) — l'anneau de l'intro et l'anneau principal partagent `data-flip-id="ring"` ; puis `localStorage` mémorise « intro vue ».
- Reduced motion : anneau fixe en fondu 300 ms, pas de rotation, pas de zoom, pas de lettre par lettre (texte en fondu), **pas de Flip**.
- Pas plus de 3 flashs par seconde : aucune variation brusque de luminance ; la ligne de scan **se déplace**, elle ne clignote pas.

#### voice-ring

| Composant         | Type | Rôle                                                                                  | Props / états                                                                                                                          | Données                            |
| ----------------- | ---- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `VoiceRing`       | C    | Anneau ~160 px (SVG + CSS), animé par GSAP selon l'état ; porte `data-flip-id="ring"` | `state: AssistantState`, `subscribeLevel: (cb) => unsubscribe` (le niveau ne passe **jamais** par une prop qui change ni par un state) | Niveau factice du `VoicePort` mock |
| `VoiceWave`       | C    | Onde (Canvas 2D) qui suit le niveau en écoute/parole                                  | `subscribeLevel`, `active`                                                                                                             | Sinus + bruit                      |
| `RingStatusLabel` | P    | Libellé + icône sous l'anneau                                                         | `state`                                                                                                                                | —                                  |

États de l'anneau (jamais la couleur seule : toujours libellé + icône) :

| État        | Visuel                                                                           | Libellé        | Icône             |
| ----------- | -------------------------------------------------------------------------------- | -------------- | ----------------- |
| `idle`      | respiration lente (opacité/échelle très légère)                                  | « Prêt »       | point             |
| `listening` | réagit au volume (échelle des segments)                                          | « Écoute… »    | micro             |
| `thinking`  | **indicateur nacré qui tourne** (segments discontinus en traînée) — plus d'ambre | « Réfléchit… » | sablier           |
| `speaking`  | onde qui suit la voix                                                            | « Parle… »     | haut-parleur      |
| `error`     | anneau figé, trait couleur `danger`                                              | « Erreur »     | triangle d'alerte |
| `offline`   | anneau en pointillés **figés**, couleur `text-muted`                             | « Hors ligne » | nuage barré       |

Le **mot de réveil** n'ajoute **pas** d'état d'anneau : une détection fait simplement passer en `listening`.

**État `error`** (validé SKETCH) :

- anneau figé, trait `danger`, icône triangle, libellé « Erreur » ;
- bouton **« Réessayer »** 44 px, qui reçoit le **focus** ;
- une ligne de cause **en clair** dans la conversation (ex. « La réponse n'a pas pu être générée. ») ;
- le **texte tapé est conservé** dans le champ.

**État `offline`** (validé SKETCH) :

- anneau en pointillés figés `text-muted`, icône nuage barré, « Hors ligne » sous l'anneau **et** dans le header ;
- le champ reste **modifiable**, le brouillon est **gardé** ;
- Envoyer et Micro passent en `aria-disabled="true"` (pas `disabled`, pour rester focusables) avec la raison écrite à côté : « Hors ligne, l'envoi revient avec la connexion » (reliée par `aria-describedby`) ;
- au retour du réseau : **une seule** annonce « De nouveau en ligne ».

#### conversation

| Composant          | Type | Rôle                                                                                                                                                                            | Props / états                                                                    | Données                                    |
| ------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| `Conversation`     | C    | Liste des messages, colonne centrée **max 68 caractères** (`max-w-[68ch]`)                                                                                                      | `messages`, `status`                                                             | `MemoryPort` mock (3–4 messages d'exemple) |
| `MessageItem`      | P    | Un message (utilisateur ou JARVIS), toujours **en texte**                                                                                                                       | `role`, `text`, `createdAt`                                                      | —                                          |
| `StreamingMessage` | C    | Réponse JARVIS qui arrive en flux                                                                                                                                               | `chunks`                                                                         | `LlmPort` mock                             |
| `SpeakControls`    | C    | « Couper la voix » / « Réactiver » ; Échap interrompt la parole                                                                                                                 | `speaking`, `muted`                                                              | —                                          |
| `Composer`         | C    | Textarea auto-grandissante, bouton micro **60 px**, bouton Envoyer **44 px**                                                                                                    | `value`, `listening`, `disabled` ; Entrée = envoyer, Maj+Entrée = nouvelle ligne | Transcription factice du `VoicePort`       |
| `MicButton`        | C    | Clic = bascule écoute ; `aria-pressed` ; libellé « Parler » / « Arrêter l'écoute » ; bouton de **60 px** ; en écoute, bouton « Couper le micro » visible (voir « État écoute ») | `listening`                                                                      | —                                          |

Voix simulée :

- **Raccourci maintenu** = écoute pendant l'appui (on ignore `event.repeat`) ; **clic** sur le micro = bascule.
- Raccourci par défaut : **Ctrl+Maj+Espace** (macOS ; à tester sur le Mac de DevinChat à l'étape 12). Il est **réglable** dans `SettingsDialog` (étape 13) : bouton « Changer », puis on tape la combinaison. Une combinaison **doit toujours contenir un modificateur** (Ctrl, Option, Cmd ou Maj) — WCAG 2.1.4 (raccourcis à une seule touche interdits).
- Le **bouton micro** reste le moyen **garanti** de parler, même si le raccourci ne marche pas.
- La transcription factice s'écrit en direct **dans le champ** ; on peut la corriger avant d'envoyer. Rien n'est envoyé automatiquement.
- Chaque réponse est **toujours écrite** ; la « voix » (simulée : état `speaking` + niveau factice, sans son) s'ajoute par-dessus et peut être coupée.
- Amplitude simulée : une fonction pure dans le mock (somme de sinus + bruit, ~30 valeurs/s). Elle ne tourne qu'en écoute ou en parole. Web Audio réel plus tard (V0b).

**État écoute** (DA v3, validé) :

- **« Micro actif »** (texte + icône micro) est affiché **en permanence** tant que l'état vaut `listening` : dans le header **et** en rappel en bas, à côté du bouton. Rien ne clignote.
- L'indicateur du **header** porte le **seul `role="status"`** ; le rappel du **bas** est en **`aria-hidden="true"`** (rappel visuel, pas une seconde annonce).
- Sous le rappel du bas, une ligne **fixe** : « Coupure auto après 15 s de silence » (pas de compte à rebours, `aria-hidden="true"` avec le rappel).
- Tailles : bouton micro **60 px**, bouton Envoyer **44 px** ; libellé « Couper le micro » en **14 px sur mobile**.

> Pourquoi pas Ctrl+Espace : sur macOS, ce raccourci sert par défaut à changer de source de saisie (clavier) et n'arrive pas au navigateur. Voir [ADR 0005](./docs/adr/0005-cible-macos.md). (Non retesté par PIXEL : voir section 7.)

#### actions

| Composant                                      | Type | Rôle                                                                                                           | Props / états                                      | Données           |
| ---------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------- |
| `ActionCard`                                   | C    | Carte de confirmation **dans la conversation** (pas de modale)                                                 | `proposal: ActionProposal`, `status: ActionStatus` | `ActionPort` mock |
| `CommandBlock`                                 | P    | La **commande exacte résolue** en mono, avec `CopyButton`                                                      | `command`                                          | —                 |
| `CopyButton` (`components/ui/copy-button.tsx`) | E    | Bouton « Copier » 44 px (presse-papiers), réutilisé par `CommandBlock` et `JournalEntry`                       | `text`                                             | —                 |
| `RiskBadge`                                    | P    | Niveau de risque en **texte + icône**                                                                          | `risk: 1 \| 2 \| 3`                                | —                 |
| `ActionOutput`                                 | C    | Sortie qui défile pendant l'exécution (`role="log"`)                                                           | `lines`, `running`                                 | Lignes factices   |
| `ActionButtons`                                | C    | Niveau 1 : « Exécuter » / « Annuler ». Niveaux 2 et 3 : « Signer et exécuter » (icône empreinte) / « Annuler » | `risk`, `status`                                   | —                 |

Contenu d'une carte :

- commande exacte en mono (c'est `proposal.command`, **jamais un résumé du LLM**) ;
- dossier (`cwd`) et Mac concerné (`machine.name`) ;
- explication en une phrase (étiquetée « Explication », séparée de la commande) ;
- niveau de risque : **1 Lecture**, **2 Modification**, **3 Dangereux** — texte + icône (œil / crayon / triangle) ; rouge seulement pour le niveau 3, avec icône.

Règles (proposées, **à valider par HACKER**) :

| Niveau         | Bouton principal   | Focus initial | Entrée        | Signature (Touch ID ou mot de passe du Mac, simulée) |
| -------------- | ------------------ | ------------- | ------------- | ---------------------------------------------------- |
| 1 Lecture      | Exécuter           | Exécuter      | lance         | non                                                  |
| 2 Modification | Signer et exécuter | Annuler       | ne lance rien | oui                                                  |
| 3 Dangereux    | Signer et exécuter | Annuler       | ne lance rien | oui                                                  |

- **Jamais de confirmation vocale** pour une action risquée (niveau ≥ 2) : la voix ne peut pas cliquer « Exécuter ».
- États de la carte : `pending` (en attente) → `awaiting_signature` (niveaux 2 et 3 seulement) → `running` (en cours) → `succeeded` (réussie) | `failed` (échec, **code de sortie affiché**) ; et aussi `cancelled` (annulée), `expired` (expirée).
- **`awaiting_signature`** (validé SKETCH) :
  - texte : « En attente de ta signature (Touch ID ou mot de passe du Mac) » ;
  - **seul « Annuler » est actif** ;
  - la **commande est figée** dès cet état (plus aucune modification possible de la proposition) ;
  - si la signature est refusée ou abandonnée → **retour à `pending`** (et non `cancelled`) avec le message « Signature non faite, rien n'a été lancé ».
- **Expiration** : 120 s après la proposition. La carte affiche un texte **fixe** « Expire à HH:MM » (heure locale) ; **pas de compte à rebours** annoncé ni animé.
- Chaque état a un libellé texte + icône, et est annoncé via `aria-live="polite"`.

**Carte de signature : affichage du payload** (niveaux 2 et 3 ; format du payload : annexe 6, point 10) :

- Le bloc montre le **JCS brut entier**, **sans troncature**, en Plex Mono 400 sans tracking ni capitales forcées (voir 3.6), avec `dir="ltr"`. Retour à la ligne n'importe où (coupures seulement visuelles), **pas de symbole ↵**.
- Les **échappements JSON** (`\n`, `\t`, `\"`, `\\`, `\uXXXX`) et les **cases `U+XXXX`** ont **le même style** : contour `#9A9A97` sur fond `#1C1C1F`, **pas d'ambre**.
- Classement des cases par **catégorie Unicode** : tout caractère `Cc` ou `Cf` → case `U+XXXX` (sauf ceux que JCS échappe déjà, montrés par leur échappement) ; dans `argv` et `cwd`, **tout caractère non ASCII** → case `U+XXXX`.
- Légende exacte : « Texte exact qui sera signé. Les cases `U+XXXX` signalent un caractère invisible, de contrôle ou non ASCII. Si tu en vois une que tu n'attendais pas, annule. »
- **Cas de test CRASH TEST** : un paramètre contenant `U+202E`, `U+200B`, `U+007F` et `U+0085` doit s'afficher en cases, sans effet sur le reste du bloc (pas d'inversion, pas de saut de ligne, rien d'invisible).
- L'ambre reste sur la carte elle-même (signature Touch ID), jamais sur le payload ni sur les cases.

#### journal

| Composant      | Type | Rôle                                                                                                                    | Props / états       | Données                                   |
| -------------- | ---- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------- |
| `JournalPanel` | C    | Liste horodatée, filtre par statut                                                                                      | `entries`, `filter` | `ActionPort.history()` mock (~10 entrées) |
| `JournalEntry` | C    | Commande, statut (texte + icône), durée, heure ; sortie dépliable (`<details>` ou bouton `aria-expanded`), `CopyButton` | `entry`             | —                                         |
| `StatusFilter` | C    | Filtre : Tous / Réussies / Échecs / Annulées / Expirées                                                                 | `value`, `onChange` | —                                         |

#### mail

| Composant   | Type | Rôle                                                                | Props / états                             | Données                                            |
| ----------- | ---- | ------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------- |
| `MailPanel` | C    | Liste **en lecture seule** : expéditeur, objet, extrait             | `mails`, états chargement / vide / erreur | `MailPort` mock (~6 mails factices, noms inventés) |
| `MailItem`  | P    | Une ligne de mail, **tout en texte** (jamais de HTML de mail rendu) | `mail`                                    | —                                                  |

#### settings

| Composant        | Type | Rôle                                                                                                                                                                                                                                                                                                                  | Props / états | Données                                                      |
| ---------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `SettingsDialog` | E    | Réglages : intro (complète / courte / aucune) ; **raccourci micro** (« Changer » puis taper la combinaison, modificateur obligatoire, défaut Ctrl+Maj+Espace, bouton « Revenir au défaut ») ; **mot de réveil** actif / coupé (même réglage que l'indicateur du header) ; voix coupée par défaut ; « revoir l'intro » | préférences   | `localStorage` validé par Zod, lu par `useSyncExternalStore` |

#### dev

| Composant          | Type                                            | Rôle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DevStatesGallery` | S (+ îlots E dans `app/dev/states/islands.tsx`) | Grille, remplie **un bloc par étape** : tokens, 6 états de l'anneau, 7 états de carte × 3 niveaux, journal (vide / plein / filtré), mails (chargement / vide / erreur / liste), composer (vide / transcription / désactivé), intro (complète / courte / reduced motion), offline (avec Envoyer/Micro en `aria-disabled` et la raison), erreur (avec « Réessayer » et texte conservé), carte en `awaiting_signature` et après signature refusée, indicateur « Réveil actif » / « Réveil coupé », réglages. Chaque bloc a un titre et un `id` pour les captures Playwright. Les données viennent de `fixtures/`. |

### 2.3 Machine d'états de l'assistant

États : `idle → listening → thinking → speaking → idle`, plus `error` et `offline`.

```
            START_LISTEN              SUBMIT
   idle ───────────────▶ listening ─────────▶ thinking ──REPLY_START──▶ speaking
    ▲  ▲                    │ STOP_LISTEN          │                       │
    │  └────────────────────┘ (texte reste éditable)│ REPLY_DONE (muet)    │ SPEAK_END / INTERRUPT (Échap)
    │                                               ▼                       ▼
    └──────────────────────────────────────────── idle ◀───────────────────┘
   n'importe quel état ──FAIL──▶ error ──RETRY / DISMISS──▶ idle
   n'importe quel état ──WENT_OFFLINE──▶ offline ──BACK_ONLINE──▶ idle
   idle ──SUBMIT (texte tapé)──▶ thinking
   idle ──WAKE_DETECTED (mot de réveil)──▶ listening   (pas de nouvel état)
```

Extrait (domaine pur, sans bibliothèque — un `switch` suffit, pas de XState) :

```ts
// lib/assistant/machine.ts
export type AssistantState =
  "idle" | "listening" | "thinking" | "speaking" | "error" | "offline";

export type AssistantEvent =
  | { type: "START_LISTEN" }
  | { type: "STOP_LISTEN" }
  | { type: "WAKE_DETECTED" }
  | { type: "SUBMIT" }
  | { type: "REPLY_START" }
  | { type: "REPLY_DONE" }
  | { type: "SPEAK_END" }
  | { type: "INTERRUPT" }
  | { type: "FAIL" }
  | { type: "RETRY" }
  | { type: "DISMISS" }
  | { type: "WENT_OFFLINE" }
  | { type: "BACK_ONLINE" };

export function transition(
  state: AssistantState,
  event: AssistantEvent,
): AssistantState {
  if (event.type === "WENT_OFFLINE") return "offline";
  if (event.type === "FAIL" && state !== "offline") return "error";
  switch (state) {
    case "idle":
      return event.type === "START_LISTEN" || event.type === "WAKE_DETECTED"
        ? "listening"
        : event.type === "SUBMIT"
          ? "thinking"
          : state;
    case "listening":
      return event.type === "STOP_LISTEN"
        ? "idle"
        : event.type === "SUBMIT"
          ? "thinking"
          : state;
    case "thinking":
      return event.type === "REPLY_START"
        ? "speaking"
        : event.type === "REPLY_DONE" || event.type === "INTERRUPT"
          ? "idle"
          : state;
    case "speaking":
      return event.type === "SPEAK_END" || event.type === "INTERRUPT"
        ? "idle"
        : state;
    case "error":
      return event.type === "RETRY" || event.type === "DISMISS"
        ? "idle"
        : state;
    case "offline":
      return event.type === "BACK_ONLINE" ? "idle" : state;
  }
}
```

Le hook `useAssistant()` (feature conversation) utilise `useReducer(transition, "idle")` et branche les ports. Il est appelé **une seule fois, dans `MainScreen`**, qui distribue l'état en props. Le niveau de voix n'est **pas** dans ce reducer (voir 3.4). Les tests Vitest couvrent **chaque transition** du tableau.

Salut selon l'heure (pur, testé) : 5 h–17 h 59 → « Bonjour, DevinChat » ; sinon → « Bonsoir, DevinChat ». Calculé **côté client, après le montage** (heure locale) : le HTML serveur ne contient pas de salut, donc pas d'écart d'hydratation, et pas de script inline.

---

## 3) Tokens, direction artistique et accessibilité

### 3.1 Tokens (Tailwind v4, `app/globals.css`) — **DA v3 « blanc nacré » (SKETCH, 01/11/2026), validée par DevinChat le 01/11/2026 avec le logo JARVIS**

Tailwind v4 expose des « namespaces » de thème (`--color-*`, `--font-*`, `--radius-*`, `--spacing-*`, `--shadow-*`, `--drop-shadow-*`, `--blur-*`, `--ease-*`, `--animate-*`, `--text-*`, `--tracking-*`…). **Il n'y a pas de namespace `--duration-*`** : les durées vont dans `:root` (variables CSS simples) et sont recopiées dans `lib/motion.ts` pour GSAP.

```css
@import "tailwindcss";

@theme {
  /* Couleurs — DA v3 « blanc nacré » (SKETCH, 01/11/2026 ; validée par DevinChat le 01/11/2026) */
  --color-bg: #0b0b0c; /* fond noir cendré */
  --color-surface: #141416; /* verre (~85 % + blur 8 px, composé ≈ #131315) */
  --color-surface-2: #1c1c1f; /* cartes, survol */
  --color-text: #e8e8e6; /* texte principal */
  --color-text-muted: #9a9a97; /* texte secondaire */
  --color-line: #6a6a6e; /* bordures de contrôles (≥ 3,16:1) */
  --color-line-subtle: #2a2a2d; /* DÉCORATIF uniquement */
  --color-hud: #3a3a3e; /* arcs, graduations, crochets (décor) */
  --color-hud-strong: #55555a; /* décor */
  --color-accent: #eceae4; /* blanc nacré plein : focus, petites icônes d'état, curseur */
  --color-attention: #f5b84a; /* ambre : RÉSERVÉ à la signature Touch ID (pas la réflexion) */
  --color-danger: #ff6b6b; /* rouge : danger uniquement, toujours avec icône */
  --color-success: #5ee3a1; /* réussite (toujours avec icône + texte) */

  /* Texte posé SUR une couleur pleine : toujours le fond sombre */
  --color-on-accent: var(
    --color-bg
  ); /* sur bouton clair : 12,27:1 au pire (#CFCCC5) */
  --color-on-danger: var(--color-bg); /* blanc interdit sur #FF6B6B */
  --color-on-success: var(--color-bg);

  /* Polices (variables posées par next/font dans layout.tsx) */
  --font-sans: var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, "SF Mono", Menlo, monospace;

  /* Texte : 16 px minimum pour le corps */
  --text-base: 1rem; /* 16 px — corps */
  --text-sm: 0.875rem; /* 14 px — MINIMUM pour tout texte porteur d'info : statuts, heure du journal, risque */
  --text-dial: 0.75rem; /* 12 px — UNIQUEMENT la classe .dial (cadran, décoratif, aria-hidden) */

  /* Tracking (voir 3.6) — jamais de valeur en dur, seulement ces tokens */
  --tracking-wordmark: 0.32em; /* titre JARVIS */
  --tracking-title: 0.16em; /* titres de section */
  --tracking-label: 0.12em; /* labels, statuts, boutons */
  --tracking-dial: 0.18em; /* .dial uniquement */

  /* Rayons */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  /* Espacements */
  --spacing: 0.25rem; /* base Tailwind (4 px) */
  --spacing-touch: 44px; /* cible tactile minimale → w-touch, h-touch */
  --spacing-ring: 160px; /* grand anneau */
  --spacing-ring-mini: 40px; /* anneau du header */
  --spacing-panel: 360px; /* largeur du panneau droit */

  /* Ombres / lueurs — statiques, seulement sur traits décoratifs */
  --shadow-glass: 0 8px 32px rgb(0 0 0 / 0.45);
  --drop-shadow-glow: 0 0 6px rgb(236 234 228 / 0.18);
  --drop-shadow-glow-strong: 0 0 14px rgb(236 234 228 / 0.22);
  --drop-shadow-glow-amber: 0 0 8px rgb(245 184 74 / 0.3); /* signature Touch ID uniquement */

  /* Flou du verre */
  --blur-glass: 8px;

  /* Easings */
  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out-soft: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-breath: cubic-bezier(0.37, 0, 0.63, 1);
}

:root {
  /* Durées — validées par SKETCH (miroir dans lib/motion.ts) */
  --duration-fast: 150ms; /* survol, focus */
  --duration-base: 250ms; /* ouverture panneau, apparition carte */
  --duration-reduced: 300ms; /* fondu en reduced motion */
  --duration-intro-full: 3500ms;
  --duration-intro-short: 800ms;
  --duration-breath: 4000ms; /* respiration au repos */
  --duration-think-spin: 2400ms; /* un tour des segments en réflexion */

  /* Lumière de l'accent (dégradés de l'anneau, de la voix, de la ligne de scan) */
  --accent-light-strong: rgb(
    236 234 228 / 0.95
  ); /* tête des traînées, centre des barres */
  --accent-light-mid: rgb(
    236 234 228 / 0.55
  ); /* pointes, début de traînée en reduced motion */
  --accent-light-faint: rgb(
    236 234 228 / 0.12
  ); /* queues, extrémités de la ligne de scan */
  --btn-light-top: #f1efea; /* bouton clair : Envoyer, micro actif, interrupteur */
  --btn-light-bottom: #cfccc5;

  color-scheme: dark;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--text-base);
}

/* Focus visible partout */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Verre : presque opaque, léger flou, jamais au-dessus d'un fond animé */
.glass {
  background: rgb(20 20 22 / 0.85);
  backdrop-filter: blur(var(--blur-glass));
}
```

Polices (`app/layout.tsx`) :

```ts
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
// <html lang="fr" className={`${plexSans.variable} ${plexMono.variable}`}>
```

(On précise `weight` explicitement : ça marche que la police soit variable ou non sur Google Fonts.)

### 3.2 Contrastes (formule WCAG) — DA v3, calculés par SKETCH

Source complète : [docs/design/v3/README.md](./docs/design/v3/README.md) et [docs/design/v3/README-front.md](./docs/design/v3/README-front.md).

| Premier plan                                    | sur bg `#0B0B0C` | sur verre | sur `#1C1C1F`         | Exigence                        |
| ----------------------------------------------- | ---------------- | --------- | --------------------- | ------------------------------- |
| Texte `#E8E8E6`                                 | 16,04:1          | 15,12:1   | 13,86:1               | 4,5:1 ✅                        |
| Secondaire `#9A9A97`                            | 6,97:1           | 6,58:1    | 6,03:1                | 4,5:1 ✅                        |
| Accent `#ECEAE4` (icônes, focus)                | 16,35:1          | 15,43:1   | 14,13:1               | 4,5 / 3:1 ✅                    |
| Ambre `#F5B84A` (signature Touch ID uniquement) | 11,09:1          | 10,46:1   | 9,58:1                | ✅                              |
| Danger `#FF6B6B`                                | —                | 6,69:1    | 6,13:1                | ✅ (badge sur #3C272A : 4,99:1) |
| Succès `#5EE3A1`                                | —                | 11,47:1   | 10,51:1               | ✅                              |
| Bordure `#6A6A6E`                               | 3,65:1           | 3,45:1    | 3,16:1                | 3:1 ✅ (juste)                  |
| `#0B0B0C` sur bouton clair                      | —                | —         | 12,27:1 (bas #CFCCC5) | ✅                              |
| `faint`, hud, hud-strong, line-subtle           | 1,30 à 2,65:1    | —         | —                     | ❌ → décor uniquement           |

**Règle v3** : l'accent `#ECEAE4` et le texte `#E8E8E6` ont la même clarté (1,02:1). L'accent ne porte donc **jamais** une information à lui seul : on le reconnaît à la forme (traînée, point de tête, barres), au halo statique, à la graisse 600 et au soulignement de l'onglet actif ; chaque état garde libellé et icône.

Attention : un fond en verre à 85 % au-dessus d'un élément clair peut baisser le contraste → **jamais de texte au-dessus d'un flou animé**, et vérifier les captures avec axe.

### 3.3 Direction artistique (reprise de SKETCH)

- **Fond** noir cendré `#0B0B0C`, accent **blanc nacré** `#ECEAE4` rendu en dégradés rgba pour l'anneau, la voix et la ligne de scan ; focus en blanc plein. L'anneau est une traînée : un tracé SVG découpé en 120 à 240 arcs d'opacité croissante (`faint` → `strong`), puis un point de tête plein (SVG n'a pas de dégradé conique).
- **Ambre `#F5B84A` réservé à la signature Touch ID** (carte de signature, « En attente de ta signature »). Nulle part ailleurs.
- **« JARVIS réfléchit »** = **indicateur nacré qui tourne** (plus d'ambre). **Rouge** = danger uniquement, toujours avec une icône.
- **Typo** : IBM Plex Sans + IBM Plex Mono, rôles et tracking en **3.6**. Pas d'Orbitron.
- _Historique_ : les DA v1 et v2 (accent **cyan** glacé) sont **remplacées** par la v3 ; elles ne servent plus de référence.
- **Verre** presque opaque (~85 %) + léger flou ; jamais de texte sur un flou animé.
- **Lueurs** uniquement sur les traits décoratifs (anneau, arcs), jamais sur le texte.
- **Scanlines et grain** : statiques et très légers (un seul calque CSS fixe, opacité ≤ 4 % — validé —, `pointer-events: none`, `aria-hidden`). Le réglage fin du grain et des scanlines se fait **à l'œil sur la capture de l'étape 2**.
- **Techno** : anneau et cadran en **SVG + CSS**, animés par **GSAP** (transform/opacity uniquement) ; onde de voix en **Canvas 2D** ; Three.js seulement plus tard, en « mode cinéma » optionnel.
  - **Exception validée par SKETCH** : le **dessin de l'anneau** dans l'intro anime `stroke-dashoffset` (un seul tracé, une seule fois). En reduced motion : **anneau complet en fondu**, pas de tracé.
- **Écran principal, bureau d'abord** : conversation centrée (max 68 caractères), saisie en bas, anneau ~160 px au-dessus de la conversation, réduit à 40 px dans le header au scroll ; panneau droit repliable (Journal, Mails).
- Responsive : en dessous de ~1024 px, le panneau devient un tiroir par-dessus (même composant).

### 3.4 Animations : règles GSAP

GSAP est installé à l'étape 9 (pas avant).

**États de l'anneau** (`useGSAP` + `gsap.matchMedia`) :

```tsx
// components/ui/voice-ring.tsx — pas de "use client" : importé seulement depuis MainScreen
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function VoiceRing({ state }: { state: AssistantState }) {
  const scope = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          if (ctx.conditions?.reduce) {
            gsap.set(".ring", { opacity: 1 }); // fixe, pas de rotation ni zoom
            return;
          }
          if (state === "thinking") {
            gsap.to(".segments", {
              rotation: 360,
              duration: 2.4,
              ease: "none",
              repeat: -1,
              transformOrigin: "50% 50%",
            });
          }
          // ... autres états : transform/opacity uniquement
        },
      );
      // pas de « return () => mm.revert() » : useGSAP annule tout ce qui est créé dans son contexte, matchMedia compris
    },
    { scope, dependencies: [state], revertOnUpdate: true },
  );

  return (
    <svg ref={scope} data-flip-id="ring" aria-hidden="true">
      {/* ... */}
    </svg>
  );
}
```

**Niveau de voix (~30 valeurs/s)** : jamais dans un state React ni dans les `dependencies` d'un hook (sinon 30 rendus par seconde). On garde une **ref** et on anime avec **`gsap.quickTo`** :

```tsx
const segments = useRef<SVGGElement>(null);

useGSAP(
  () => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const setScale = gsap.quickTo(segments.current, "scale", {
        duration: 0.12,
        ease: "power2.out",
      });
      return subscribeLevel((level) => setScale(1 + level * 0.15)); // renvoie « se désabonner », appelé au nettoyage
    });
  },
  { scope },
); // pas de dépendance au niveau
```

En reduced motion, on ne crée pas de `quickTo` : l'anneau reste fixe.

**Fin de l'intro : Flip** (l'anneau de l'intro se pose à la place de l'anneau principal) :

```tsx
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, Flip);

// dans MainScreen (qui rend l'intro ET l'anneau principal)
const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);
const { contextSafe } = useGSAP({ scope });

const finishIntro = contextSafe(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  flipState.current = reduce ? null : Flip.getState('[data-flip-id="ring"]'); // AVANT le setState
  setIntroDone(true);
});

useGSAP(
  () => {
    if (!introDone || !flipState.current) return; // pas de Flip en reduced motion
    Flip.from(flipState.current, {
      targets: '[data-flip-id="ring"]',
      duration: 0.6,
      ease: "power2.inOut",
    });
    flipState.current = null;
  },
  { scope, dependencies: [introDone] },
);
```

- `Flip.getState` dans un handler `contextSafe`, **avant** `setState` ; `Flip.from` dans `useGSAP`, après le rendu.
- L'anneau de l'intro (`IntroRing`) et l'anneau principal (`VoiceRing`) portent le **même `data-flip-id`**.
- Pas de Flip en reduced motion (simple fondu).

Autres règles :

- Toujours `useGSAP` (nettoyage automatique) ; animations créées dans des handlers → `contextSafe`.
- **Aucun `style={…}` rendu au serveur** : les valeurs qui bougent sont posées par GSAP après le montage (voir 2.0 et annexe sécurité).
- **Fenêtre cachée** : le navigateur suspend déjà `requestAnimationFrame` (donc GSAP et le Canvas). Pas de code en plus pour ça ; on arrête seulement le **générateur d'amplitude simulée** quand on n'est ni en écoute ni en parole.
- **Au repos, le minimum** : seulement la respiration lente (une tween, transform/opacity) ; pas de `requestAnimationFrame` pour le Canvas en `idle`.
- Mesurer : **INP** (onglet Performance, ou Web Vitals dans les DevTools) et **tâches longues** au repos (voir étape 23).

### 3.5 Accessibilité (obligatoire)

- **Clavier complet** : tout est atteignable et utilisable au clavier, ordre logique ; lien d'évitement « Aller à la saisie ».
- **Focus visible** partout (contour blanc nacré #ECEAE4 plein, 2 px, décalage 2 px), jamais masqué.
- **aria-live="polite"** : un seul annonceur pour l'état de l'assistant et les états des cartes d'action ; la sortie d'une action en `role="log"`.
- **Taille de texte** : corps 16 px ; **tout texte porteur d'info ≥ 14 px** (statuts, heure du journal, niveau de risque) ; 12 px (`--text-dial`) seulement pour des libellés décoratifs ou répétés ailleurs.
- **Raccourcis** (WCAG 2.1.4) : toujours avec un modificateur, réglables ; le bouton micro reste le moyen garanti.
- **Contrôles indisponibles** (hors ligne, attente de signature) : `aria-disabled` + raison écrite, plutôt que de les retirer du parcours clavier.
- **Cibles 44 × 44 px** minimum (micro, Envoyer, Passer, Exécuter, Signer et exécuter, Annuler, Réessayer, Copier, onglets, bouton panneau, bouton réveil).
- **Contrastes** : 4,5:1 pour le texte, 3:1 pour les contrôles et le focus (voir 3.2).
- **Lecteurs d'écran** : anneau décoratif en `aria-hidden` (l'état est dit par le libellé) ; texte de l'intro donné en entier (pas lettre par lettre) ; boutons-icônes avec nom accessible ; commande lisible en entier ; tester avec **VoiceOver** (Cmd+F5) sur Safari et Chrome.
- **Jamais l'information par la couleur seule** : chaque état = texte + icône (+ couleur en bonus).
- **Reduced motion** (`prefers-reduced-motion: reduce`) : anneau complet et fixe en fondu 300 ms (pas de tracé `stroke-dashoffset`) ; pas de rotation, de zoom, de lettre par lettre, d'onde animée (onde remplacée par une barre de niveau statique ou un libellé) ; scanlines inchangées (statiques).
- **WCAG 2.3.1** : max 3 flashs par seconde ; aucune animation de luminance brusque.
- **Langue** : `<html lang="fr">`.
- **Intro** : ne bloque jamais la saisie ; bouton « Passer » focusable ; Échap / clic / frappe la saute.
- **Carte risquée** : focus sur Annuler, Entrée ne lance rien, pas de validation vocale.
- **Écoute** : « Micro actif » du header = seul `role="status"` ; rappel du bas et ligne « Coupure auto après 15 s de silence » en `aria-hidden` (voir 2.2 « État écoute »).

### 3.6 Typographie (DA v3, validée)

Deux familles : **IBM Plex Sans** et **IBM Plex Mono**, **auto-hébergées** (la CSP n'autorise que `font-src 'self'` : aucune requête vers Google).

| Rôle                                   | Police               | Casse                        | Tracking                       |
| -------------------------------------- | -------------------- | ---------------------------- | ------------------------------ |
| Titre **JARVIS** (wordmark)            | Plex Sans **600**    | capitales                    | `--tracking-wordmark` (0.32em) |
| Titres de section                      | Plex Sans **600**    | capitales                    | `--tracking-title` (0.16em)    |
| Labels, statuts, boutons               | Plex Sans **500**    | capitales                    | `--tracking-label` (0.12em)    |
| Corps                                  | Plex Sans **400**    | normale                      | aucun                          |
| Carte de signature, commandes, chemins | Plex Mono **400**    | **pas de capitales forcées** | **aucun**                      |
| Label du cadran (classe `.dial`)       | Plex Mono, **12 px** | capitales                    | `--tracking-dial` (0.18em)     |

Règles :

- Les **capitales viennent toujours de CSS** (`text-transform: uppercase`). Le HTML garde la casse normale.
- **Mono sans tracking ni capitales forcées** : pour bien distinguer `l` / `1` et `O` / `0` dans une commande, un chemin ou le payload signé.
- **`.dial`** : décoratif, toujours `aria-hidden="true"`, et **exclu de la règle Mono** (c'est la seule exception).
- Taille minimale 14 px pour tout texte porteur d'info (voir 3.5) ; seul `.dial` descend à 12 px.

### 3.7 Marque : logo et icônes (DA v3, validée)

- **Un seul manifest** : `app/manifest.ts` (pas de `public/manifest.webmanifest`).
- **Logo** : composant `components/ui/JarvisMark.tsx`, avec **`useId`** pour les ids du masque et des dégradés. Source : `public/assets/jarvis-mark.svg` (chemin via `@/lib/assets`).
- **Exports PNG** faits **une seule fois**, sans script ni dépendance.
- **Fichiers** : `app/apple-icon.png`, `app/favicon.ico` (remplace celui de Next), `app/icon.svg`, `public/assets/jarvis-mark.svg`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`. Chemins app via `@/lib/assets`.
- **Règles SVG** : voir annexe 6, point 11.

---

## 4) Découpage en étapes (un commit par étape)

Rappel : **DevinChat commit et push lui-même**. L'équipe relit : **PIXEL** (front), **SKETCH** (visuel), **THE JUDGE** (revue). « Vert » = `pnpm check` sans erreur (lint + typecheck, et les tests à partir de l'étape 5). Chaque étape qui ajoute un composant visible **ajoute aussi son bloc dans `/dev/states`**.

| #   | Étape                                                                                                                                                                                                                                                                                                                               | Commit proposé                                                                                           | Fini quand…                                                                                                                                                                                                                                                                                                                                                                                                                             | Relecture                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | ✅ **Init — faite** : `create-next-app` dans un dossier temporaire en minuscules, puis déplacement dans `wake-up-JARVIS/` en gardant `.git` (1.3) ; TS durci (1.4) ; Prettier + `eslint-config-prettier` ; Husky + lint-staged ; scripts (1.6) ; Cache Components coupé ; page par défaut nettoyée ; `lang="fr"`                    | `chore: init Next.js 16 app (TS strict, Tailwind v4, ESLint, App Router)`                                | `pnpm dev` affiche une page vide « JARVIS » ; `pnpm lint`, `pnpm typecheck`, `pnpm build` verts ; **un seul commit**                                                                                                                                                                                                                                                                                                                    | PIXEL                                       |
| 2   | **Tokens + polices + squelette `/dev/states`** : `@theme` (3.1, dont les tokens `--tracking-*`), IBM Plex via `next/font/google` (rôles typo 3.6), focus visible, calque scanlines/grain statique ; `app/dev/states/page.tsx` avec un premier bloc « Tokens » ; règles ESLint `no-explicit-any` / `no-danger` si absentes           | `feat(theme): add design tokens, IBM Plex fonts and states gallery skeleton`                             | Le bloc « Tokens » montre couleurs, rayons, typo ; `curl -s localhost:3000 \| grep -c fonts.googleapis` affiche `0` ; `w-touch` fait bien 44 px ; contrastes du tableau 3.2 vérifiés ; grain et scanlines réglés à l'œil sur capture (≤ 4 %) ; après `pnpm build && pnpm start`, `/dev/states` renvoie 404 ; un `any` volontaire fait échouer le lint                                                                                   | SKETCH, PIXEL                               |
| 3   | **Layout** : `app/page.tsx` (serveur) rend `MainScreen` (squelette client) ; `AppShell`, `AppHeader` (avec `WakeWordIndicator` simulé), `SidePanel` (vide, repliable), lien d'évitement                                                                                                                                             | `feat(layout): add app shell with header and collapsible side panel`                                     | Tab parcourt header → contenu → panneau ; `aria-expanded` change ; « Réveil actif » / « Réveil coupé » bascule au clavier ; aucun `style={}` dans le HTML ; capture à 1440 px et 1024 px                                                                                                                                                                                                                                                | PIXEL, SKETCH                               |
| 4   | **Sécurité : CSP + en-têtes** (annexe 6) : `proxy.ts` (CSP à nonce, seul endroit de la CSP), `RootLayout` async avec `await connection()`, `headers()` de `next.config.ts` (nosniff, Referrer-Policy, Permissions-Policy) ; installation de Playwright + `e2e/csp.spec.ts`                                                          | `feat(security): add nonce-based CSP and security headers`                                               | `pnpm build` affiche `ƒ /` (rendu dynamique) ; `e2e/csp.spec.ts` (Chromium + WebKit, sur `pnpm build && pnpm start`) écoute la console : **0 erreur CSP** sur `/` ; les `<script>` portent le nonce ; en-têtes visibles dans l'onglet Réseau ; app identique                                                                                                                                                                            | THE JUDGE, HACKER                           |
| 5   | **Domaine A — Vitest, machine, salut** : **d'abord `brew upgrade node`** sur le Mac (Node 25.5.0, voir 1.2), puis installation de Vitest (1.7), `vitest.setup.ts`, scripts `test`, `lib/assistant/machine.ts`, `lib/greeting.ts`                                                                                                    | `feat(core): add assistant state machine and greeting`                                                   | `pnpm test` : chaque transition de 2.3 testée (≥ 1 test par transition) ; salut testé à 4 h 59, 5 h, 17 h 59 et 18 h ; `pnpm check` lance les tests                                                                                                                                                                                                                                                                                     | THE JUDGE                                   |
| 6   | **Domaine B — risque et cycle de vie** : `lib/actions/risk.ts`, `lib/actions/lifecycle.ts`                                                                                                                                                                                                                                          | `feat(core): add action risk levels and card lifecycle`                                                  | Règles du tableau des niveaux testées (focus initial, Entrée, signature) ; toutes les transitions de carte testées, dont refus de signature → `pending` et expiration                                                                                                                                                                                                                                                                   | THE JUDGE (+ HACKER pour les règles)        |
| 7   | **Domaine C — Zod, ports, adapters, providers, ESLint** : `lib/schemas.ts`, `ports/*`, `fixtures/`, `adapters/mock/*`, `app/providers.tsx`, `app/ports-context.tsx`, règle `no-restricted-imports` (1.5)                                                                                                                            | `feat(core): add zod schemas, ports and mock adapters`                                                   | Fixtures validées par Zod (test) ; une donnée invalide est rejetée (test) ; importer `@/adapters/mock` depuis une feature fait échouer `pnpm lint`, mais pas depuis `app/providers.tsx` ni depuis un test                                                                                                                                                                                                                               | THE JUDGE, PIXEL                            |
| 8   | **Anneau statique** : `VoiceRing` en SVG (anneau + arcs + cadran), `RingStatusLabel`                                                                                                                                                                                                                                                | `feat(voice-ring): add static SVG ring`                                                                  | Anneau net à 160 px et 40 px ; `aria-hidden` ; libellé « Prêt » + icône ; bloc `/dev/states` ; capture validée                                                                                                                                                                                                                                                                                                                          | SKETCH                                      |
| 9   | **États de l'anneau** : installation de GSAP ; idle / listening / thinking / speaking / error / offline avec `useGSAP` + `matchMedia` ; niveau de voix via ref + `quickTo` (3.4)                                                                                                                                                    | `feat(voice-ring): animate ring states with reduced-motion support`                                      | Chaque état a libellé + icône ; en reduced motion (DevTools → Rendering → émuler) aucune rotation ; seules `transform`/`opacity` animées (onglet Performance) ; le niveau (~30/s) ne provoque **aucun rendu React** (React DevTools → Profiler) ; un bloc `/dev/states` par état                                                                                                                                                        | SKETCH, PIXEL                               |
| 10  | **Onde de voix** : `VoiceWave` en Canvas 2D                                                                                                                                                                                                                                                                                         | `feat(voice-ring): add canvas voice wave`                                                                | L'onde suit le niveau en écoute et en parole ; en reduced motion, barre de niveau statique ou libellé ; canvas en `aria-hidden` ; pas de `requestAnimationFrame` en `idle` (onglet Performance)                                                                                                                                                                                                                                         | SKETCH, PIXEL                               |
| 11  | **Conversation** : `useAssistant()` branché dans `MainScreen` ; `Conversation`, `MessageItem`, `StreamingMessage`, données via `MemoryPort` / `LlmPort`                                                                                                                                                                             | `feat(conversation): render message list with streamed mock replies`                                     | Messages lisibles ≤ 68 caractères/ligne ; réponse en flux ; test Vitest de rendu d'un message ; texte rendu uniquement en texte ; `useAssistant()` appelé une seule fois                                                                                                                                                                                                                                                                | PIXEL                                       |
| 12  | **Saisie + voix simulée** : `Composer` auto-grandissant, `MicButton`, raccourci maintenu (Ctrl+Maj+Espace) / clic, transcription factice éditable, `SpeakControls` (couper, Échap), détection simulée du mot de réveil → `listening`                                                                                                | `feat(conversation): add composer with simulated voice input`                                            | Entrée envoie, Maj+Entrée = ligne ; transcription modifiable avant envoi ; Échap interrompt « Parle… » ; micro 60 px et Envoyer 44 px mesurés ; en écoute, « Micro actif » dans le header (`role="status"`) et en bas (`aria-hidden`), ligne « Coupure auto après 15 s de silence », « Couper le micro » visible ; test Vitest du hook de voix simulée ; **Ctrl+Maj+Espace testé sur le Mac de DevinChat** (résultat noté en section 7) | PIXEL                                       |
| 13  | **Préférences + réglages** : `features/settings/model/preferences.ts` (`localStorage` + Zod, lu par `useSyncExternalStore`), `SettingsDialog` (mode d'intro, raccourci « Changer » / « Revenir au défaut », réveil relié à `WakeWordIndicator`, voix coupée, « revoir l'intro »)                                                    | `feat(settings): add preferences and settings dialog`                                                    | Préférences invalides → défauts (test Zod) ; combinaison sans modificateur refusée (test) ; aucun avertissement d'hydratation dans la console ; dialogue utilisable au clavier (Échap ferme, le focus revient au bouton) ; bloc `/dev/states`                                                                                                                                                                                           | PIXEL                                       |
| 14  | **Intro complète** (~3,5 s) : point → anneau + arcs + scan (logo `JarvisMark`, 3.7) → « JARVIS » → salut (calculé après montage) → l'anneau se pose (Flip, `data-flip-id` commun)                                                                                                                                                   | `feat(intro): add first-launch intro sequence`                                                           | Vitest : `expect(tl.duration()).toBeCloseTo(3.5, 1)` ; texte complet lu par VoiceOver ; « intro vue » enregistrée ; pas de Flip en reduced motion ; **critère de revue** : aucun tween de luminance au-dessus de 3 Hz                                                                                                                                                                                                                   | SKETCH, PIXEL                               |
| 15  | **Intro courte / Passer / reduced motion** : 0,8 s ensuite, `SkipIntroButton` 44 px, Échap / clic / frappe, mode « aucune » lu dans les préférences                                                                                                                                                                                 | `feat(intro): add short intro, skip controls and reduced motion`                                         | Une lettre tapée pendant l'intro arrive dans le champ ; Échap saute ; reduced motion = fondu 300 ms ; mode « aucune » n'affiche rien ; aucun script inline                                                                                                                                                                                                                                                                              | PIXEL, SKETCH                               |
| 16  | **Carte d'action — affichage** : `ActionCard`, `CommandBlock` + `CopyButton`, `RiskBadge`, `ActionButtons` ; tous les états affichés ; carte de signature avec le payload JCS v1 (2.2, annexe 6)                                                                                                                                    | `feat(actions): render inline action confirmation card`                                                  | `#action`, `#modif`, `#risque` produisent la bonne carte ; commande affichée = `proposal.command` (test) ; risque en texte + icône ; « Expire à HH:MM » affiché, sans compte à rebours ; 7 états × 3 niveaux dans `/dev/states` ; Copier marche au clavier ; payload JCS affiché en entier, sans troncature ; cas CRASH TEST (`U+202E`, `U+200B`, `U+007F`, `U+0085`) rendus en cases (test)                                            | PIXEL, SKETCH                               |
| 17  | **Carte d'action — exécution, focus, signature, expiration** : `ActionOutput` (`role="log"`), branchement `ActionPort`, focus initial, Entrée, signature simulée, expiration 120 s                                                                                                                                                  | `feat(actions): add execution, signature and expiry to action card`                                      | Niveau ≥ 2 : focus sur Annuler et Entrée ne lance rien (test) ; pendant l'attente seul Annuler est actif ; refus → `pending` + « Signature non faite, rien n'a été lancé » (test) ; code de sortie affiché en échec ; expiration testée avec de faux timers ; chaque état annoncé en `aria-live`                                                                                                                                        | PIXEL, THE JUDGE (+ HACKER pour les règles) |
| 18  | **Journal** : `JournalPanel`, `JournalEntry` (sortie dépliable, `CopyButton` réutilisé), `StatusFilter`                                                                                                                                                                                                                             | `feat(journal): add action journal with status filter`                                                   | Filtre réduit la liste (test) ; statut = texte + icône ; heure et durée affichées ; copier fonctionne au clavier                                                                                                                                                                                                                                                                                                                        | PIXEL                                       |
| 19  | **Panneau mails** : `MailPanel`, `MailItem`, états chargement / vide / erreur                                                                                                                                                                                                                                                       | `feat(mail): add read-only mail panel with mock data`                                                    | Expéditeur, objet, extrait visibles ; un mail factice contenant `<script>` s'affiche en texte brut (test)                                                                                                                                                                                                                                                                                                                               | PIXEL                                       |
| 20  | **Hors ligne / erreur** : hook `useOnlineStatus` (`online`/`offline`), état `error` + « Réessayer »                                                                                                                                                                                                                                 | `feat(assistant): handle offline and error states`                                                       | Couper le réseau (DevTools) → « Hors ligne » sous l'anneau et dans le header ; brouillon gardé et modifiable ; Envoyer/Micro en `aria-disabled` avec « Hors ligne, l'envoi revient avec la connexion » ; au retour, **une seule** annonce « De nouveau en ligne » ; `#erreur` → « Erreur », ligne de cause dans la conversation, texte tapé conservé, focus sur « Réessayer » (44 px), qui ramène à « Prêt »                            | PIXEL                                       |
| 21  | **PWA installable** : `app/manifest.ts` (`id: "/"`, `lang: "fr"`, `theme_color`/`background_color` `#0B0B0C`), icônes 192 et 512 (`purpose: "any"`), **icône maskable 512 distincte** (`purpose: "maskable"`), `app/apple-icon.png` 180 px, `app/icon.svg`, `app/favicon.ico` (remplace celui de Next) ; fichiers et chemins en 3.7 | `feat(pwa): add web app manifest and icons`                                                              | Chrome : DevTools → Application → Manifest **sans erreur**, puis « Installer » ouvre une fenêtre JARVIS ; Safari macOS : « Ajouter au Dock » essayé et résultat noté en section 7 (non vérifié)                                                                                                                                                                                                                                         | PIXEL                                       |
| 22  | **Tests E2E + a11y** : d'abord installer `@axe-core/playwright` (Playwright est là depuis l'étape 4), puis specs intro / conversation / carte / clavier (liste de touches ci-dessous), axe sur `/` et `/dev/states`, captures                                                                                                       | `test: add e2e and axe accessibility checks`                                                             | `pnpm e2e` vert sur Chromium et WebKit ; axe : 0 violation « serious » / « critical » ; chaque touche de la liste a son test ; tous les blocs attendus présents dans `/dev/states`                                                                                                                                                                                                                                                      | THE JUDGE                                   |
| 23  | **Perf** : repos minimal, mesures                                                                                                                                                                                                                                                                                                   | `perf: minimize idle work`                                                                               | INP < 200 ms sur envoi de message et clic micro ; enregistrement Performance de 10 s au repos : aucune tâche longue (> 50 ms) et seule la respiration est animée ; générateur d'amplitude arrêté hors écoute/parole                                                                                                                                                                                                                     | PIXEL                                       |
| 24  | **Preview Vercel** _(optionnel, seulement avec le oui de DevinChat)_                                                                                                                                                                                                                                                                | `chore(deploy): add Vercel preview configuration` (seulement si un fichier change ; sinon pas de commit) | URL de preview qui charge ; `/dev/states` visible en preview, 404 en production ; aucune variable secrète utilisée                                                                                                                                                                                                                                                                                                                      | DevinChat                                   |

**Total : 24 étapes** (23 + 1 optionnelle). L'étape 1 est faite.

> Ordre : init → tokens/polices + squelette `/dev/states` → layout → **CSP** → domaine (3 étapes) → anneau statique → états de l'anneau → onde → conversation → saisie + voix simulée → préférences + réglages → intro complète → intro courte/Passer/reduced motion → carte (affichage, puis exécution) → journal → mails → hors ligne/erreur → PWA → E2E + a11y → perf → déploiement preview.
> La CSP arrive tôt (étape 4) pour que chaque étape suivante soit construite sous la CSP de production. Vitest arrive à l'étape 5 pour que chaque étape ait un « Fini quand » testable ; l'étape 22 ajoute axe et les specs complètes.

**Touches testées à l'étape 22** (`e2e/keyboard.spec.ts`, plus les specs intro / carte) :

- **Tab / Maj+Tab** : lien d'évitement → header (réveil, panneau, réglages) → conversation → champ → micro → Envoyer → panneau (onglets) ; ordre vérifié, focus visible à chaque arrêt.
- **Entrée** dans le champ : envoie ; **Maj+Entrée** : nouvelle ligne.
- **Échap** : saute l'intro ; interrompt « Parle… » ; ferme `SettingsDialog` (le focus revient au bouton).
- **Une lettre** tapée pendant l'intro : arrive dans le champ.
- **Ctrl+Maj+Espace** maintenu : « Écoute… » ; relâché : retour à « Prêt » (`event.repeat` ignoré).
- **Espace / Entrée** sur le bouton micro : bascule l'écoute (`aria-pressed`).
- **Flèche gauche / droite** sur les onglets Journal / Mails : change d'onglet.
- **Entrée** sur une carte de niveau 2 ou 3 juste après son apparition : rien ne se lance (focus sur Annuler) ; **Entrée** sur une carte de niveau 1 : lance.

> Correspondance avec la numérotation relue par PIXEL : 1→1, 2→2, 3→3, 19→4, 4a/4b/4c→5/6/7, 5→8, 6→9 et 10, 7→11, 8→12, 9→14, 10→13 et 15, 11a/11b→16/17, 12→18, 13→19, 14→20, 15→21, 16→réparti (squelette à l'étape 2, un bloc par étape), 17→22, 18→23, 20→24.

---

## 5) Après l'UI — feuille de route

- **V0b — Branchement réel (avant tout terminal)** : adapters Supabase (auth + messages), LLM réel, voix réelle (micro + Web Audio pour l'amplitude, synthèse vocale) ; on ne change que `providers.tsx` et on ajoute `adapters/*`.
- **V1 — Agent macOS lecture seule** ([ADR 0006](./docs/adr/0006-execution-terminal.md)) : agent **Tauri v2** (LaunchAgent) sur le Mac, file d'ordres via Supabase, **ordres signés** ; seulement des commandes de niveau 1.
- **V2 — Actions** : exécution après clic + signature **Touch ID ou mot de passe du Mac** (WebAuthn), multi-Mac, **arrêt d'urgence**.
- **V3 — « Wake up, JARVIS »** ([ADR 0007](./docs/adr/0007-mot-de-reveil.md)) : mot de réveil **openWakeWord** en local dans l'agent (Porcupine n'a plus d'offre gratuite depuis le 30/06/2026), `caffeinate -u` pour allumer l'écran, déverrouillage **par mot de passe ou Touch ID, jamais par la voix** ; reconnaissance vocale locale ; **mémoire Supabase + pgvector**.
- **V4 — Gmail** : lecture + brouillons (jamais d'envoi automatique).
- **V5 — Voix premium + mode cinéma 3D** (Three.js, optionnel).

> **HACKER relit toute phase qui touche au terminal** (V1, V2, V3), avec les conditions **C1 : ordres signés** et **C2 : confirmation signée**.

---

## 6) Annexe — sécurité déjà dans l'UI

1. **CSP stricte à nonce** (étape 4). Deux options documentées par Next.js :
   - **Nonce via `proxy.ts`** (retenu) : `script-src 'self' 'nonce-…' 'strict-dynamic'` ; impose le **rendu dynamique** et est **incompatible avec PPR/Cache Components** (d'où `--no-cache-components`). `proxy.ts` tourne sur Node, sans `export const runtime`.
   - Sans nonce, via `headers()` dans `next.config.ts` : plus simple mais demande `'unsafe-inline'` pour les scripts → **moins strict**.
   - Choix proposé : **nonce via `proxy.ts`** (l'app est petite, perso, et le coût du rendu dynamique est négligeable). À valider par HACKER.
   - **Piège testé par PIXEL** : avec `proxy.ts` seul, `/` reste **statique** (`○ /` au build) : la page est générée sans nonce et les scripts sont bloqués en production. Correctif dans `app/layout.tsx` :

     ```tsx
     import { connection } from "next/server";

     export default async function RootLayout({ children }: LayoutProps<"/">) {
       await connection(); // force le rendu à la requête : la page passe en « ƒ / » et reçoit le nonce
       return (
         <html
           lang="fr"
           className={`${plexSans.variable} ${plexMono.variable}`}
         >
           <body>{children}</body>
         </html>
       );
     }
     ```

   - **Politique en production** : `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'nonce-…'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`.
   - **En développement seulement** : `script-src` ajoute `'unsafe-eval'` (React en dev) et `style-src` devient `'self' 'unsafe-inline'` (outils de dev de Next). Jamais en production.
   - **Règle `style`** : `style-src 'nonce-…'` bloque **tout attribut `style=`** rendu au serveur. Donc aucun `style={…}` dans le HTML serveur : classes Tailwind, ou GSAP après le montage (GSAP écrit via `element.style`, ce qui passe — vérifié par PIXEL).
   - **La CSP est uniquement dans `proxy.ts`** (pas en double dans `next.config.ts`).

   Esquisse de `proxy.ts` (à la racine, à côté de `app/`) :

   ```ts
   import { NextResponse, type NextRequest } from "next/server";

   export function proxy(request: NextRequest) {
     const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
     const isDev = process.env.NODE_ENV === "development";
     const csp = [
       "default-src 'self'",
       `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
       isDev
         ? "style-src 'self' 'unsafe-inline'"
         : `style-src 'self' 'nonce-${nonce}'`,
       "img-src 'self' blob: data:",
       "font-src 'self'",
       "connect-src 'self'",
       "object-src 'none'",
       "base-uri 'self'",
       "form-action 'self'",
       "frame-ancestors 'none'",
       "upgrade-insecure-requests",
     ].join("; ");

     const requestHeaders = new Headers(request.headers);
     requestHeaders.set("x-nonce", nonce);
     requestHeaders.set("Content-Security-Policy", csp);
     const response = NextResponse.next({
       request: { headers: requestHeaders },
     });
     response.headers.set("Content-Security-Policy", csp);
     return response;
   }

   export const config = {
     matcher: [
       {
         source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
         missing: [
           { type: "header", key: "next-router-prefetch" },
           { type: "header", key: "purpose", value: "prefetch" },
         ],
       },
     ],
   };
   ```

2. **Aucun script tiers** : pas d'analytics, pas de CDN, pas de widget. Polices auto-hébergées par `next/font` (vérifié à l'étape 2 : `curl -s localhost:3000 | grep -c fonts.googleapis` = 0).
3. **Pas de `dangerouslySetInnerHTML`** (règle ESLint `react/no-danger` en erreur).
4. **Tout contenu externe affiché en texte** : réponses du LLM, sorties de commandes, mails (expéditeur, objet, extrait) → toujours rendus comme texte React, jamais en HTML ni en Markdown interprété. Si un jour on veut du Markdown : rendu sans HTML brut, liens `rel="noopener noreferrer"`, revue HACKER.
5. **Validation Zod** de tout ce qui sort des adapters et de `localStorage`.
6. **La carte d'action montre la commande résolue exacte**, jamais un résumé ; l'explication est séparée et étiquetée.
7. **Jamais de confirmation vocale** pour une action de niveau ≥ 2 ; la signature (simulée ici) sera Touch ID ou mot de passe du Mac sur la **commande exacte** (ADR 0006). **Jamais de déverrouillage du Mac par la voix** (ADR 0007).
8. **Autres en-têtes**, dans `headers()` de `next.config.ts` (pas dans `proxy.ts`) : `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), geolocation=(), microphone=(self)` (micro réservé pour V0b ; on peut mettre `microphone=()` pendant la phase UI). `frame-ancestors 'none'` est dans la CSP.
9. **Aucun secret** dans le dépôt public, aucun fichier `.env` commité (le `.gitignore` de Next ignore déjà `.env*`).
10. **Payload signé v1** (pour les phases terminal ; affiché dès la phase UI dans la carte de signature, avec des données fictives) :
    - Format : **JCS (RFC 8785)** — clés triées, sans espace.
    - Champs : `v` (version, `1`), `order_id`, `machine_id`, `action`, `params`, `argv` (**tableau**, exécutable en **chemin absolu**), `cwd` (**chemin absolu**), `nonce` (**≥ 128 bits**, **22 caractères base64url**), `expires_at`.
    - Le **serveur** résout `argv` et `cwd` depuis le **catalogue** d'actions.
    - L'**agent** recalcule tout et **refuse** au moindre octet différent, ou si `v` est inconnu.
    - Les **lectures** (ex. `git.status`, niveau 1) ne passent **jamais** par la signature.
    - Exemple fictif (`git.push`) :

      ```json
      {
        "action": "git.push",
        "argv": ["/usr/bin/git", "push", "origin", "main"],
        "cwd": "/Users/demo/projects/wake-up-jarvis",
        "expires_at": "2026-11-01T00:52:00Z",
        "machine_id": "mac-01",
        "nonce": "Xk3vQ9pL2mT7wR4yZ8nB1c",
        "order_id": "ord_0001",
        "params": { "branch": "main", "remote": "origin" },
        "v": 1
      }
      ```

    - Affichage dans la carte : voir 2.2 « Carte de signature : affichage du payload ».
11. **Règles SVG (HACKER)** — logo, icônes et tout SVG du projet : **aucun script**, **aucun attribut `on*`**, **pas de `style=`**, **pas de liens**, **pas de `data:`**.

---

## 7) Points non vérifiés et choix faits

**Vérifié en ligne le 01/11/2026** : flags de `create-next-app` (doc Next.js), défauts (TypeScript, ESLint, Tailwind, App Router, Turbopack, Cache Components, AGENTS.md), guide PWA Next.js (`app/manifest.ts`, install sans hors ligne, Serwist cité pour le hors ligne), guide Vitest Next.js, installation Playwright (`pnpm create playwright`), GSAP gratuit avec plugins (doc installation), `useGSAP` (doc React GSAP), doc TypeScript Next (TS 7, `next typegen`), guide CSP Next (nonce, `proxy.ts`, incompatibilité PPR), namespaces de thème Tailwind v4, versions npm du jour.

**Vérifié par PIXEL (tests dans un projet de travail, 01/11/2026) :**

- Versions : `next` / `create-next-app` 16.4.3, `tailwindcss` 4.3.3, `gsap` 3.15.0, `@gsap/react` 2.1.2, `zod` 4.6.7, `vitest` 5.0.5, Playwright 1.64.1, axe 4.14.0.
- Flags `--no-cache-components`, `--no-react-compiler`, `--disable-git`, `--use-pnpm` ; `--turbopack` n'existe pas en 16.4.3.
- `proxy.ts` tourne sur Node sans `export const runtime` ; `'strict-dynamic'` ; `'unsafe-eval'` en dev seulement.
- CSP à nonce : sans `await connection()` dans le layout, `/` reste statique et les scripts sont bloqués ; avec, `ƒ /` et plus d'erreur.
- `style-src 'nonce-…'` bloque les attributs `style=` rendus au serveur ; GSAP via `element.style` passe.
- `next/font` auto-hébergé (aucune requête vers Google).
- `--spacing-touch: 44px` génère bien `w-touch` / `h-touch`.
- Vitest 5 : `resolve: { tsconfigPaths: true }` remplace `vite-tsconfig-paths`.

**Points ouverts :**

- Règles des actions (niveaux, focus, signature) et CSP : **à valider par HACKER**.

**Non vérifié / à vérifier sur la machine de DevinChat :**

- **WebKit réel** (Safari macOS) : CSP à nonce et « Ajouter au Dock ». Le WebKit de Playwright n'est pas Safari ; à essayer à la main (étapes 4 et 21).
- **Invite d'installation de Chrome sans service worker** : la doc Next le dit, à confirmer à l'étape 21.
- **pnpm 12** : comportement exact de `pnpm create next-app@latest` et de `pnpm create playwright` (la doc montre `pnpm create next-app` sans `@latest`).
- **Conflit Ctrl+Espace sur macOS** (raison du choix de Ctrl+Maj+Espace) : non retesté par PIXEL.
- **Version de Node après `brew upgrade node`** (à noter ici ; doit être ≥ 24.15 ou ≥ 26 avant que Vitest tourne).
- **CRASH TEST sur l'app réelle** : les 4 cas (`U+202E`, `U+200B`, `U+007F`, `U+0085`) ont été vérifiés hors maquette ; la preuve dans l'app reste à faire (étape 16).
- **Ctrl+Maj+Espace** : à tester sur le Mac de DevinChat à l'étape 12 (raccourci réglable de toute façon ; bouton micro garanti).
- Si **IBM Plex Sans** est servie en police variable par `next/font/google` (on fixe les `weight` pour que ça marche dans les deux cas).
- Seuil INP < 200 ms : valeur « bonne » des Web Vitals, à mesurer sur le Mac à l'étape 23. Pas de seuil CPU chiffré (retiré : pas de mesure fiable et reproductible).

**Validé :**

- Direction artistique, tokens, contrastes, durées, rayons, espacements, lueurs, verre 85 %, scanlines ≤ 4 %, exception `stroke-dashoffset` : **validés par SKETCH le 01/11/2026** (grain/scanlines à régler à l'œil à l'étape 2).
- **DA v3 « blanc nacré » validée par DevinChat le 01/11/2026** : fond `#0B0B0C`, accent `#ECEAE4`, ambre `#F5B84A` réservé à la signature Touch ID, « JARVIS réfléchit » = indicateur nacré qui tourne. Typographie (3.6), état écoute (2.2), carte de signature (2.2), marque (3.7).

**Choix faits :**

- **Node** : `brew upgrade node` sur le Mac (25.5.0) avant que Vitest tourne (étape 5).
- **Payload signé v1 en JCS** (annexe 6, point 10) ; les lectures ne passent jamais par la signature.
- **Un seul manifest** (`app/manifest.ts`) ; logo en composant `JarvisMark.tsx` avec `useId` ; exports PNG faits une fois, sans script ni dépendance.
- **Cible macOS uniquement** (ADR 0005) : raccourci par défaut Ctrl+Maj+Espace, signature Touch ID ou mot de passe du Mac.
- **ESLint + Prettier** plutôt que Biome (garde-fous d'import et `no-danger`) ; Husky + lint-staged au commit.
- **PWA = `app/manifest.ts` natif**, pas de Serwist ni de service worker dans la phase UI.
- **`--no-cache-components`**, **`--no-react-compiler`**, **`--disable-git`** (le dépôt existait déjà avec son `.git`), `--no-src-dir` ; pas de `--turbopack`.
- **Code à la racine, sans `src/`**, alias `@/*` → `./*`, `proxy.ts` à côté de `app/`.
- **TypeScript 5** (template) plutôt que TS 7 pour l'instant.
- **Pas de XState** : machine d'états en `switch` pur.
- **Un seul état d'assistant**, dans `MainScreen` (plutôt qu'un `AssistantProvider`) ; `app/page.tsx` reste serveur.
- **`"use client"` seulement aux points d'entrée** (voir 2.0).
- **`ports-context.tsx` déplacé dans `app/`** ; `ports/` ne contient que des interfaces.
- **Un seul dossier `fixtures/`**, à la racine.
- **CSP uniquement dans `proxy.ts`** ; les autres en-têtes dans `headers()` de `next.config.ts` ; CSP faite tôt (étape 4).
- **Amplitude simulée par une fonction mathématique** (sinus + bruit) dans le mock, pas par Web Audio (qui viendra en V0b) ; niveau animé par `quickTo`, jamais en state.
- **GSAP Flip** pour poser l'anneau à la fin de l'intro ; découpage des lettres à la main (pas SplitText) pour garder le texte complet accessible simplement.
- Durées d'animation dans `:root` + `lib/motion.ts` (Tailwind v4 n'a pas de namespace `--duration-*`).
- Niveaux 2 et 3 : « Signer et exécuter », focus Annuler, Entrée inerte, signature simulée ; refus → retour `pending` (règles à valider par HACKER).
- Les décisions structurantes sont dans [docs/adr/](./docs/adr/README.md) (ADR 0001 à 0007, statut « Proposé » ; 0002, 0003 et 0004 révisés le 2026-11-01 après relecture PIXEL).

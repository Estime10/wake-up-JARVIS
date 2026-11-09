# Plan — Shell macOS Tauri v2 pour E.L.S.A.

**Branche :** `feat/tauri`  
**Statut :** étapes 1–6 (packaging conf + crédits + DMG ; signing/notarize = compte Apple DevinChat) ; navigateur libre reporté ; suite = agent (7, gate HACKER)
**Prérequis prod web :** https://wake-up-jarvis.vercel.app (Next.js) — **reste la source de vérité UI**  
**Règles :** pas de push sans accord · pas de `Co-authored-by: Cursor` · aucun secret · pas de `child_process` / shell dans `lib/`, `adapters/`, `app/` · **revue HACKER obligatoire** avant agent terminal (ADR 0006)

---

## Pourquoi maintenant

1. L’app **tourne en prod Vercel** (auth, mail, GitHub, Studio web, mémoire).
2. Les limites **web** sont atteintes et documentées :
   - navigateur libre = iframe → pages blanches (anti-frame) — ADR **0013** ;
   - Studio = reverse-proxy local `:54332` — workaround Next ;
   - Piper / agent Mac / Touch ID = hors navigateur — ADR **0012**, **0005**, **0006**.
3. Checklist GO § Après le GO : **4. Tauri**.

**Ordre produit validé :** Vercel d’abord → **Tauri ensuite** (ce plan).

---

## Objectif

Livrer une **app macOS Apple Silicon** (Tauri **v2**) qui :

| Capacité                                                           | Remplace / complète                        |
| ------------------------------------------------------------------ | ------------------------------------------ |
| Fenêtre unique E.L.S.A.                                            | Safari / Chrome                            |
| WebView **Studio** top-level                                       | iframe + proxy `:54332`                    |
| WebView **navigateur libre** top-level                             | (reporté — util `normalizeSideBrowserUrl`) |
| **Piper TTS local** (`127.0.0.1:5911` + bridge Tauri)              | proxy Next (dev only) / `speechSynthesis`  |
| Plus tard : **agent** lecture seule (file Supabase, ordres signés) | mock terminal UI                           |

La **logique métier Next** (routes API, Supabase, intents) **ne bouge pas** au début : le shell charge l’UI déjà déployée (ou le `next dev` local), puis on bascule les surfaces « natives » une par une.

---

## Piper en « prod » — clarifications (besoin DevinChat)

Le log actuel (`./scripts/run-piper.sh`) :

```
Piper écoute sur http://127.0.0.1:5911
* Serving Flask app 'http_server' · Debug mode: off
WARNING: This is a development server…
```

### Ce que « prod » veut dire ici

| Surface                                  | Piper tourne où ?                         | Comment l’UI parle                                                                                                                                                                                 |
| ---------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel** (`wake-up-jarvis.vercel.app`) | **Nulle part** sur le serveur Vercel      | Pas de `:5911` cloud. Proxy `POST /api/voice/piper` **off** en prod (sauf flag) — et même activé, il frapperait le loopback **Vercel**, pas le Mac. Repli = `speechSynthesis`.                     |
| **Shell Tauri (prod Mac)**               | **Sur le Mac**, loopback `127.0.0.1:5911` | UI (souvent chargée depuis l’URL Vercel) **ne fetch pas** `127.0.0.1` depuis une origine `https://` (bloqué / fragile). Chemin obligatoire : **front → `invoke` Tauri → Rust → HTTP Piper local**. |

**Invariant :** Piper reste **toujours local au Mac** (ADR 0012). La « prod voix » = **app desktop**, pas un WSGI sur Vercel.

### Décision retenue pour le plan (étape 5)

1. **Conserver le protocole HTTP** `http://127.0.0.1:5911` (aligné `PIPER_HTTP_URL`, scripts, schémas déjà en place) — DevinChat en a besoin.
2. **Tauri possède le cycle de vie** du process Piper :
   - spawn au démarrage de l’app (ou au premier `speak`) ;
   - healthcheck `GET`/`POST` loopback ;
   - kill propre à la fermeture.
3. **Remplacer le serveur de dev Flask** en usage shell par un serveur **WSGI de prod locale**, toujours borné à `127.0.0.1` (jamais `0.0.0.0`) :
   - candidat : **Waitress** (ou équivalent) devant `piper.http_server` / app WSGI Piper ;
   - script type `scripts/run-piper-prod.sh` + binaire/venv empaqueté sous `sidecars/piper/`.
4. **Bridge Rust** (allowlist) :
   - `voice_speak { text }` → POST loopback Piper → WAV → lecture (WebAudio via front **ou** playback natif) ;
   - `voice_stop` → abort ;
   - **pas** d’exposition du port 5911 au réseau LAN.
5. **Option B (plan voix étape 4)** sidecar stdin JSON **reste un plan B** si Waitress/HTTP s’avère trop lourd — même modèle `fr_FR-siwis-medium` + sha256. Ne pas implémenter les deux en parallèle sans besoin.

### Warnings observés (non bloquants V0)

| Message                         | Traitement                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `onnx` / `piper-tts[alignment]` | Optionnel (alignements). V0 : **ignorer** ou installer extras seulement si on affiche des timings phonème.        |
| `python-dotenv` / `.env`        | Optionnel. Ne pas exiger dotenv pour le sidecar.                                                                  |
| Flask « development server »    | **Interdit** comme process longue durée du `.app` → Waitress (ou sidecar JSON). OK pour `pnpm voice:piper` en DX. |

### DX vs shell

| Mode         | Commande                              | Serveur                                    |
| ------------ | ------------------------------------- | ------------------------------------------ |
| Dev web Next | `./scripts/run-piper.sh` + `next dev` | Flask Piper actuel (acceptable)            |
| Prod shell   | process géré par Tauri                | Waitress (ou sidecar) sur `127.0.0.1:5911` |

Amendement ADR **0012** à prévoir en étape 0/5 : « en shell Tauri, TTS via loopback géré par le runtime ; proxy Next reste **dev web only**. »

---

## Non-objectifs (V0 shell)

- Windows / Linux (ADR **0005** — macOS only).
- Agent terminal niveaux 2–3 / shell libre LLM (ADR **0006** — hors catalogue = refusé).
- Port HTTP ouvert sur le Mac pour piloter l’agent (interdit — pull file uniquement).
- Capabilities Tauri accordées à une **origine distante** arbitraire (CA-T5).
- Réécriture GraphQL / nouveau backend.

---

## Contexte repo aujourd’hui

| Élément          | État                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| UI / API         | Next.js 16 App Router · React 19 · prod Vercel `wake-up-jarvis`                              |
| Auth / mémoire   | Supabase · ADR 0008                                                                          |
| Studio + browser | `StudioBrowserSplit` + iframe · ADR 0013                                                     |
| Voix web         | Piper via proxy loopback (dev) + `speechSynthesis` · ADR 0012 · plan voix étapes 4–5 = Tauri |
| Terminal UI      | mock / surface home · exécution réelle = ADR 0006 (pas encore d’agent)                       |
| Shell Mac        | **absent** de ce dépôt                                                                       |
| ADR 0009         | numéro réservé capabilities — **fichier absent** ; à créer avant IPC large                   |

---

## Architecture cible (V0 → V1)

```
┌─────────────────────────────────────────────────────────────┐
│  App Tauri v2 (macOS, Apple Silicon)                        │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │ WebView principal   │  │ WebViews secondaires         │  │
│  │ = UI E.L.S.A.       │  │ (Studio · navigateur libre)  │  │
│  │ (souvent URL prod)  │  │ top-level, pas iframe        │  │
│  └─────────┬───────────┘  └──────────────▲───────────────┘  │
│            │ invoke voice_* / window_*    │ embed / navigate │
│  ┌─────────▼───────────┐  ┌──────────────┴───────────────┐  │
│  │ Rust core           │  │ Piper HTTP 127.0.0.1:5911    │  │
│  │ · spawn / health    │  │ Waitress (pas Flask debug)   │  │
│  │ · POST → WAV        │  │ modèle siwis + sha256        │  │
│  │ · LaunchAgent later │  │ (plan B : sidecar stdin JSON)│  │
│  └─────────┬───────────┘  └──────────────────────────────┘  │
└────────────┼────────────────────────────────────────────────┘
             │ (V1) lecture seule
             ▼
      File Supabase (ordres signés) — ADR 0006
```

### Décision d’hébergement UI (à figer en étape 0)

| Option               | Description                                        | Verdict provisoire                                         |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| **A. URL prod**      | WebView charge `https://wake-up-jarvis.vercel.app` | **Retenu pour V0** : un seul build UI, déjà GO             |
| **B. Static export** | `next export` / assets dans le bundle              | Reporté : App Router + API server incompatibles tels quels |
| **C. Next local**    | Shell ouvre `http://127.0.0.1:3000` en dev         | **Oui pour DX** (`tauri dev` + `next dev`)                 |

**Invariant sécu :** même en chargeant l’URL prod, **aucune** capability Rust sensible (`shell`, `fs` large, `http` générique) n’est exposée au front distant. Bridge = commandes Rust **nommées**, args Zod/serde, allowlist.

---

## Structure monorepo proposée

```
/
  app/ … features/ …          # Next (inchangé au début)
  src-tauri/                  # crate Tauri v2
    tauri.conf.json
    capabilities/             # allowlists par fenêtre
    src/lib.rs | main.rs
  sidecars/
    piper/                    # binaire / script lancé par Rust (pas par Next)
  docs/plans/PLAN-tauri-elsa.md
  docs/adr/0009-….md          # à créer (capabilities)
  docs/adr/0014-….md          # shell Tauri (nouveau)
```

Pas de second `package.json` npm pour l’UI : le front reste ce repo. Scripts racine :

- `pnpm tauri:dev` → Next + Tauri
- `pnpm tauri:build` → `.app` / `.dmg` Apple Silicon

---

## Étapes d’exécution

### Étape 0 — Cadre & baseline (doc + go)

1. Relire ADR **0005**, **0006**, **0012**, **0013** ; checklist GO.
2. Rédiger / faire valider :
   - `docs/adr/0014-shell-tauri-macos.md` (décision A URL prod + bridge allowlist) ;
   - `docs/adr/0009-…` **capabilities** (ou fusion dans 0014 si ARCHITECT tranche) — **bloquant** avant tout `invoke` non trivial.
3. Go **HACKER** sur le modèle de menaces V0 (WebView + URL distante + sidecar).
4. Baseline : `pnpm check` vert sur `main` / branche.

**Done when :** ADR 0014 (+ 0009) proposés · go DevinChat · baseline verte.  
**Commit :** `docs(tauri): ADR shell macOS et plan d’exécution.`

---

### Étape 1 — Scaffold Tauri v2 (fenêtre vide)

**Scope :** crate `src-tauri/`, fenêtre unique, charge `about:blank` ou page locale minimale.

- Tauri **2.x**, cible `aarch64-apple-darwin` uniquement.
- Capabilities **minimales** (core window + event).
- CI : job optionnel `tauri build` **macOS** (pas sur Linux CI actuel) — documenter ; ne pas casser le CI main-only existant.

**Done when :** `tauri build` produit une `.app` qui s’ouvre sur Mac Apple Silicon.  
**Commit :** `feat(tauri): scaffold app macOS Apple Silicon.`

---

### Étape 2 — Brancher l’UI E.L.S.A. (URL)

- Dev : WebView → `http://127.0.0.1:3000` (script compose `next dev` + `tauri dev`).
- Release : WebView → `https://wake-up-jarvis.vercel.app` (configurable via env build / `tauri.conf`).
- Deep-link / deep path : respecter `/login` → `/home` (comportement Next actuel).
- Cookies / auth Supabase : vérifier stockage WebView (ITP) ; documenter login dans le shell.

**Done when :** login + home utilisables **dans** la fenêtre Tauri (même parcours que le navigateur).  
**Commit :** `feat(tauri): charger l’UI E.L.S.A. dans le WebView principal.`

---

### Étape 3 — Feature detection + ports desktop

- Introduire `isTauri()` / `runtime = web | tauri` (sans casser le web).
- `createAppPorts()` : branche `createTauriVoice` (stub → étape 5), garder adapters web sinon.
- UI : flags pour masquer les hints « iframe » / activer chrome natif.

**Done when :** build web Vercel inchangé · shell détecte Tauri.  
**Commit :** `feat(tauri): runtime detection et branchement ports.`

---

### Étape 4 — WebViews Studio + navigateur libre

**Remplace** (dans le shell uniquement) :

- `SupabaseStudioBrowser` iframe + proxy `:54332` → **WebView** vers `http://127.0.0.1:54323` (ou URL Studio réelle) ;
- Recréer un chrome navigateur libre → **WebView** `elsa-browser` (réutiliser `normalizeSideBrowserUrl` ; navigation via commande Rust).

Layout : conserver le split 50/50 (chrome React) ; les surfaces média sont des WebViews enfants / labels Tauri positionnés — **spike UI** en sous-tâche (mesure bbox DOM → `set_position`).

**Interdit :** proxy open générique ; strip CSP arbitraire ; `shell.open` non borné.

**Done when :** CA-T3, CA-T4 · sites anti-frame navigables dans le WV libre.  
**Commit :** `feat(tauri): WebViews Studio et navigateur libre.`

---

### Étape 5 — Piper local prod (`127.0.0.1:5911` + bridge)

Voir section **« Piper en prod »** ci-dessus. Reprendre aussi le plan voix (étapes 4–5) pour normalisation / stop / repli.

**Livrables :**

1. `sidecars/piper/` (ou `scripts/run-piper-prod.sh`) : venv + modèle + **Waitress** sur `127.0.0.1:${PIPER_HTTP_PORT:-5911}` — **pas** le warning « development server ».
2. Rust : spawn / ready / `voice_speak` / `voice_stop` ; timeout ; never bind `0.0.0.0`.
3. Front Tauri : `createTauriVoice` → invoke (pas `fetch('http://127.0.0.1:5911')` depuis l’origine Vercel).
4. Modèle `fr_FR-siwis-medium` + **sha256** (sinon refus + repli `say` / `speechSynthesis`).
5. Amendement ADR **0012** (shell vs proxy Next).
6. Plan B documenté : sidecar stdin JSON si HTTP trop fragile.

**Interdit :** Piper sur Vercel ; ouvrir `:5911` sur le LAN ; laisser Flask debug comme process du `.app`.

**Done when :** CA-T6, CA-T8 · salut + réponses dans le shell · stop immédiat · Piper down → repli · `lsof` montre listen **uniquement** 127.0.0.1:5911.  
**Commit :** `feat(tauri): Piper HTTP local géré par le shell (5911).`

---

### Étape 6 — Packaging & distribution perso

- Signing Apple (Developer ID) + notarization — compte DevinChat ;
- DMG / install user-level ;
- Auto-update : **manuel V0** (pas de `tauri-plugin-updater`) ;
- `CREDITS.md` / `NOTICE` / page `/credits` (Piper GPL + SIWIS CC BY) ;
- Runbook : `docs/runbooks/PACKAGING-macos.md` · script `./scripts/package-elsa.sh`.

**Statut code :** conf `app`+`dmg`, entitlements hardened runtime, crédits UI — **fait**.  
**Reste ops :** installer le certificat Developer ID + notarier, puis installer le DMG sur un Mac ≠ build (Gatekeeper vert).

**Done when :** install sur le Mac de DevinChat hors machine de build (après notarization).  
**Commit :** `chore(tauri): packaging macOS et crédits.`

---

### Étape 7 — Agent lecture seule (V1) — **gate HACKER**

**Ne pas démarrer** sans revue ADR **0006** + menaces (clés, nonce, expiration, liaison Mac).

- LaunchAgent session user ;
- pull file Supabase ;
- catalogue niveau **1** uniquement ;
- C1 ordres signés ; pas de C2 encore si niveau 1 strict.

**Commit :** `feat(agent): LaunchAgent lecture seule (catalogue N1).`  
**Done when :** CA agent ADR 0006 (sous-ensemble N1) + CRASH TEST.

---

## Critères d’acceptation (shell)

| ID    | Critère                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| CA-T1 | `.app` Apple Silicon s’ouvre ; UI login/home via WebView.                                                                                   |
| CA-T2 | `pnpm build` / déploiement Vercel **non régressés**.                                                                                        |
| CA-T3 | Studio visible **sans** iframe proxy `:54332` dans le shell.                                                                                |
| CA-T4 | Navigateur libre charge un site qui refuse l’iframe web.                                                                                    |
| CA-T5 | Aucune capability Rust exposée à une origine distante non allowlistée.                                                                      |
| CA-T6 | Piper (ou repli documenté) pour le salut dans le shell.                                                                                     |
| CA-T7 | Pas de port d’écoute agent ; file pull uniquement (quand V1).                                                                               |
| CA-T8 | Piper prod shell écoute **seulement** `127.0.0.1:5911` (WSGI, pas Flask debug) ; bridge via `invoke`, pas fetch cross-origin depuis Vercel. |

---

## Sécurité — invariants

1. **Allowlist invoke** : chaque commande Rust = un type d’args + validation ; pas de `eval` / shell string.
2. **Navigation WebView** : schémas `http(s)` (+ `http://127.0.0.1` Studio) ; refus `file:`, `javascript:`, etc. (aligné normalizer web).
3. **Secrets** : toujours Vault / env serveur ; le shell ne lit pas `SUPABASE_SERVICE_ROLE`.
4. **Prod URL** : CSP / cookies ; pas d’injection de script native dans la page distante.
5. **ADR 0006** : confirmation vocale **jamais** pour action risquée.
6. Revue **HACKER** avant étapes 5 (bridge voix + process Piper) et **7** (agent).
7. **Piper** : bind loopback only ; pas de proxy Next en prod Vercel pour atteindre le Mac.

---

## Risques & mitigations

| Risque                               | Impact    | Mitigation                                              |
| ------------------------------------ | --------- | ------------------------------------------------------- |
| Auth Supabase cassée dans WKWebView  | 🔴 High   | Spike étape 2 ; fallback ouvrir login système si besoin |
| Positionnement multi-WebView fragile | 🟡 Medium | Spike bbox ; sinon fenêtre Studio séparée V0.1          |
| Bundle Piper (~60 Mo+)               | 🟡 Medium | Download au premier lancement / venv empaqueté          |
| Fetch `127.0.0.1` depuis UI https    | 🔴 High   | Interdit ; toujours `invoke` → Rust → loopback          |
| Flask debug laissé en prod shell     | 🟡 Medium | Waitress (ou sidecar JSON) obligatoire étape 5          |
| Confusion web vs desktop features    | 🟡 Medium | `runtime` explicite + tests ports                       |
| Scope creep agent terminal           | 🔴 High   | Gate étape 7 ; catalogue N1 only                        |

---

## Ordre d’exécution Cursor

```
0 (ADR + go) → 1 (scaffold) → 2 (URL UI) → 3 (runtime ports)
    → 4 (WebViews) → 5 (Piper) → 6 (packaging) → 7 (agent, gate HACKER)
```

**Prompt type :**

> Exécute uniquement l’étape N du plan `docs/plans/PLAN-tauri-elsa.md`. Ne touche pas aux étapes suivantes. Commit seulement si je le demande.

---

## Liens

- ADR 0005 cible macOS · 0006 terminal · 0012 voix · 0013 Studio/browser
- Plan voix : `docs/plans/PLAN-voix-piper-jarvis.md` (étapes 4–5)
- Prod web : https://wake-up-jarvis.vercel.app
- Checklist GO : `docs/CHECKLIST-GO-JARVIS.md` (§ Après le GO → Tauri)

---

## Suivi

| Étape      | Branche / commit | Statut                                                |
| ---------- | ---------------- | ----------------------------------------------------- |
| Plan       | `feat/tauri`     | **ce document**                                       |
| 0 ADR      | `feat/tauri`     | **fait** — ADR 0009 + 0014 (proposés)                 |
| 1 scaffold | `feat/tauri`     | **fait** — `src-tauri/` · `ELSA.app` aarch64          |
| 2 URL UI   | `feat/tauri`     | **fait** — dev `:3000` · prod Vercel                  |
| 3 runtime  | `feat/tauri`     | **fait** — `isTauri` / ports / `data-runtime`         |
| 4 WebViews | `feat/tauri`     | **fait** — Studio WV (browser libre reporté)          |
| 5 Piper    | `feat/tauri`     | **fait** — invoke + Waitress spawn + sha256 modèle    |
| 6 package  | `feat/tauri`     | **partiel** — DMG/crédits/runbook ; signing Apple ops |
| 7 agent    | —                | à faire (gate HACKER)                                 |

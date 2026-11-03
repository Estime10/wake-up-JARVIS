# Plan Cursor — Voix Piper siwis pour JARVIS

**Statut :** étapes **0–3 + 6 web livrées** sur `feat/voice-piper` (proposal ENGINE absente → implémentation alignée plan). Étapes **4–5 Tauri** = skip / décision.  
**Choix DevinChat :** `fr_FR-siwis-medium` (Piper) — salut **et** réponses  
**Règles :** pas de push sans accord · pas de `Co-authored-by: Cursor` · aucun secret · pas de `child_process` / shell dans `lib/`, `adapters/`, `app/`

---

## Contexte repo actuel (`wake-up-JARVIS`)

| Élément            | État aujourd’hui                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Port               | `ports/voice-port.ts` — `speak` / `startListening` / `onWakeWord`                                                                              |
| Impl web           | `adapters/browser/createBrowserVoice.ts` → `lib/voice/welcomeSpeak.ts` (`speechSynthesis`, voix Thomas fr si dispo)                            |
| Wiring             | `adapters/createAppPorts.ts` → `voice: createBrowserVoice()`                                                                                   |
| Appels             | `features/home/hooks/useAssistantSession.ts` (salut + réponses)                                                                                |
| ADR voix           | **absent** (dernier ADR = `0011-github-repos-lecture.md`)                                                                                      |
| Proposition ENGINE | `proposals/voice-piper/` — **pas encore dans ce repo** (à copier depuis `/workspace/wake-up-jarvis/proposals/voice-piper/` ou archive fournie) |
| Tauri / sidecar    | hors scope Next web tant que l’app Mac n’est pas dans ce dépôt ; étapes 4–5 = prep / ADR seulement ici                                         |

---

## Objectif

JARVIS parle **uniquement en français**, voix **Piper `fr_FR-siwis-medium`** (locale, gratuite), texte **normalisé** avant synthèse, lecture **phrase par phrase**, **stop** immédiat, **repli** `speechSynthesis` si Piper indisponible **avant** le premier son.

---

## Étape 0 — Préparer

1. Créer branche `feat/voice-piper` depuis la branche courante propre.
2. Copier `proposals/voice-piper/` dans le repo (**sans** `node_modules`).
3. Lire / créer les ADR :
   - créer `docs/adr/0012-voix-de-jarvis.md` (si absent) + amendement si fourni par ENGINE ;
   - relire `docs/adr/0008-auth-email-memoire-supabase.md` (garde session pour la route proxy).
4. `npm install` · `npx tsc --noEmit` · `npx vitest run` — baseline verte.

**Done when :** baseline tests OK + dossier `proposals/voice-piper/` présent.

---

## Étape 1 — Normalisation FR (sans risque — **commencer ici**)

**Fichiers cibles (depuis proposal ou à créer) :**

- `lib/voice/normalizeFr.ts`
- `lib/voice/lexiconFr.ts`
- `lib/voice/splitSentences.ts`
- `__tests__/voice/*`

**Comportement :**

- `49,99 €` → `49 euros 99`
- `PR #42` → `pull request numéro 42`
- `14h30` → `14 heures 30`
- Cap ~1500 caractères puis phrase du type « La suite est affichée à l’écran »
- Limite connue : `3/10` peut être lu comme une date (documenter, ne pas bloquer)

**Commit :** `feat(voice): normalise le français avant TTS (Piper).`

**Done when :** tests `normalizeFr` + `splitSentences` verts · **CA-A1**.

---

## Étape 2 — Adapter Piper + lecture phrase par phrase

**Fichiers cibles :**

- `adapters/piper/createPiperVoice.ts`
- `adapters/piper/webAudioSink.ts` · `wav.ts` · `types.ts` · `piperHttpSchemas.ts`
- `adapters/piper/withSpeakFallback.ts`
- `ports/voice-port.ts` (si extension minimale nécessaire — préférer ne pas casser le contrat)
- `adapters/mock/delay.ts` (réutiliser existant)
- Brancher dans `adapters/createAppPorts.ts` (feature-flag / env : Piper si dispo, sinon browser)

**Comportement :**

- Synthèse phrase `n+1` pendant lecture de `n`
- AbortSignal / stop : coupe audio + file d’attente · `onLevel(0)`
- Repli `createBrowserVoice` **seulement** si Piper down **avant** le premier audio

**Commit :** `feat(voice): Piper phrase-par-phrase avec repli speechSynthesis.`

**Done when :** **CA-A2**, **CA-A3** · tsc + vitest verts.

---

## Étape 3 — Web / dev : proxy Next → Piper local

**Fichiers cibles :**

- `adapters/piper/httpTransport.ts` · `piperProxy.ts`
- `app/api/voice/piper/route.ts`

**Sécurité (obligatoire) :**

- Piper bind **`127.0.0.1` uniquement** (jamais `0.0.0.0`)
- Route désactivée en **production** par défaut
- Same-origin only · JSON strict `{ text }` · max **4096** octets
- Garde session (ADR 0008) sur la route
- Aucun `child_process` côté Next

**Commit :** `feat(voice): proxy Next same-origin vers Piper local (dev).`

**Done when :** revue sécu route OK · écoute réelle sur le Mac · HACKER / checklist sécu.

---

## Étape 4 — Tauri : salut (sidecar) — **si / quand le shell Mac est dans le monorepo**

**Fichiers (proposal) :** `sidecar/piper_jsonl.py` · `adapters/piper/sidecarProtocol.ts` · `docs/SIDECAR.md`

- Sidecar lancé par Rust : pas de shell, args fixes, texte via stdin JSON
- Modèle vérifié **sha256** (sinon code 3 → repli `say`)
- **Aucun** IPC nouveau qui viole ADR 0009 / capabilities distantes

**Commit :** `feat(voice): sidecar Piper pour le salut Tauri.`

**Done when :** **CA-A4**, **CA-A5** · mesures load (~1,3 s) / bundle (~63 Mo) notées.

> Si Tauri n’est pas encore dans ce repo : **skip code**, ouvrir une issue + stub ADR uniquement.

---

## Étape 5 — Réponses live dans l’app Mac — **NE PAS CODER**

Canal site distant → sidecar : **décision ARCHITECT + HACKER** d’abord.

| Option                                        | Note                                       |
| --------------------------------------------- | ------------------------------------------ |
| A. ADR + commande `speak(text)` très limitée  | À étudier (recommandé)                     |
| B. Port local                                 | Contredit ADR 0006 / WKWebView non vérifié |
| C. Garder `speechSynthesis` pour les réponses | Secours                                    |

**Done when :** ADR écrit + go DevinChat. **Zéro implémentation avant.**

---

## Étape 6 — Crédits & licences

- `CREDITS.md` / NOTICE : **CC BY 4.0** (SIWIS) + **GPL** (Piper, eSpeak NG)
- Écran « À propos » (ou footer settings) : lien crédits
- Point ouvert : siwis dérivée lessac « research only » — OK perso, **revérifier avant distribution / vente**

**Commit :** `docs(voice): crédits Piper / SIWIS et notice licence.`

---

## Étape 7 — Finitions

1. Amender ADR 0012 (ARCHITECT).
2. Revue THE JUDGE.
3. CRASH TEST Mac : salut · réponse longue · stop · Piper arrêté (repli).
4. DevinChat commit / push **lui-même**.

---

## Critères d’acceptation

| ID    | Critère                                       |
| ----- | --------------------------------------------- |
| CA-A1 | `49,99 €`, `14h30`, `PR #42` lus correctement |
| CA-A2 | Piper arrêté → repli parle quand même         |
| CA-A3 | « stop » coupe tout immédiatement             |
| CA-A4 | modèle altéré → sidecar refuse + repli        |
| CA-A5 | aucune capability Tauri pour origine distante |

---

## Interdictions

- Pas de `child_process` / shell dans `lib/`, `adapters/`, `app/`
- Pas de Piper exposé sur le réseau
- Pas de clonage de la voix du film
- Pas de commit unique fourre-tout : **1 étape = 1 commit**
- Étape 5 : **aucune ligne de code** avant décision ADR

---

## Ordre d’exécution recommandé pour l’agent Cursor

```
0 → 1 → 2 → 3 → (4 si Tauri présent) → 6 → 7
         ↳ 5 = plan/ADR only, no code
```

**Prompt type pour démarrer :**

> Exécute uniquement l’étape 1 du plan `docs/plans/PLAN-voix-piper-jarvis.md`. Ne touche pas aux étapes suivantes. Commit à la fin si je le demande.

---

## Licence (rappel produit)

Usage perso OK. Avant vente / distribution : revalider la chaîne SIWIS / lessac / Piper GPL avec conseil licence.

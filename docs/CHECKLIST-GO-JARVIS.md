# E.L.S.A. — Checklist pour un GO (sans réserve)

**Base** : audit v2 sur `main` @ `32637d5` (07/11/2026).  
**Décisions DevinChat (07/11)** :

- Supabase reste en **plan Free** (pas de Pro).
- Sauvegarde = **`supabase db dump`** avant chaque mise en prod.
- **Pas de projet Vercel** avant le GO (création juste avant la preview).

**Règle** : chaque point = fait + preuve. Aucun commit / push / merge / écriture prod sans le **oui explicite** de DevinChat.

---

## A. DevinChat

| #     | Action                                                                                                                    | Preuve                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **1** | **CI verte** — workflow sans `with: version:` sur `pnpm/action-setup` (version via `packageManager` dans `package.json`). | Checks GitHub verts sur le SHA final.                                                               |
| **2** | **Protéger `main`** — PR obligatoire + CI verte requise avant merge.                                                      | Capture des branch protection rules.                                                                |
| **3** | **Auth (M7)** dashboard Supabase :                                                                                        | Capture + advisor sécurité sans WARN leaked passwords (ou décision écrite si indisponible en Free). |
|       | · Allow new users to sign up → **OFF**                                                                                    |                                                                                                     |
|       | · Confirm Email → **ON**                                                                                                  |                                                                                                     |
|       | · Anonymous sign-ins → **OFF**                                                                                            |                                                                                                     |
|       | · Leaked password protection → **ON** (si dispo Free ; sinon le dire)                                                     |                                                                                                     |
| **4** | **Vercel** — non bloqueur du GO (projet créé **après** GO, avant preview).                                                | Après création : projet lié au repo + noms des variables vérifiés (jamais les valeurs).             |

---

## B. Équipe (oui DevinChat à chaque étape)

| #      | Action                                                                                                                                                                     | Preuve                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **5**  | **Dump** — PILOT : `supabase db dump` de `jarvis` (`kqoqtilwakdwkbphxdrf`), hors site.                                                                                     | Fichier + taille + heure.                         |
| **6**  | **Migrations alignées** — PILOT : `supabase migration repair` (prod ↔ 21 fichiers repo). **Jamais** `db push` avant. Écriture prod → oui explicite.                        | `supabase migration list` identique local / prod. |
| **7**  | **H2 complet** — purge des **53** anciennes réponses assistant mail dans `messages`. Écriture prod → oui explicite.                                                        | Compte assistant mail-liés = **0**.               |
| **8**  | **Intents** — ENGINE : IV2-03 (`../../` refusé), IV2-06 (scopes GitHub), IV2-07 (unicode / invisibles) ; renommer « résume mes mails » → liste explicite. HACKER revalide. | Tests + verdict HACKER sans Critical / High.      |
| **9**  | **Supabase local** — ENGINE adapte le harnais H1 de `main` ; PILOT lance pgTAP + harnais.                                                                                  | Sorties vertes.                                   |
| **10** | **CRASH TEST** — parcours bout en bout.                                                                                                                                    | Rapport.                                          |
| **11** | **THE JUDGE** — revue du SHA final ≥ **APPROVED WITH RECOMMENDATIONS**.                                                                                                    | Rapport.                                          |
| **12** | **Audit final ARCHITECT** — même SHA, tout vert.                                                                                                                           | **GO**.                                           |

---

## C. Après le GO

1. Dump juste avant la mise en prod.
2. DevinChat crée le projet Vercel → preview → vérif variables.
3. Production.
4. Tauri.

---

## Déjà levé (ne plus rebloquer)

- Build / typecheck / tests locaux verts sur `32637d5` (+ commits suivants).
- H2 **code** : réponses `mail.*` non persistées dans MemoryPort.
- Droits prod sains (réserve V4-1).
- `mail_items` sans `snippet` / `summary`.
- Vercel absent = **OK** jusqu’au post-GO.

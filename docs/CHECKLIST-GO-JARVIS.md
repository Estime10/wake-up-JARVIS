# E.L.S.A. — Checklist pour un GO (sans réserve) — v2

**Base** : audit v3 sur `main` = `develop` @ `d2b9aa6` (07/11/2026).  
**Décisions DevinChat (07/11)** :

- Supabase reste en **plan Free** (pas de Pro).
- Dump avant chaque mise en prod.
- Protection mots de passe compromis **non dispo en Free** = **choix assumé** (ne bloque pas le GO).
- Vercel créé **après** le GO (PILOT / DevinChat).

**Règle** : chaque point = fait + preuve. Aucun commit / push / merge / écriture prod sans le **oui explicite** de DevinChat.

---

## Déjà prouvé ✅

| #     | Point                | Preuve                                                                                                           |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **1** | CI verte             | Checks verts sur `d2b9aa6` (install, lint, typecheck, Vitest, format, build)                                     |
| **3** | Réglages Auth (M7)   | Capture 19:48 : sign up **OFF**, anonymous **OFF**, confirm email **ON**. Leaked passwords : choix assumé (Free) |
| **6** | Migrations alignées  | 21 versions prod = 21 fichiers repo                                                                              |
| **7** | Purge H2             | 0 réponse assistant en prod ; code ne persiste plus les réponses `mail.*`                                        |
| —     | Droits prod          | 0 fonction `SECURITY DEFINER` exécutable par `anon` / `authenticated`                                            |
| —     | IV2-03               | chemins `../`, `%2e%2e`, `..\ ` refusés                                                                          |
| —     | « résume mes mails » | répond « titres seulement »                                                                                      |
| **4** | Vercel               | reporté après le GO                                                                                              |

---

## Reste à faire pour le GO

### Par DevinChat

| #     | Action                                                                                                                                                                                     | Preuve                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| **2** | Protection de `main` **sans contournement** — activer « Do not allow bypassing the above settings » (`enforce_admins`), et protéger `develop` aussi. Ne plus merger avant la fin de la CI. | Capture des règles       |
| **5** | Dump **hors du Mac** — copier `~/Desktop/elsa-backups` vers un stockage hors machine, **chiffré** (données perso).                                                                         | Capture ou chemin + date |

### Par l’équipe (avec le oui de DevinChat)

| #      | Action                                                                                                                                                                                                                                              | Preuve                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **8a** | **IV2-07** (ENGINE) — bloquer « corbeille » en homoglyphes cyrilliques ou lettres espacées                                                                                                                                                          | ✅ tests + PR #4                          |
| **8b** | **IV2-06** (ENGINE) — jeton GitHub : allowlist lecture seule (refuser `delete:packages`, `codespace`, `project`, `user`, `repo:status`, `security_events`, etc.) ; vérifier aussi fine-grained ; revérifier à l’usage, pas seulement à la connexion | ✅ tests + PR #4                          |
| **8c** | **HACKER** revalide IV2-03 / 06 / 07 : aucun Critical / High                                                                                                                                                                                        | ✅ HACKER-…-2026-11-07                    |
| **9**  | **pgTAP** (PILOT) — sortie complète et datée sur le SHA final, après reset local                                                                                                                                                                    | ✅ PROOF-pgtap-b21c984                    |
| **10** | **CRASH TEST** — parcours : accueil → assistant → liste des mails → déconnexion d’une boîte                                                                                                                                                         | ⏳ spec OK ; run E2E credentials manquant |
| **11** | **THE JUDGE** — revue du SHA final ≥ **APPROVED WITH RECOMMENDATIONS**                                                                                                                                                                              | ✅ JUDGE-iv2-go-… (AWR)                   |
| **12** | **Audit final ARCHITECT** — même SHA, tout vert = **GO**                                                                                                                                                                                            | ⏳ après merge CI + §5 + CRASH live       |

---

## Après le GO

1. Dump juste avant la mise en prod.
2. Création projet Vercel + variables (Preview / Production) — seulement le nécessaire ; **aucune** `service_role` en `NEXT_PUBLIC_` ; aucune valeur secrète dans un chat.
3. Preview → vérif → production.
4. Tauri.

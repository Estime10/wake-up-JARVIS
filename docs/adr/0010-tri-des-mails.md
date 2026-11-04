# 0010 — Tri des mails : lecture Gmail, tri déterministe, résumé sur demande

- **Statut** : Proposé (étapes 1–2 livrées sur `feature/api` — OAuth, relève, tri, résumé consent ; lockdown Vault H1)
- **Niveau** : 3 (jetons OAuth, données perso) — **revue HACKER obligatoire avant toute ligne de code**
- **Date** : 2026-11-02
- **Auteur** : ARCHITECT — Analyse : ENGINE (`feature/api` @ `fc347fd`)
- **Relecteurs** : HACKER, THE JUDGE

## Contexte

DevinChat veut que JARVIS lui signale ce qui compte dans ses **3 boîtes Gmail** (`estimevangu`, `estimevangu.pro`, `estimedev10`), **sans IA pour trier** et **sans jamais rien modifier** dans Gmail.

Aujourd’hui `ports/mail-port.ts` ne sert qu’un mock ([ADR 0001](./0001-ui-d-abord-ports-et-mocks.md)) ; il n’y a ni `app/api`, ni client `service_role`, ni cron. POSTMAN range déjà les boîtes chaque soir à 22h30 ; JARVIS ne fait que **lire**, donc aucun conflit de libellés.

## Décision

- **Lecture seule** : OAuth Google, scope `gmail.readonly` **uniquement**, un compte Google connecté par boîte (`prompt=select_account`).
- **Tri déterministe, sans IA** : règles de POSTMAN, appliquées dans l’ordre **expéditeur → objet → sinon « DIVERS/À trier »**.
- **Signalement de l’inhabituel** (règle DevinChat du 31/10) : phishing, impayé, avocat ou recouvrement, paiement échoué, alerte sécurité, réponse attendue, humain qui demande une action, échéance.
- **Résumé sur demande** : JARVIS demande « je te le résume ? ». Seulement après le **oui**, le serveur récupère le mail complet, l’envoie à l’IA de résumé (derrière un `SummaryPort`), **garde le résumé** et **jette le contenu**. Oui et non sont journalisés.
- **Données gardées** : métadonnées (boîte, expéditeur, objet, date, catégorie, motif du signalement) et résumés. **Jamais** le corps complet. Pas d’effacement (choix DevinChat).
- **Schéma (Supabase, [ADR 0008](./0008-auth-email-memoire-supabase.md))** :
  - `mail_accounts` — référence Vault (`secret_id`), **jamais** le jeton en colonne ;
  - `mail_rules` — règles et regex en base (pas dans le repo public) ;
  - `mail_items`, `mail_reads` ;
  - RLS sur `auth.uid()` partout ; **aucune** policy DELETE ; trigger qui bloque les suppressions ;
  - jetons dans **Supabase Vault**, lus seulement par des fonctions `security definer` du schéma `private`.
- **Relève** : Edge Function `gmail-poll` toutes les **5 min** via `pg_cron` + `pg_net` (cron Vercel Hobby, 1×/jour, exclu). Requêtes incrémentales (`historyId`) pour rester léger.
- **Côté app** : routes `app/api/google/oauth/*`, une route de résumé, `lib/supabase/admin.ts` en `server-only`. Le port mail gagne `listFlagged` et `requestSummary`, adapter Supabase ; l’UI mail panel ne change pas de contrat de surface tant que l’étape 2 n’est pas là.
- **Coût** : offre gratuite visée (~8 640 appels d’Edge Function / mois pour 500 000 inclus ; ~55–75 Mo / an estimés pour 100 mails/jour).

### Découpage (décision DevinChat, 2026-11-02)

**Étape 1 — Connexion des boîtes seulement**

- **3 boîtes connectées, 3 activées** (pas de sous-sélection « 2 sur 3 »).
- OAuth Google par boîte ; scopes `openid email gmail.readonly` **dès cette étape** (un seul consentement, pas de re-consent à l’étape 2).
- Jeton dans **Supabase Vault** ; la table ne garde qu’une **référence**.
- États d’une boîte : `active` | `disabled` | `needs_reauth` (« à reconnecter ») ; **débrancher** une boîte **révoque** le jeton chez Google (pas seulement un flag local).
- App Google : passer **In production** sans vérification (usage perso, écran d’avertissement accepté) — le mode Testing expire les refresh tokens à **7 jours**.
- UI « Boîtes mail » : liste, interrupteur, « Ajouter une boîte Gmail ».
- Le panneau Mails home **reste en mock** ; **aucun** contenu mail lu à cette étape.

**Étape 2 — Lecture et tri**

- Relève, tri, signalement et résumé tels que décrits plus haut, **sur les boîtes actives uniquement**.

## Options envisagées

1. **Tri déterministe + résumé au oui** — retenu : prévisible, gratuit, aucun mail envoyé à une IA sans accord.
2. **Tri par IA** — non : coût, résultats variables, et tout le courrier partirait chez un fournisseur.
3. **Réutiliser les connecteurs Gmail des bots** — non : ils appartiennent aux bots, pas à l’app JARVIS.
4. **Cron Vercel** — non sur Hobby (une exécution par jour).
5. **Jeton en colonne chiffrée `mailboxes`** — non : une erreur de RLS suffit à fuiter ; **Vault + référence** uniquement.
6. **Activer seulement 2 boîtes sur 3** — écarté (2026-11-02) : les 3 sont connectées et actives.

## Points à trancher par DevinChat

1. **Projet Supabase JARVIS** : org Free (2 projets actifs max). Créer / réveiller le projet JARVIS, ou passer Pro.
2. **App Google In production** sans vérification — HACKER confirme.
3. **Pause Free + cron** : rien ne garantit qu’un cron interne compte comme activité (non vérifié). L’ADR 0008 prévoit déjà Pro dès que l’agent tourne vraiment.
4. **IA de résumé** : quel fournisseur derrière `SummaryPort`, de préférence sans conservation des données.

## Conséquences

- **Gain** : signalement utile sans tri IA ; lecture seule compatible POSTMAN ; étape 1 isole le risque OAuth/Vault avant tout corps de mail.
- **Risque** : données personnelles de tiers gardées sans limite de durée (choix assumé, à revoir si JARVIS sort de l’usage perso) ; jeton révoqué / `invalid_grant` → boîte `needs_reauth`, sans retry en boucle.
- **Coût** : Vault + Edge Functions + `pg_cron`/`pg_net` ; règles en base à synchroniser avec POSTMAN (`mail_rules`).
- **Process** : zéro commit d’implémentation étape 1 sans validation DevinChat **et** relecture HACKER (niveau 3).

## Critères d’acceptation

| ID   | Critère                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| CA1  | Boîte connectée → seul `gmail.readonly` demandé ; aucun libellé, état lu ou mail modifié dans Gmail.                     |
| CA2  | Expéditeur matche une règle → cette catégorie ; sinon règle objet ; sinon « DIVERS/À trier ». Même mail → même résultat. |
| CA3  | Mail d’un des 8 types inhabituels → signalé avec motif.                                                                  |
| CA4  | Réponse **non** au résumé → rien récupéré ni envoyé à l’IA ; **oui et non** journalisés dans `mail_reads`.               |
| CA5  | Réponse **oui** → contenu récupéré, résumé stocké seul, contenu jeté ; oui journalisé.                                   |
| CA6  | Aucune colonne avec corps complet ni jeton en clair.                                                                     |
| CA7  | `DELETE` sur `mail_items` / `mail_reads` / `mail_accounts` échoue, même authentifié.                                     |
| CA8  | Un utilisateur ne voit que ses lignes (RLS, deux comptes).                                                               |
| CA9  | Jeton Google absent du bundle client, des logs et des réponses API.                                                      |
| CA10 | Jeton révoqué → boîte `needs_reauth` ; relève continue pour les autres boîtes.                                           |
| CA11 | Relève toutes les 5 min ; ne relit que les nouveaux mails (`historyId`).                                                 |

## Definition of Done

- `pnpm check` vert (lint + typecheck + tests).
- Verdict THE JUDGE ≥ **APPROVED WITH RECOMMENDATIONS**.
- Aucun Critical/High HACKER ouvert.
- Preuves CRASH TEST.
- **Zéro commit** sans le oui de DevinChat.

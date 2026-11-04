# Plan de correction — feature/api (JARVIS)

> **État 2026-11-04** : Phase 1 (H1, M7, H2) et Phase 2/3 ciblées (M1–M5) **livrées** sur `feature/api`.  
> Compléments : refonte home + tiroir Studio ([ADR 0013](../adr/0013-supabase-platform-studio-embarque.md)), drop `pg_graphql` + revoke `anon` (advisors 0026/0027).  
> Synthèse : [NOTE-feature-api-2026-11-04.md](./NOTE-feature-api-2026-11-04.md).

## Contexte

| Élément          | Valeur                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dépôt            | Estime10/wake-up-JARVIS                                                                                                                           |
| Branche          | feature/api                                                                                                                                       |
| Commit de départ | `03cf47e` (`03cf47ea8eac49a56e6dbfba5cd3215b0586e775`) ; base develop @ `fc347fd`                                                                 |
| Stack            | Next.js 16 (App Router, `proxy.ts`), TypeScript strict, Zod, Supabase (Postgres, RLS, Vault, Realtime), Vitest, Playwright, pnpm, ESLint/Prettier |
| Sources          | `REVIEW-feature-api.md` (THE JUDGE : 2 High, 8 Medium, 14 Low) ; `HACKER-revalidation-H1-03cf47e.md` (JV-01/H1 toujours vulnérable à `03cf47e`)   |

## Règles pour l'IA de code

1. **TypeScript strict** : aucun `any`, aucun `@ts-ignore`, aucun cast `as` pour contourner un type.
2. **Zod à toutes les frontières** : params et corps des routes, réponses d'API externes, réponses JSON consommées côté client.
3. **Migrations** : créer de nouvelles migrations datées dans `supabase/migrations/`. Ne jamais modifier une migration existante.
4. **Pas de nouvelle dépendance** sans nécessité démontrée. Si une dépendance paraît indispensable, demander avant de l'ajouter.
5. **Un commit atomique par point** (H1, M7, H2…), avec le message préfixé par l'id du point. **Ne rien committer sans le « oui » explicite de DevinChat** : préparer le diff, montrer le résumé, attendre l'accord.
6. **Respecter les ADR** (`docs/adr/`, en particulier 0001, 0010, 0011, 0012). Ne pas amender un ADR sauf si ce plan le demande (L14). **L'ADR 0010 n'est pas amendé pour H2.**
7. **Garder les bonnes pratiques existantes** : RPC `security definer` + `set search_path = ''`, `revoke … from public, anon, authenticated` + `grant execute … to service_role`, `import "server-only"`, `getUser()` (jamais `getSession()`), logger sans jeton.
8. **Après chaque point** : `pnpm lint && pnpm typecheck && pnpm test` au vert.
9. **Ordre imposé** : Phase 1 (bloquante) → Phase 2 → Phase 3 → Phase 4. Ne pas commencer une phase tant que la précédente n'est pas validée.

---

## Phase 1 — Bloquante : H1, M7, H2

### H1 — `vault_secret_id` modifiable : lecture et suppression des secrets Vault d'autrui (JV-01)

**Sévérité** : High (CVSS 3.1 : 7.1)

**Fichiers:lignes (@03cf47e)** :

- `supabase/migrations/20261102131723_mail_accounts_vault.sql:43-48` : policy `mail_accounts_update_own`, UPDATE de toutes les colonnes ; grant UPDATE par défaut de `authenticated` non retiré.
- `…20261102131723_mail_accounts_vault.sql:158-169` : `private.mail_account_read_token(p_secret_id)` ; wrapper `public.admin_mail_account_read_token` l.223-234 (grants l.240-247).
- `supabase/migrations/20261102151500_mail_items_rules_poll.sql:262-293` (l.274-276, 289) : `mail_account_delete` supprime `vault.secrets where id = v_secret_id` lu depuis la ligne modifiable.
- `supabase/migrations/20261102163000_github_connections_vault.sql:163` (`private.github_connection_read_token(p_secret_id)`), l.229-253 (wrapper `admin_github_connection_read_token(uuid)`), l.157 (delete).
- Appelants : `features/mail/services/pollMailAccount.ts:142-145` (l.144), `app/api/mail/poll/route.ts:41`, `app/api/google/oauth/disconnect/route.ts:37,46-48`, `app/api/mail/items/[id]/summary/route.ts:72,82`, `lib/github/connectionToken.ts`.

**Problème** : un utilisateur authentifié peut écrire dans son `vault_secret_id` l'UUID du secret d'un autre. Le serveur déchiffre alors ce secret (refresh token Google **ou** PAT GitHub, car aucun contrôle de type) pour le compte de l'attaquant, et sa déconnexion **supprime** le secret de la victime. L'attaquant doit connaître l'UUID du secret visé.

**Correctif** (nouvelle migration, p. ex. `2026110XXXXXXX_mail_accounts_lockdown.sql`) :

1. **Grants par colonne** sur `public.mail_accounts` :
   - `revoke update, select on public.mail_accounts from anon, authenticated;`
   - `grant select (<colonnes utiles au front, SANS vault_secret_id>) on public.mail_accounts to authenticated;` (lister les colonnes réellement lues par `useMailAccounts.ts` / adapters).
   - `grant update (label, status, updated_at) on public.mail_accounts to authenticated;` — ou, mieux : drop policy `mail_accounts_update_own` et passer le changement de statut par une RPC serveur `admin_mail_account_set_status(p_user_id, p_account_id, p_status)` (`security definer`, `search_path=''`, `service_role` uniquement) appelée depuis la route.
   - Optionnel : trigger `before update` qui refuse tout changement de `vault_secret_id`, `user_id` ou `email` hors `service_role`.
2. **Appliquer le même principe de lecture à `github_connections`** : revoke select puis grant select par colonne **sans** `vault_secret_id` (la table n'a déjà pas de policy UPDATE, à garder ainsi). Adapter `lib/github/connectionToken.ts`, qui sélectionne aujourd'hui `vault_secret_id`.
3. **Lecture du jeton liée au propriétaire** :
   - créer `private.mail_account_read_token(p_user_id uuid, p_account_id uuid)` qui fait la jointure `public.mail_accounts ma → vault.decrypted_secrets ds on ds.id = ma.vault_secret_id` avec `where ma.id = p_account_id and ma.user_id = p_user_id` ; renvoie NULL si rien.
   - **Contrôle du type de secret** : le secret ne doit être lu que via la table qui le possède. La fonction mail ne lit que des secrets référencés par `mail_accounts` (la jointure l'impose) ; ajouter une garde qui renvoie NULL/erreur si cet id est aussi référencé par `github_connections` (et réciproquement), et/ou vérifier la description posée à la création (`'Gmail refresh token …'` vs `'GitHub PAT …'`). Le PAT GitHub ne doit jamais sortir de la fonction mail.
   - nouveau wrapper `public.admin_mail_account_read_token(p_user_id uuid, p_account_id uuid)` ; `revoke all … from public, anon, authenticated` ; `grant execute … to service_role`.
   - `drop function public.admin_mail_account_read_token(uuid)` et `private.mail_account_read_token(uuid)` (dans la nouvelle migration).
   - même modèle pour GitHub : `admin_github_connection_read_token(p_user_id uuid, p_connection_id uuid)`, jointure `github_connections → vault.decrypted_secrets`, drop de la version `(uuid)`.
4. **Suppression limitée au secret lié** : nouvelle version de `mail_account_delete` (et de la suppression GitHub) qui récupère l'id du secret par jointure sur la ligne `(p_user_id, p_account_id)` et ne supprime que celui-là ; avec le point 1, cet id n'est plus modifiable par le client. Ajouter la même garde de type qu'au point 3.
5. **Code applicatif** : les appelants ne transmettent plus jamais un id de secret.
   - `pollMailAccount.ts:144` → `{ p_user_id, p_account_id }` ;
   - `app/api/google/oauth/disconnect/route.ts:47` et `app/api/mail/items/[id]/summary/route.ts:82` → idem ;
   - `lib/github/connectionToken.ts` → `{ p_user_id: user.id, p_connection_id }` ; ne plus sélectionner `vault_secret_id`.
6. Retirer `vault_secret_id` des types/schémas Zod côté client s'il y apparaît.
7. Régénérer les types Supabase si le projet en a.

**Critères d'acceptation** :

- `node /workspace/review-jarvis/poc/sql-poc-03cf47e.mjs` (après avoir pointé `MIG` vers les migrations du nouveau commit) donne :
  - (a) B UPDATE `vault_secret_id` → `permission denied for table mail_accounts` (ou 0 ligne si trigger) ; `select vault_secret_id from mail_accounts` en authenticated → `permission denied` ;
  - (b) `admin_mail_account_read_token(p_user_id=B, p_account_id=compte de A)` → NULL ou une erreur, **jamais** `FAKE_REFRESH_TOKEN_OF_A` ni `FAKE_PAT_OF_A` ;
  - (c) après la déconnexion de B, le secret de A est intact → `{ n: 1 }`.
- Non-régression : le propriétaire peut toujours changer label/status (ou via la RPC) ; sa propre déconnexion supprime bien son secret.
- Test SQL permanent (pgTAP ou PGlite en CI, cf. M8) couvrant (a), (b), (c) et le cas « PAT GitHub non lisible via la fonction mail ».
- Test Vitest : mail/poll, disconnect, summary et `connectionToken` n'appellent plus aucune RPC avec `p_secret_id`.

---

### M7 — Inscription ouverte, sans allowlist ni MFA (corrigé avec H1)

**Sévérité** : Medium (dépend de la config distante)

**Fichiers:lignes** : `supabase/config.toml:169,214` (`enable_signup = true`), `:219` (`enable_confirmations = false`), `:296-297` (TOTP désactivé) ; aucune route ne vérifie `aal2` ni une allowlist.

**Problème** : n'importe qui peut créer un compte, ce qui rend H1 exploitable par un inconnu, dans une app qui détient Gmail et un PAT GitHub.

**Correctif** :

1. `supabase/config.toml` : `enable_signup = false` (compte unique) ; à défaut, `enable_confirmations = true` + allowlist.
2. Allowlist de propriétaires côté serveur : variable d'env (p. ex. `OWNER_EMAILS` ou `OWNER_USER_IDS`, validée par Zod au démarrage, ajoutée à `.env.example` avec valeur factice) et helper `requireOwner()` appelé après `getUser()` dans toutes les routes Gmail/GitHub (`app/api/google/**`, `app/api/mail/**`, `app/api/github/**`).
3. **Pas de MFA** (décision DevinChat) — ne pas activer TOTP ni exiger `aal2`.
4. Documenter dans le README l'action **manuelle** : désactiver l'inscription sur le projet Supabase distant (non vérifiable depuis le repo).

**Critères d'acceptation** :

- Tests : utilisateur hors allowlist → 403 ; propriétaire allowlisté → OK.
- `config.toml` relu : `enable_signup = false` ; TOTP reste désactivé.

> **Action manuelle DevinChat** : le réglage d'inscription sur le Supabase en ligne ne peut pas être changé depuis le code.

---

### H2 — Contenu de mail persisté ; le « résumé » est une troncature du corps

**Sévérité** : High

**Fichiers:lignes** :

- `features/mail/services/createLocalSummary.ts:9-16` (320 premiers caractères du corps) ;
- `app/api/mail/items/[id]/summary/route.ts:109-121` (persistance via `admin_mail_item_store_summary`) ;
- `features/mail/services/pollMailAccount.ts:91,101` + `supabase/migrations/20261102151500_mail_items_rules_poll.sql:53` (colonne/stockage du snippet) ;
- `ports/summary-port.ts` (« le corps ne doit jamais être persisté »).

**Problème** : le snippet Gmail est stocké pour chaque mail sans consentement, et le « résumé » stocké est un extrait brut du corps (OTP, liens de réinitialisation…), contraire à l'ADR 0010 (l.21, CA5).

**Décision DevinChat** : ne rien stocker (ni résumé, ni extrait/snippet) tant qu'il n'y a pas de vrai résumé. **L'ADR 0010 n'est pas amendé.**

**Correctif** :

1. `pollMailAccount.ts:91,101` : ne plus lire ni transmettre `snippet` à l'upsert.
2. Nouvelle migration : nouvelle version de `admin_mail_item_upsert` sans `p_snippet` (drop de l'ancienne signature) ; `update public.mail_items set snippet = null;` puis `alter table public.mail_items drop column snippet` (ou, si la colonne doit rester pour compat, contrainte `check (snippet is null)`) ; idem pour toute colonne de résumé déjà remplie : `update … set summary = null`.
3. Route summary : ne plus appeler `admin_mail_item_store_summary` ; tant qu'aucun fournisseur de vrai résumé n'existe, renvoyer **501 Not Implemented** (sans fetch Gmail du corps). Supprimer `createLocalSummary.ts` et ses usages/tests, ou le garder hors de tout chemin de persistance.
4. Révoquer/retirer `admin_mail_item_store_summary` dans la nouvelle migration si plus aucun appelant (sinon le laisser inaccessible hors `service_role`).
5. Retirer `snippet`/`summary` des types, schémas Zod et adapters (`adapters/supabase/createSupabaseMail.ts`) et de l'UI qui les affiche.

**Critères d'acceptation** :

- `rg -n "snippet" features app adapters lib` ne renvoie plus de persistance ni d'affichage de snippet stocké.
- Test Vitest : `pollMailAccount` n'envoie aucun champ snippet/corps à la RPC d'upsert.
- Test de route : `POST /api/mail/items/{id}/summary` → 501 et aucun appel à `admin_mail_item_store_summary` ni à Gmail.
- Test SQL : après migration, aucune ligne de `mail_items` ne contient de snippet ni de résumé.
- ADR 0010 inchangé.

---

## Phase 2 — M1, M6, M8 (avec tests)

### M1 — Purge à chaque relève, qui efface aussi le journal de consentement

**Sévérité** : Medium

**Fichiers:lignes** : `features/mail/services/pollMailAccount.ts:131-140` ; `supabase/migrations/20261102153000_mail_items_purge.sql` (`purge_all` / `purge_before` contournent le trigger anti-DELETE et suppriment `mail_reads`).

**Problème** : l'ADR 0010 dit « Pas d'effacement » (CA7), or les mails et le journal oui/non (`mail_reads`) sont effacés toutes les 10 min ; la fenêtre J-2 n'est pas inscrite dans l'ADR.

**Correctif** (l'ADR n'étant pas amendé, option conforme à l'ADR) :

1. Retirer l'appel de purge de `pollMailAccount.ts:131-140`.
2. Nouvelle migration : redéfinir/supprimer `purge_all` et `purge_before` pour qu'ils ne touchent jamais `mail_reads` ; s'ils sont conservés, les sortir du chemin de relève (pas d'appelant applicatif).
3. **Si DevinChat veut garder une rétention J-2** : s'arrêter et demander (cela exige un amendement de l'ADR 0010, hors périmètre de ce plan), puis planifier côté base (`pg_cron`) en épargnant `mail_reads`.

**Critères d'acceptation** :

- Test Vitest : `pollMailAccount` n'appelle plus aucune RPC de purge.
- Test SQL : un DELETE sur `mail_items`/`mail_reads` en authenticated échoue (CA7) ; les fonctions de purge restantes ne suppriment aucune ligne de `mail_reads`.

> **Note** : la purge J-2 a été retirée du plan pour respecter l'ADR. Si DevinChat veut la garder, l'IA doit poser la question et attendre un amendement ADR.

---

### M6 — Route résumé : journal de consentement non garanti, boîte disabled acceptée, id non validé

**Sévérité** : Medium

**Fichiers:lignes** : `app/api/mail/items/[id]/summary/route.ts:35,136` (id non validé), `:59-63` (erreur d'insert `mail_reads` ignorée), `:77` (seul `needs_reauth` refusé).

**Problème** : le corps peut être lu chez Gmail sans trace de consentement, une boîte `disabled` est interrogée et un id invalide provoque un 500.

**Correctif** (à combiner avec H2 : la route renvoie 501 pour la partie résumé, mais garder ces gardes pour la future implémentation) :

1. `z.string().uuid()` sur `params.id` → 400 si invalide.
2. Vérifier l'erreur de l'insert `mail_reads` (`summary_yes`/`summary_no`) ; en cas d'erreur, 500 **avant** tout appel Gmail.
3. Exiger `status === 'active'` sur la boîte ; sinon 409/403.

**Critères d'acceptation** (tests de route Vitest, fetch/Supabase simulés) :

- id non-uuid → 400, aucune requête base ;
- insert `mail_reads` en erreur → 500, aucun appel Gmail ;
- boîte `disabled` ou `needs_reauth` → refus, aucun appel Gmail ;
- cas nominal : journal écrit avant toute lecture.

---

### M8 — Aucune couverture de test sur les frontières de sécurité

**Sévérité** : Medium

**Constat** : 126 tests, uniquement sur des fonctions pures ; rien sur `app/api/**`, `pollMailAccount`, `lib/github/*`, `lib/google/*`, migrations/RLS/RPC. E2E limité à `e2e/csp.spec.ts`.

**Correctif** :

1. **Tests SQL** (pgTAP, ou PGlite en CI comme le PoC HACKER) rejouant toutes les migrations : RLS `mail_accounts` (UPDATE `vault_secret_id` refusé, SELECT `vault_secret_id` refusé), `read_token` lié à `(user, compte)`, suppression limitée au secret lié, PAT GitHub non lisible via la fonction mail, DELETE interdit sur `mail_items`/`mail_reads`, RPC `admin_*` refusées à authenticated. Les intégrer à `pnpm test` ou à un script `pnpm test:db` lancé en CI.
2. **Tests de routes Vitest** avec fetch et client Supabase simulés : `mail/poll`, `google/oauth/disconnect`, `mail/items/[id]/summary`, `github/connect`, `github/disconnect`, `github/repos/*`.
3. Tests de `pollMailAccount` et de `assertGithubPath` / validation de chemins GitHub (préparent L1).

**Critères d'acceptation** : les tests listés en H1, M7, H2, M1, M6 existent et passent ; ils **échouent** si on rejoue les migrations de `03cf47e` sans le correctif H1 ; la CI les exécute.

---

## Phase 3 — Autres Medium : M2, M3, M4, M5

### M2 — Relève pilotée par le navigateur, sans historyId, N+1 séquentiel, sans rate limit

**Sévérité** : Medium

**Fichiers:lignes** : `features/mail/MailFeedProvider.tsx:90-125`, `features/mail/model/mailPollSchedule.ts:2,13-25` ; `features/mail/services/pollMailAccount.ts:82-117,122-123,178-182` ; `lib/google/gmail.ts:115-165` ; `app/api/mail/poll/route.ts:53-55` ; `lib/google/gmail.ts:171-210` (`listGmailHistoryAdded`, code mort).

**Problème** : une relève par onglet toutes les 10 min, refetch complet J-2, jusqu'à 300 GET Gmail séquentiels par boîte, sans verrou ni rate limit ; CA11 (5 min, incrémental) non tenu.

**Correctif** :

1. Planifier côté serveur (cron Vercel protégé par un secret, ou `pg_cron`) toutes les 5 min ; le navigateur ne déclenche plus la relève (ou seulement un « rafraîchir » débouncé).
2. Relève incrémentale via `history.list` à partir de `gmail_history_id` (utiliser `listGmailHistoryAdded`) ; resync complet seulement sur 404.
3. Concurrence bornée (p. ex. 5) pour les GET `/messages/{id}`, sans nouvelle dépendance (petit pool maison) ; upsert en un seul appel RPC avec un tableau (nouvelle migration).
4. Verrou/debounce par utilisateur (`last_polled_at` en base) et rate limit sur `POST /api/mail/poll` (429).

**Critères d'acceptation** : tests Vitest — relève incrémentale n'appelle que les nouveaux messages ; pas plus de N requêtes simultanées ; deuxième appel dans la fenêtre de verrou → 429/no-op ; 404 history → resync. Aucun code mort restant.

---

### M3 — Tempête de rechargements via Realtime

**Sévérité** : Medium

**Fichiers:lignes** : `features/mail/MailFeedProvider.tsx:73-89`.

**Problème** : chaque événement `postgres_changes` (`*`) déclenche un `listRecent(500)` complet, soit jusqu'à ~300 rechargements par onglet et par relève.

**Correctif** : debounce/throttle (500 ms à 1 s) du rechargement, ou application incrémentale du payload ; côté SQL (nouvelle migration), l'upsert ne fait l'`UPDATE` que si `… is distinct from …`.

**Critères d'acceptation** : test Vitest (timers simulés) — 300 événements rapprochés → 1 seul `listRecent` ; test SQL — un upsert identique ne produit pas d'`UPDATE`.

---

### M4 — `/api/geo/reverse` : proxy ouvert, contraire à la politique BigDataCloud

**Sévérité** : Medium

**Fichiers:lignes** : `app/api/geo/reverse/route.ts:16-31` ; `lib/geo/reverseGeocode.ts:16-35` ; appelant `lib/hooks/useDeviceLocation.ts:50,112` ; CSP `proxy.ts:21` (`connect-src`).

**Problème** : la route n'a pas d'auth, relaie des coordonnées vers l'endpoint client de BigDataCloud (interdit côté serveur, risque de ban IP/402) et ne capture pas les erreurs réseau.

**Décision DevinChat** : la géolocalisation passe côté navigateur, et la route serveur `/api/geo/reverse` est **supprimée**.

**Correctif** :

1. Supprimer `app/api/geo/reverse/route.ts` (et son dossier).
2. Dans `useDeviceLocation.ts`, appeler directement `https://api.bigdatacloud.net/data/reverse-geocode-client` depuis le navigateur ; valider la réponse par Zod ; try/catch → `place: null` en cas d'échec.
3. Adapter `lib/geo/reverseGeocode.ts` pour un usage client (pas de `server-only`), ou le fusionner dans le hook.
4. `proxy.ts:21` : ajouter `https://api.bigdatacloud.net` à `connect-src`.
5. Mettre à jour le commentaire l.112 du hook.

**Critères d'acceptation** : `GET /api/geo/reverse` → 404 ; `rg "/api/geo/reverse"` vide ; test Vitest du hook (succès, erreur réseau → null, réponse invalide → null) ; `e2e/csp.spec.ts` (ou test équivalent) confirme `api.bigdatacloud.net` dans `connect-src`.

---

### M5 — ReDoS via les phrases perso et `mail_rules`

**Sévérité** : Medium

**Fichiers:lignes** : `features/assistant/model/matchPhraseCatalog.ts:4-10,19-33` ; `app/api/assistant/reply/route.ts:14-26` ; `features/mail/model/classifyMail.ts:10-15`.

**Problème** : chaque slot devient `(.+)` ; avec plusieurs slots et un texte long, la croissance est en O(n⁴) (225 ms à 400 caractères) et peut geler l'instance ; `mail_rules` est compilé en `new RegExp` pendant la relève.

**Correctif** :

1. Zod dans `assistant/reply` : au plus 2 slots par phrase ; texte soumis aux règles perso borné (p. ex. 300 caractères).
2. `matchPhraseCatalog` : captures non gourmandes délimitées par des espaces / sans motifs ambigus adjacents.
3. `classifyMail` : matching littéral par défaut (échapper le motif) ; valider le motif à l'insertion des `mail_rules` (contrainte de longueur en nouvelle migration et/ou validation Zod côté serveur).

**Critères d'acceptation** : test Vitest reproduisant la PoC (`"{label} {label} {label} {label} x"`) → rejet par Zod ou exécution < 50 ms sur l'entrée maximale ; phrase à 3 slots → 400 ; règle `mail_rules` avec métacaractères traitée littéralement.

---

## Phase 4 — Low (défauts)

| id  | Titre                                 | Sévérité  | Fichiers:lignes                                                                                                                                                                                      | Problème                                                                                                                                                 | Correctif                                                                                                                                                                                       | Critères d'acceptation                                                                                          |
| --- | ------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| L1  | Traversée `..` dans les routes GitHub | Low       | `lib/github/getFileContent.ts:47-53`, `lib/github/listTree.ts:41`, `lib/github/request.ts:28`, `app/api/github/repos/[owner]/[repo]/*` (branches l.23-29, commits l.28, contents l.24-25, tree l.28) | `encodeURIComponent` laisse passer `..`, `new URL` normalise : `path=../../../../user` → `https://api.github.com/user` ; owner/repo/ref/path non validés | 1) Schéma Zod commun : regex owner/repo GitHub, refus des segments `./..` dans path et ref. 2) Dans `request.ts`, vérifier que l'URL finale commence par `/repos/{owner}/{repo}/`, sinon erreur | Tests : `path=../../../../user` et `ref=..` → 400 ; URL hors `/repos/{owner}/{repo}/` refusée ; cas nominaux OK |
| L4  | Pas de `Cache-Control: no-store`      | Low       | Toutes les routes JSON `app/api/**`                                                                                                                                                                  | Réponses contenant mails / contenus de repos privés cachables                                                                                            | Helper commun de réponse JSON ajoutant `Cache-Control: no-store`, utilisé partout                                                                                                               | Test : chaque route renvoie `no-store`                                                                          |
| L5  | Corps de réponse Google dans les logs | Low       | `lib/google/oauth.ts:62-65`                                                                                                                                                                          | 120 caractères du corps Google dans le message d'erreur                                                                                                  | Logger seulement status et le champ JSON `error` (parsé par Zod)                                                                                                                                | Test : l'erreur ne contient pas le corps brut                                                                   |
| L6  | `unread` mappé sur `flagged`          | Low       | `adapters/supabase/createSupabaseMail.ts:43`                                                                                                                                                         | Signalé ≠ non lu                                                                                                                                         | Mapper depuis le label Gmail `UNREAD` (si stocké) ou retirer le champ                                                                                                                           | Test d'adapter : `unread` ne dépend plus de `flagged`                                                           |
| L7  | Troncature silencieuse à 300          | Low       | `lib/google/gmail.ts:115-116`                                                                                                                                                                        | `LIST_HARD_CAP = 300` coupe sans prévenir                                                                                                                | Logger un warn quand la limite est atteinte ; paginer en incrémental (cf. M2)                                                                                                                   | Test : warn émis au-delà de 300                                                                                 |
| L8  | Page de dev accessible en prod        | Low       | `app/dev/voice/page.tsx`                                                                                                                                                                             | Accessible sans auth, y compris en prod                                                                                                                  | `notFound()` si `NODE_ENV === 'production'`                                                                                                                                                     | Build prod : `/dev/voice` → 404                                                                                 |
| L10 | Réponse tree non validée côté client  | Low       | `adapters/http/createHttpRepo.ts:88-95`                                                                                                                                                              | Pas de Zod contrairement aux autres réponses                                                                                                             | `repoTreeNodeSchema.array().parse(...)`                                                                                                                                                         | Test : réponse invalide rejetée                                                                                 |
| L14 | Incohérence ADR 0010 CA4 / Décision   | Low (doc) | `docs/adr/0010-tri-des-mails.md:78`                                                                                                                                                                  | CA4 dit « non → non journalisé » alors que la Décision (et le code) journalise oui et non ; ADR tous « Proposé »                                         | Corriger CA4 pour l'aligner sur la Décision (journaliser oui et non) ; demander à DevinChat de valider 0010/0011/0012 — ne toucher à rien d'autre dans l'ADR 0010 (H2 ne l'amende pas)          | Diff de l'ADR limité à CA4 (+ statut si DevinChat valide)                                                       |

---

## Section optionnelle — points marqués « préférence » dans la revue

À traiter **seulement** si DevinChat le demande.

| id                    | Titre                                      | Fichiers:lignes                                                                                           | Problème                                                                                                               | Correctif proposé                                                                                       | Critères d'acceptation                              |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| L2 (préférence forte) | PAT GitHub à scopes d'écriture accepté     | `lib/github/user.ts:27-73`, `app/api/github/connect/route.ts:49`                                          | Seul `GET /user` valide le PAT ; un PAT classique `repo` sans expiration passe (ADR 0011 CA4 tenu côté code seulement) | Refuser si `x-oauth-scopes` contient un scope d'écriture, ou exiger un PAT fine-grained (`github_pat_`) | Test : PAT classique `repo` → 400                   |
| L3                    | Fichiers sensibles affichés en clair       | `lib/github/getFileContent.ts`                                                                            | `.env`, etc. servis dans l'aperçu (constat HACKER H3)                                                                  | Masquer par défaut `.env*`, `*.pem`, `id_*`                                                             | Test : `.env` masqué                                |
| L9                    | Client Supabase navigateur hors ports      | `features/mail/MailFeedProvider.tsx:74`, `features/mail/hooks/useMailAccounts.ts:53`, `eslint.config.mjs` | Contourne les ports ; exception ESLint `app/api/**` non tracée dans l'ADR 0001                                         | Port `MailFeedPort.subscribe`, ou documenter l'exception dans l'ADR 0001 (avec accord DevinChat)        | Lint au vert sans nouvelle exception non documentée |
| L11                   | Pas d'ETag GitHub                          | `lib/github/request.ts`                                                                                   | `no-store` sans `If-None-Match` consomme le rate limit                                                                 | Requêtes conditionnelles ETag                                                                           | Test : 304 géré                                     |
| L12                   | Pas de contrôle Origin sur les POST d'état | `app/api/github/connect/route.ts`, `app/api/github/disconnect/…`, `app/api/google/oauth/disconnect/…`     | Repose sur SameSite=Lax                                                                                                | Réutiliser `assertSameOrigin` de la route Piper                                                         | Test : Origin étranger → 403                        |
| L13                   | Fuseau implicite                           | `adapters/supabase/createSupabaseMail.ts` (`formatTime`)                                                  | Heure formatée selon le fuseau d'exécution                                                                             | `timeZone: 'Europe/Brussels'` explicite                                                                 | Test : rendu identique quel que soit TZ             |

---

## Décisions DevinChat déjà appliquées dans ce plan

1. Rien n'est stocké sans vrai résumé (H2) — ADR 0010 non amendé.
2. Géoloc côté navigateur — route `/api/geo/reverse` supprimée (M4).
3. L'IA ne fait aucun commit sans « oui » explicite.
4. Purge J-2 retirée pour respecter l'ADR 0010 ; si rétention souhaitée → poser la question + amendement ADR.
5. Réglage inscription Supabase distant = étape manuelle (documentée, hors code).

---

## Checklist finale (avant toute demande de commit/merge)

- [ ] `pnpm install --frozen-lockfile` (aucune nouvelle dépendance non validée)
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test` (y compris tests SQL pgTAP/PGlite et tests de routes de M8)
- [ ] `pnpm format:check`
- [ ] `pnpm build`
- [ ] PoC HACKER : `node /workspace/review-jarvis/poc/sql-poc-03cf47e.mjs` (chemin `MIG` pointé sur le nouveau commit) → (a) permission denied, (b) NULL ou erreur, (c) secret de A intact (`{ n: 1 }`)
- [ ] Aucune migration existante modifiée (`git diff develop -- supabase/migrations` ne montre que des ajouts)
- [ ] ADR 0010 non amendé (hors correction CA4 de L14)
- [ ] Un commit atomique par point, chacun validé par le « oui » de DevinChat
- [ ] Revue finale par THE JUDGE (puis revalidation HACKER de JV-01)

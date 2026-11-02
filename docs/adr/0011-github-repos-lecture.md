# 0011 — GitHub : lecture repos (privés + publics), jeton Vault

- **Statut** : Proposé (étape 2 en cours sur `feature/api` — lecture repos live)
- **Niveau** : 3 (jeton GitHub, repos privés) — **revue HACKER obligatoire avant implémentation**
- **Date** : 2026-11-02
- **Auteur** : ARCHITECT — suite API après [ADR 0010](./0010-tri-des-mails.md)
- **Relecteurs** : HACKER, THE JUDGE

## Contexte

Le panneau REPO home est mock ([ADR 0001](./0001-ui-d-abord-ports-et-mocks.md)). DevinChat veut brancher **tous** ses repos GitHub (privés et publics) en **lecture seule**, avec le même modèle de secret que Gmail : **Supabase Vault**, jamais le jeton en colonne. L’OAuth GitHub pour _login_ reste écarté ([ADR 0008](./0008-auth-email-memoire-supabase.md)) — ici il s’agit d’**accès API**, pas d’auth app.

## Décision

- **Auth API** : **fine-grained PAT** (ou classic `repo` en secours) collé une fois, stocké dans **Vault** ; la table ne garde que `vault_secret_id` + métadonnées (login GitHub, `expires_at`, statut).
- **Portée** : **tous** les repos du compte (privés + publics) — pas d’allowlist en V0b. Le PAT doit être créé avec **Repository access = All repositories** (pas « Public repositories ») ; sinon l’API ne remonte que le public.
- **Lecture seule** : Contents / Metadata / Pull requests en **Read** uniquement. Aucune écriture (push, merge, issue, etc.).
- **Pas de miroir DB des trees** : fetch GitHub **à la demande** via routes serveur (proxy) ; le browser ne voit jamais le PAT.
- **Côté app** : `RepoPort` + adapter mock / futur adapter live ; routes `app/api/github/*` ; RPC Vault `security definer` calquées sur mail.
- **UI** : footer « Lecture seule · GitHub » ; notice d’expiration du jeton (`expires_at`).

### Découpage

**Étape 1 — Connexion seule**

- Table `github_connections` (1 ligne / user JARVIS) + Vault.
- API : enregistrer PAT (valider via `GET /user`), status, révoquer (purge Vault).
- Panneau REPO : états connecté / déconnecté / `needs_reauth` — tree/commits/PR live (étape 2).

**Étape 2 — Lecture API**

- `RepoPort` : listRepos, tree, commits, pulls, contenu fichier (limite 512 Ko UI déjà prévue).
- Brancher le panneau sur les données live (loading / error / empty / nominal).

## Options envisagées

1. **Fine-grained PAT + Vault + tous les repos** — retenu : usage perso, expiration = notice UI, scopes minimaux Read, même pattern Vault que Gmail.
2. **OAuth GitHub App (user-to-server)** — non pour V0b : friction App + callback pour un seul user ; réévaluable plus tard.
3. **GitHub App (installation)** — non : webhooks / multi-install inutiles tant que l’agent n’écrit pas.
4. **Allowlist de repos** — écarté (2026-11-02) : DevinChat veut **tous** privés + publics.
5. **Jeton en colonne chiffrée** — non : même raison qu’ADR 0010 (Vault + référence).
6. **Sync complète trees en Postgres** — non : coût / fraîcheur ; fetch à la demande suffit pour l’UI.

## Conséquences

- **Gain** : panneau REPO branchable sans toucher l’auth e-mail ; APIs prêtes avant LLM / agent ; secret isolé comme Gmail.
- **Risque** : PAT volé = lecture de tous les repos privés → mitigation Vault + RLS + proxy serveur + revoke immédiat ; expiration → `needs_reauth` + notice UI.
- **Coût** : 1 secret Vault / user ; rate limits GitHub API (à respecter en étape 2 : ETag / cache court si besoin).
- **Process** : zéro commit d’implémentation étape 1 sans validation DevinChat **et** relecture HACKER (niveau 3).

## Critères d’acceptation

| ID  | Critère                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------- |
| CA1 | Connexion : PAT validé (`/user`) ; seul `vault_secret_id` en base ; jamais le PAT au client après submit. |
| CA2 | Disconnect : secret Vault détruit ; plus aucun appel GitHub possible pour ce user.                        |
| CA3 | Étape 1 : aucun listing tree/commits/PR live (hors validation `/user` à la connexion).                    |
| CA4 | Étape 2 : scopes Read uniquement — aucun endpoint d’écriture GitHub dans le code JARVIS.                  |
| CA5 | Repos privés **et** publics listables (pas de filtre allowlist).                                          |

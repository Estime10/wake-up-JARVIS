# Note d’avancement — feature/api (2026-11-04)

Synthèse de **tout** ce qui a été livré sur la ligne `feature/api` (puis `refonte-ui` fusionnée), après le plan de correction et la refonte home.

## UI home (refonte)

- Grille home : colonne gauche CTA / tiroirs ; messages centrés ; **tiroir droit Supabase** (`w-1/3`).
- Tiroirs : terminal, GitHub (moitiés fichiers / aperçu), mails (liste + preview), Supabase.
- Motions : `usePresenceMotion`, slide in/out (dont `RIGHT_SLIDE_OUT`).
- Boot in-home (overlay scan + mark) ; géoloc UI/TTS **retirée** (M4 + cleanup produit).
- Borders bulles allégées ; chargement messages plus anciens ; animations fermeture tiroirs.

## Mail (ADR 0010)

- OAuth Gmail `gmail.readonly`, multi-boîtes, Vault.
- Relève / tri déterministe / `mail_items` + Realtime ; résumé sur consentement (`mail_reads`).
- Purges admin : **épargnent** `mail_reads` (M1) ; plus de snippet / résumé tronqué persisté (H2).

## GitHub (ADR 0011)

- Fine-grained PAT → Vault ; panneau repos live (branches, tree, commits, PR, contents).
- Lockdown `vault_secret_id` (H1) — lecture jeton liée au propriétaire.

## Voix (ADR 0012)

- Piper siwis FR via `/api/voice/piper` ; greeting / briefing TTS ; repli `speechSynthesis`.

## Sécurité (plan correction)

| Id       | Sujet                                                        | État              |
| -------- | ------------------------------------------------------------ | ----------------- |
| H1       | Lockdown Vault mail + GitHub                                 | Fait              |
| H2       | Pas de snippet / résumé tronqué                              | Fait              |
| M1       | Purge épargne `mail_reads`                                   | Fait              |
| M2/M3/M5 | Rate-limit, debounce Realtime, anti-ReDoS                    | Fait / vérifié    |
| M4       | Géoloc navigateur ; route geo serveur retirée                | Fait              |
| M7       | Signup fermé (manuel) + `OWNER_EMAILS`                       | Fait (doc + code) |
| —        | Advisors GraphQL 0026/0027 : revoke anon + drop `pg_graphql` | Fait (2026-11-04) |

Migration : `supabase/migrations/20261104172000_revoke_anon_and_drop_pg_graphql.sql`  
Config locale : `schemas = ["public"]` (plus de `graphql_public`).

## Platform Supabase + Studio (ADR 0013)

- Multi-comptes Management API (`sbp_`) en Vault.
- Docker ensure + `supabase start` ; API locale **`:54331`** ; Studio **`:54323`**.
- Embed tiroir via proxy **`:54332`** (strip `frame-ancestors` / `X-Frame-Options`).
- CSP : `frame-src 'self' http://127.0.0.1:54332`.

## Branches

- Travail intégré sur **`feature/api`**, puis fusion vers **`develop`**.
- ADR : [0013](../adr/0013-supabase-platform-studio-embarque.md) · index [docs/adr](../adr/README.md).

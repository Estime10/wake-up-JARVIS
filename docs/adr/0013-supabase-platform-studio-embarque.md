# 0013 — Platform Supabase multi-comptes + Studio embarqué (tiroir droit)

- **Statut** : Proposé
- **Niveau** : 2 (jetons Management API en Vault, Docker local)
- **Date** : 2026-11-04
- **Auteur** : ARCHITECT — impl. `refonte-ui` / `feature/api`
- **Relecteurs** : HACKER, THE JUDGE, PIXEL

## Contexte

DevinChat veut brancher **plusieurs comptes** Supabase (orgs / perso / clients) depuis JARVIS, choisir un projet, démarrer la stack locale (`supabase start`) et **voir Studio dans le tiroir droit** — pas dans un onglet externe. L’iframe directe vers `:54323` est bloquée (`Content-Security-Policy: frame-ancestors 'none'` + `X-Frame-Options: DENY`).

## Décision

- **Multi-comptes** : table `public.supabase_platform_connections` — 1 ligne = 1 access token Management API (`sbp_…`) en **Vault** (`vs.name = supabase_platform_<id>`, garde read/delete) ; colonnes UI sans `vault_secret_id` ; `is_active` = session courante ; **max 5** comptes / user (DEV-14).
- **API** : routes `app/api/supabase/platform/*` (connect, status, disconnect, projects, select-project, set-active, docker/ensure, studio/start) — owner only (`requireOwnerAccess`).
- **Docker / Studio** : `ensureDockerRunning` + `supabase start` en Node (`ALLOW_LOCAL_STUDIO` / `NODE_ENV=development`). API locale sur **`:54331`** (évite conflit CleanMyMac sur `:54321`) ; Studio reste `:54323`.
- **Embed Next** : reverse-proxy local **`:54332`** (`studioEmbedProxy`) ; Host allowlist (`127.0.0.1` / `localhost`:+port) ; CSP réponse `frame-ancestors` borné à l’origine app (`:3000`) — **pas** de strip total (DEV-3) ; iframe dans `SupabaseStudioBrowser` ; CSP app `frame-src` Studio **dev-only**.
- **Tauri (plus tard)** : WebView top-level dédié — même chrome tiroir, sans proxy.

## Options envisagées

1. **Proxy CSP-strip + iframe** — retenu pour Next aujourd’hui.
2. **`window.open` Studio** — écarté : pas « dans le tiroir ».
3. **Iframe directe `:54323`** — impossible (CSP Studio).
4. **Proxy path sous Next (`/studio-proxy/*`)** — écarté : collision `/_next` avec l’app.

## Conséquences

- **Gain** : workflow Connect → projets → Docker → Studio dans le panneau droit ; multi-comptes Vault aligné GitHub/mail.
- **Risque** : proxy local uniquement en process Next ; HMR / multi-workers → `EADDRINUSE` toléré ; Studio local sans auth app — mitigé par bind `127.0.0.1`, Host allowlist et `frame-ancestors` borné ; iframe reste un workaround jusqu’à Tauri.
- **Coût** : port embed + doc CSP ; pas de GraphQL (voir lockdown grants / drop `pg_graphql`).

## Critères d’acceptation

| ID  | Critère                                                                 |
| --- | ----------------------------------------------------------------------- |
| CA1 | Plusieurs comptes connectés ; un seul `is_active` ; tokens hors UI.     |
| CA2 | Clic projet → Docker ensure ; Start Studio → stack up ou `port_in_use`. |
| CA3 | Après start, le tiroir affiche Studio via `:54332` (pas d’onglet).      |
| CA4 | API locale configurable (`supabase/config.toml` `[api] port = 54331`).  |

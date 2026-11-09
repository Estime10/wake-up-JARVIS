# 0013 — Platform Supabase multi-comptes + Studio embarqué (tiroir droit)

- **Statut** : Proposé
- **Niveau** : 2 (jetons Management API en Vault, Docker local)
- **Date** : 2026-11-04
- **Révisé** : 2026-11-09 (Studio plein panneau ; navigateur libre reporté Tauri)
- **Auteur** : ARCHITECT — impl. `refonte-ui` / `feature/api` ; passe doc 2026-11-07
- **Relecteurs** : HACKER, THE JUDGE, PIXEL

## Contexte

DevinChat veut brancher **plusieurs comptes** Supabase (orgs / perso / clients) depuis E.L.S.A., choisir un projet, démarrer la stack locale (`supabase start`) et **voir Studio dans le tiroir droit** — pas dans un onglet externe. L’iframe directe vers `:54323` est bloquée (`Content-Security-Policy: frame-ancestors 'none'` + `X-Frame-Options: DENY`).

Il veut aussi, **sous Studio**, un **navigateur libre** (barre d’URL) dans le même tiroir. En Next web, un vrai WebView n’existe pas ; beaucoup de sites refusent l’embed.

## Décision

- **Multi-comptes** : table `public.supabase_platform_connections` — 1 ligne = 1 access token Management API (`sbp_…`) en **Vault** (`vs.name = supabase_platform_<id>`, garde read/delete) ; colonnes UI sans `vault_secret_id` ; `is_active` = session courante ; **max 5** comptes / user (DEV-14).
- **API** : routes `app/api/supabase/platform/*` (connect, status, disconnect, projects, select-project, set-active, docker/ensure, studio/start|stop) — owner only (`requireOwnerAccess`).
- **Docker / Studio** : `ensureDockerRunning` + `supabase start` en Node (`ALLOW_LOCAL_STUDIO` / `NODE_ENV=development`). API locale sur **`:54331`** (évite conflit CleanMyMac sur `:54321`) ; Studio reste `:54323`.
- **Embed Studio** : reverse-proxy local **`:54332`** (`studioEmbedProxy`) ; Host allowlist (`127.0.0.1` / `localhost`:+port) ; CSP réponse `frame-ancestors` borné à l’origine app (`:3000`) — **pas** de strip total (DEV-3) ; iframe dans `SupabaseStudioBrowser`.
- **Tiroir Studio** : quand Studio est ouvert, `StudioBrowserSplit` = **plein panneau** Studio (web = iframe `:54332` ; Tauri = child WKWebView). Plus de split 50/50.
- **Navigateur libre** : **reporté** au shell Tauri (plan `PLAN-tauri-elsa`) — util `normalizeSideBrowserUrl` conservé. Pas de proxy générique anti-frame (open-proxy interdit).
- **CSP app (`proxy.ts`)** : en **dev** uniquement — `frame-src 'self' http://127.0.0.1:54332 https: http:` (Studio + aperçu sites frameables) ; en **prod** — `frame-src 'self'`.
- **Tauri** : child WebView Studio (`elsa-studio`) ; navigateur libre (`elsa-browser`) prévu ensuite.

## Options envisagées

1. **Proxy CSP-strip + iframe Studio** — retenu pour Next aujourd’hui.
2. **`window.open` Studio** — écarté : pas « dans le tiroir ».
3. **Iframe directe `:54323`** — impossible (CSP Studio).
4. **Proxy path sous Next (`/studio-proxy/*`)** — écarté : collision `/_next` avec l’app.
5. **Proxy générique pour le navigateur libre** — écarté : surface open-proxy / strip CSP arbitraire.
6. **WebView Tauri dès maintenant** — reporté (shell Mac pas encore dans ce dépôt).

## Conséquences

- **Gain** : workflow Connect → projets → Docker → Studio + navigateur libre dans le panneau droit ; multi-comptes Vault aligné GitHub/mail.
- **Risque** : proxy Studio local (process Next, `EADDRINUSE` toléré) ; navigateur libre souvent page blanche (anti-frame des sites) malgré `frame-src` élargi en dev ; iframe reste un workaround jusqu’à Tauri.
- **Coût** : port embed + doc CSP ; pas de GraphQL (lockdown grants / drop `pg_graphql`).

## Critères d’acceptation

| ID  | Critère                                                                     |
| --- | --------------------------------------------------------------------------- |
| CA1 | Plusieurs comptes connectés ; un seul `is_active` ; tokens hors UI.         |
| CA2 | Clic projet → Docker ensure ; Start Studio → stack up ou `port_in_use`.     |
| CA3 | Après start, le tiroir affiche Studio via `:54332` (pas d’onglet).          |
| CA4 | API locale configurable (`supabase/config.toml` `[api] port = 54331`).      |
| CA5 | Studio ouvert → plein panneau droite ; « ← projets » + URL dans le top bar. |
| CA6 | Navigateur libre : URL normalisée ; `javascript:` / `file:` / etc. refusés. |

# 0008 — Auth e-mail + mémoire Supabase (V0b partiel)

- **Statut** : Proposé
- **Date** : 2026-11-02
- **Relecteurs** : THE JUDGE, PIXEL, HACKER

## Contexte

La V0 UI est branchable. On a besoin d’une identité persistante et d’une mémoire conversation avant LLM/voix réels. OAuth GitHub a été écarté au profit d’e-mail/mot de passe (plus simple pour un usage perso).

## Décision

- **Auth** : Supabase Auth e-mail/password ; `AuthProvider` ; gate splash → `/login` → `/home` (RLS `messages` déjà par `auth.uid()`).
- **Mémoire** : `MemoryPort` via `adapters/supabase` si env publique présente, sinon mock ; sans session → seed local, pas d’écriture distante.
- **Composition** : `createAppPorts()` appelé seulement depuis `app/providers.tsx`.
- **Système** : `not-found` / `error` / `global-error` brandés (`SystemNoticeScreen`) ; états mails/mémoire loading·empty·error.
- **Hors sujet volontaire** : pas d’écoute `navigator.onLine` (outil perso desktop).

## Options envisagées

1. **E-mail/password Supabase** — retenue : un provider, session cookies SSR, register = premier login.
2. **OAuth GitHub** — écarté : friction App OAuth pour un seul utilisateur.
3. **Reporter toute auth** — écarté : RLS mémoire inutilisable sans `auth.users`.

## Conséquences

- **Gain** : mémoire réelle dès qu’on est connecté ; UI inchangée hors gate ; CSP `connect-src` déjà étendu à `*.supabase.co`.
- **Risque** : confirmation e-mail dashboard (désactiver en local sans SMTP) ; secrets uniquement hors git (`.env.local`).
- **Coût** : clients `@supabase/ssr`, migration `messages`, doc env (`.env.example`).

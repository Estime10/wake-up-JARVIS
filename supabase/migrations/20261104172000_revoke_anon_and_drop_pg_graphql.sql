-- Advisors GraphQL 0026 / 0027.
-- JARVIS n’utilise pas pg_graphql (PostgREST + RLS seulement).
-- 1) Retirer les grants « ALL » hérités à anon/PUBLIC sur les tables métier.
-- 2) Re-grant least-privilege à authenticated (ce que l’app lit/écrit vraiment).
-- 3) Drop pg_graphql → plus d’exposition schema GraphQL (0027).

-- ---------------------------------------------------------------------------
-- mail_items — SELECT client uniquement (écritures via service_role / RPC)
-- ---------------------------------------------------------------------------
revoke all on table public.mail_items from anon, authenticated, public;
grant select on table public.mail_items to authenticated;

-- ---------------------------------------------------------------------------
-- mail_reads — SELECT + INSERT (journal consentement résumé)
-- ---------------------------------------------------------------------------
revoke all on table public.mail_reads from anon, authenticated, public;
grant select, insert on table public.mail_reads to authenticated;

-- ---------------------------------------------------------------------------
-- mail_rules — SELECT + INSERT + UPDATE (pas de DELETE client)
-- ---------------------------------------------------------------------------
revoke all on table public.mail_rules from anon, authenticated, public;
grant select, insert, update on table public.mail_rules to authenticated;

-- ---------------------------------------------------------------------------
-- messages — SELECT + INSERT (mémoire append-only)
-- ---------------------------------------------------------------------------
revoke all on table public.messages from anon, authenticated, public;
grant select, insert on table public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- profiles — SELECT + UPDATE (création via trigger auth)
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated, public;
grant select, update on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Tables déjà column-grant : s’assurer qu’anon / PUBLIC n’ont rien
-- ---------------------------------------------------------------------------
revoke all on table public.mail_accounts from anon, public;
revoke all on table public.github_connections from anon, public;
revoke all on table public.supabase_platform_connections from anon, public;

-- ---------------------------------------------------------------------------
-- Pas de GraphQL auto — REST / Realtime inchangés
-- ---------------------------------------------------------------------------
drop extension if exists pg_graphql cascade;

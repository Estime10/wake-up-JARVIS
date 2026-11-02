-- ADR 0011 étape 1 — connexion GitHub (PAT fine-grained).
-- Jeton dans Vault ; github_connections ne garde que secret_id.

create extension if not exists supabase_vault with schema vault;

create schema if not exists private;

create type public.github_connection_status as enum (
  'active',
  'needs_reauth'
);

-- Une connexion GitHub par user JARVIS (tous repos privés + publics).
create table public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  github_user_id bigint not null,
  github_login text not null,
  status public.github_connection_status not null default 'active',
  vault_secret_id uuid not null,
  -- Expiration déclarée du PAT (notice UI) ; null si inconnue.
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index github_connections_user_idx on public.github_connections (user_id);

comment on table public.github_connections is
  'Connexion GitHub JARVIS — secret_id Vault, jamais le PAT.';

comment on column public.github_connections.vault_secret_id is
  'UUID vault.secrets — fine-grained PAT (Read).';

comment on column public.github_connections.expires_at is
  'Fin de validité du PAT (saisie / connue) — pour la notice UI.';

alter table public.github_connections enable row level security;

create policy "github_connections_select_own"
  on public.github_connections
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Pas d'INSERT/UPDATE/DELETE client : uniquement via RPC admin (service_role).

create or replace function private.github_connection_store_token(
  p_user_id uuid,
  p_github_user_id bigint,
  p_github_login text,
  p_token text,
  p_expires_at timestamptz
)
returns public.github_connections
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_existing public.github_connections;
  v_row public.github_connections;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'github_token_required';
  end if;

  if p_github_login is null or length(trim(p_github_login)) = 0 then
    raise exception 'github_login_required';
  end if;

  select * into v_existing
  from public.github_connections
  where user_id = p_user_id;

  if v_existing.id is not null then
    perform vault.update_secret(
      v_existing.vault_secret_id,
      p_token,
      'github_pat_' || v_existing.id::text,
      'GitHub fine-grained PAT'
    );
    update public.github_connections
    set
      github_user_id = p_github_user_id,
      github_login = p_github_login,
      status = 'active',
      expires_at = p_expires_at,
      updated_at = now()
    where id = v_existing.id
    returning * into v_row;
    return v_row;
  end if;

  v_secret_id := vault.create_secret(
    p_token,
    null,
    'GitHub PAT pending row'
  );

  insert into public.github_connections (
    user_id,
    github_user_id,
    github_login,
    status,
    vault_secret_id,
    expires_at
  )
  values (
    p_user_id,
    p_github_user_id,
    p_github_login,
    'active',
    v_secret_id,
    p_expires_at
  )
  returning * into v_row;

  perform vault.update_secret(
    v_secret_id,
    p_token,
    'github_pat_' || v_row.id::text,
    'GitHub fine-grained PAT'
  );

  return v_row;
end;
$$;

create or replace function private.github_connection_delete(
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_id uuid;
begin
  select id, vault_secret_id into v_id, v_secret_id
  from public.github_connections
  where user_id = p_user_id;

  if v_secret_id is null then
    raise exception 'github_connection_not_found';
  end if;

  perform set_config('app.github_connections_allow_delete', 'on', true);

  delete from public.github_connections
  where id = v_id and user_id = p_user_id;

  delete from vault.secrets where id = v_secret_id;

  return v_secret_id;
end;
$$;

create or replace function private.github_connection_read_token(
  p_secret_id uuid
)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where id = p_secret_id;
$$;

create or replace function private.forbid_github_connections_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'github_connections_delete_forbidden';
end;
$$;

create trigger github_connections_no_delete
  before delete on public.github_connections
  for each row
  when (current_setting('app.github_connections_allow_delete', true) is distinct from 'on')
  execute function private.forbid_github_connections_delete();

create or replace function public.admin_github_connection_store_token(
  p_user_id uuid,
  p_github_user_id bigint,
  p_github_login text,
  p_token text,
  p_expires_at timestamptz
)
returns public.github_connections
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.github_connection_store_token(
    p_user_id,
    p_github_user_id,
    p_github_login,
    p_token,
    p_expires_at
  );
end;
$$;

create or replace function public.admin_github_connection_delete(
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.github_connection_delete(p_user_id);
end;
$$;

create or replace function public.admin_github_connection_read_token(
  p_secret_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.github_connection_read_token(p_secret_id);
end;
$$;

revoke all on function public.admin_github_connection_store_token(uuid, bigint, text, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.admin_github_connection_delete(uuid)
  from public, anon, authenticated;
revoke all on function public.admin_github_connection_read_token(uuid)
  from public, anon, authenticated;

grant execute on function public.admin_github_connection_store_token(uuid, bigint, text, text, timestamptz)
  to service_role;
grant execute on function public.admin_github_connection_delete(uuid)
  to service_role;
grant execute on function public.admin_github_connection_read_token(uuid)
  to service_role;

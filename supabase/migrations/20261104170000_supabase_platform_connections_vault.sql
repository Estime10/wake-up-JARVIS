-- Connexion platform Supabase (Management API access token).
-- Jeton dans Vault ; selected_project_* pour la session multi-projets.

create extension if not exists supabase_vault with schema vault;

create schema if not exists private;

create type public.supabase_platform_connection_status as enum (
  'active',
  'needs_reauth'
);

create table public.supabase_platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_label text not null,
  status public.supabase_platform_connection_status not null default 'active',
  vault_secret_id uuid not null,
  selected_project_ref text,
  selected_project_name text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index supabase_platform_connections_user_idx
  on public.supabase_platform_connections (user_id);

comment on table public.supabase_platform_connections is
  'Connexion Management API Supabase — secret_id Vault, jamais le token.';

comment on column public.supabase_platform_connections.vault_secret_id is
  'UUID vault.secrets — access token platform (sbp_).';

comment on column public.supabase_platform_connections.selected_project_ref is
  'Projet cloud actif (ref) pour la session UI.';

alter table public.supabase_platform_connections enable row level security;

create policy "supabase_platform_connections_select_own"
  on public.supabase_platform_connections
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.supabase_platform_connections from anon, authenticated;

grant select (
  id,
  user_id,
  account_label,
  status,
  selected_project_ref,
  selected_project_name,
  connected_at,
  updated_at
) on table public.supabase_platform_connections to authenticated;

create or replace function private.supabase_platform_connection_store_token(
  p_user_id uuid,
  p_account_label text,
  p_token text
)
returns public.supabase_platform_connections
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_existing public.supabase_platform_connections;
  v_row public.supabase_platform_connections;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'supabase_platform_token_required';
  end if;

  if p_account_label is null or length(trim(p_account_label)) = 0 then
    raise exception 'supabase_platform_label_required';
  end if;

  select * into v_existing
  from public.supabase_platform_connections
  where user_id = p_user_id;

  if v_existing.id is not null then
    perform vault.update_secret(
      v_existing.vault_secret_id,
      p_token,
      'supabase_platform_' || v_existing.id::text,
      'Supabase platform access token'
    );
    update public.supabase_platform_connections
    set
      account_label = p_account_label,
      status = 'active',
      updated_at = now()
    where id = v_existing.id
    returning * into v_row;
    return v_row;
  end if;

  v_secret_id := vault.create_secret(
    p_token,
    null,
    'Supabase platform token pending row'
  );

  insert into public.supabase_platform_connections (
    user_id,
    account_label,
    status,
    vault_secret_id
  )
  values (
    p_user_id,
    p_account_label,
    'active',
    v_secret_id
  )
  returning * into v_row;

  perform vault.update_secret(
    v_secret_id,
    p_token,
    'supabase_platform_' || v_row.id::text,
    'Supabase platform access token'
  );

  return v_row;
end;
$$;

create or replace function private.supabase_platform_connection_delete(
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
  from public.supabase_platform_connections
  where user_id = p_user_id;

  if v_secret_id is null then
    raise exception 'supabase_platform_connection_not_found';
  end if;

  perform set_config('app.supabase_platform_connections_allow_delete', 'on', true);

  delete from public.supabase_platform_connections
  where id = v_id and user_id = p_user_id;

  delete from vault.secrets where id = v_secret_id;

  return v_secret_id;
end;
$$;

create or replace function private.supabase_platform_connection_read_token(
  p_user_id uuid,
  p_connection_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  select ds.decrypted_secret into v_token
  from public.supabase_platform_connections spc
  join vault.decrypted_secrets ds on ds.id = spc.vault_secret_id
  join vault.secrets vs on vs.id = spc.vault_secret_id
  where spc.id = p_connection_id
    and spc.user_id = p_user_id
    and (
      coalesce(vs.description, '') ilike 'Supabase platform access token%'
      or coalesce(vs.description, '') ilike 'Supabase platform token%'
    );

  return v_token;
end;
$$;

create or replace function private.supabase_platform_connection_select_project(
  p_user_id uuid,
  p_project_ref text,
  p_project_name text
)
returns public.supabase_platform_connections
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.supabase_platform_connections;
begin
  if p_project_ref is null or length(trim(p_project_ref)) = 0 then
    raise exception 'supabase_platform_project_ref_required';
  end if;

  update public.supabase_platform_connections
  set
    selected_project_ref = trim(p_project_ref),
    selected_project_name = nullif(trim(coalesce(p_project_name, '')), ''),
    updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'supabase_platform_connection_not_found';
  end if;

  return v_row;
end;
$$;

create or replace function private.forbid_supabase_platform_connections_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'supabase_platform_connections_delete_forbidden';
end;
$$;

create trigger supabase_platform_connections_no_delete
  before delete on public.supabase_platform_connections
  for each row
  when (
    current_setting('app.supabase_platform_connections_allow_delete', true)
    is distinct from 'on'
  )
  execute function private.forbid_supabase_platform_connections_delete();

create or replace function public.admin_supabase_platform_connection_store_token(
  p_user_id uuid,
  p_account_label text,
  p_token text
)
returns public.supabase_platform_connections
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.supabase_platform_connection_store_token(
    p_user_id,
    p_account_label,
    p_token
  );
end;
$$;

create or replace function public.admin_supabase_platform_connection_delete(
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.supabase_platform_connection_delete(p_user_id);
end;
$$;

create or replace function public.admin_supabase_platform_connection_read_token(
  p_user_id uuid,
  p_connection_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.supabase_platform_connection_read_token(
    p_user_id,
    p_connection_id
  );
end;
$$;

create or replace function public.admin_supabase_platform_connection_select_project(
  p_user_id uuid,
  p_project_ref text,
  p_project_name text
)
returns public.supabase_platform_connections
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.supabase_platform_connection_select_project(
    p_user_id,
    p_project_ref,
    p_project_name
  );
end;
$$;

revoke all on function public.admin_supabase_platform_connection_store_token(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_supabase_platform_connection_delete(uuid)
  from public, anon, authenticated;
revoke all on function public.admin_supabase_platform_connection_read_token(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.admin_supabase_platform_connection_select_project(uuid, text, text)
  from public, anon, authenticated;

grant execute on function public.admin_supabase_platform_connection_store_token(uuid, text, text)
  to service_role;
grant execute on function public.admin_supabase_platform_connection_delete(uuid)
  to service_role;
grant execute on function public.admin_supabase_platform_connection_read_token(uuid, uuid)
  to service_role;
grant execute on function public.admin_supabase_platform_connection_select_project(uuid, text, text)
  to service_role;

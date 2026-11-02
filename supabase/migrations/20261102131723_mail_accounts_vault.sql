-- ADR 0010 étape 1 — boîtes Gmail connectées.
-- Jeton refresh dans Vault ; mail_accounts ne garde que secret_id.

create extension if not exists supabase_vault with schema vault;

create schema if not exists private;

create type public.mail_account_status as enum (
  'active',
  'disabled',
  'needs_reauth'
);

create table public.mail_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'gmail' check (provider = 'gmail'),
  email text not null,
  label text not null,
  status public.mail_account_status not null default 'active',
  vault_secret_id uuid not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, email)
);

create index mail_accounts_user_idx on public.mail_accounts (user_id);

comment on table public.mail_accounts is
  'Boîtes Gmail liées à un user JARVIS — secret_id Vault, jamais le jeton.';

comment on column public.mail_accounts.vault_secret_id is
  'UUID vault.secrets — refresh token Google.';

alter table public.mail_accounts enable row level security;

create policy "mail_accounts_select_own"
  on public.mail_accounts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "mail_accounts_update_own"
  on public.mail_accounts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Pas d'INSERT/DELETE client : uniquement via RPC admin (service_role).

create or replace function private.mail_account_store_token(
  p_user_id uuid,
  p_email text,
  p_label text,
  p_refresh_token text
)
returns public.mail_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_existing public.mail_accounts;
  v_row public.mail_accounts;
  v_count int;
begin
  if p_refresh_token is null or length(trim(p_refresh_token)) = 0 then
    raise exception 'refresh_token required';
  end if;

  select * into v_existing
  from public.mail_accounts
  where user_id = p_user_id and email = lower(p_email);

  if v_existing.id is not null then
    perform vault.update_secret(
      v_existing.vault_secret_id,
      p_refresh_token,
      'gmail_rt_' || v_existing.id::text,
      'Gmail refresh token'
    );
    update public.mail_accounts
    set
      label = p_label,
      status = 'active',
      updated_at = now()
    where id = v_existing.id
    returning * into v_row;
    return v_row;
  end if;

  select count(*) into v_count
  from public.mail_accounts
  where user_id = p_user_id;

  if v_count >= 3 then
    raise exception 'mail_account_limit';
  end if;

  v_secret_id := vault.create_secret(
    p_refresh_token,
    null,
    'Gmail refresh token pending row'
  );

  insert into public.mail_accounts (
    user_id, email, label, status, vault_secret_id
  )
  values (
    p_user_id, lower(p_email), p_label, 'active', v_secret_id
  )
  returning * into v_row;

  perform vault.update_secret(
    v_secret_id,
    p_refresh_token,
    'gmail_rt_' || v_row.id::text,
    'Gmail refresh token'
  );

  return v_row;
end;
$$;

create or replace function private.mail_account_delete(
  p_user_id uuid,
  p_account_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
begin
  select vault_secret_id into v_secret_id
  from public.mail_accounts
  where id = p_account_id and user_id = p_user_id;

  if v_secret_id is null then
    raise exception 'mail_account_not_found';
  end if;

  perform set_config('app.mail_accounts_allow_delete', 'on', true);

  delete from public.mail_accounts
  where id = p_account_id and user_id = p_user_id;

  delete from vault.secrets where id = v_secret_id;

  return v_secret_id;
end;
$$;

create or replace function private.mail_account_read_token(
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

create or replace function private.forbid_mail_accounts_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'mail_accounts_delete_forbidden';
end;
$$;

create trigger mail_accounts_no_delete
  before delete on public.mail_accounts
  for each row
  when (current_setting('app.mail_accounts_allow_delete', true) is distinct from 'on')
  execute function private.forbid_mail_accounts_delete();

-- Wrappers public : PostgREST n'expose pas `private` ; garde-fou service_role.
-- Accès limité par GRANT EXECUTE TO service_role (pas auth.role() :
-- peu fiable selon le contexte JWT / security definer).
create or replace function public.admin_mail_account_store_token(
  p_user_id uuid,
  p_email text,
  p_label text,
  p_refresh_token text
)
returns public.mail_accounts
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.mail_account_store_token(
    p_user_id, p_email, p_label, p_refresh_token
  );
end;
$$;

create or replace function public.admin_mail_account_delete(
  p_user_id uuid,
  p_account_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.mail_account_delete(p_user_id, p_account_id);
end;
$$;

create or replace function public.admin_mail_account_read_token(
  p_secret_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.mail_account_read_token(p_secret_id);
end;
$$;

revoke all on function public.admin_mail_account_store_token(uuid, text, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_mail_account_delete(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.admin_mail_account_read_token(uuid)
  from public, anon, authenticated;

grant execute on function public.admin_mail_account_store_token(uuid, text, text, text)
  to service_role;
grant execute on function public.admin_mail_account_delete(uuid, uuid)
  to service_role;
grant execute on function public.admin_mail_account_read_token(uuid)
  to service_role;

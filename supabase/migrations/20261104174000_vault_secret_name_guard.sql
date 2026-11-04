-- DEV-2 — garde par nom Vault (gmail_rt_<id> / github_pat_<id>).
-- Pré-vol prod (2026-11-04) : 0 mismatch / 0 secret partagé.
-- Empêche read/delete d’un secret détourné (pointeur hérité).

create or replace function private.mail_account_read_token(
  p_user_id uuid,
  p_account_id uuid
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
  from public.mail_accounts ma
  join vault.decrypted_secrets ds on ds.id = ma.vault_secret_id
  join vault.secrets vs on vs.id = ma.vault_secret_id
  where ma.id = p_account_id
    and ma.user_id = p_user_id
    and vs.name = 'gmail_rt_' || ma.id::text
    and not exists (
      select 1
      from public.github_connections gc
      where gc.vault_secret_id = ma.vault_secret_id
    )
    and coalesce(vs.description, '') ilike 'Gmail refresh token%';

  return v_token;
end;
$$;

create or replace function private.github_connection_read_token(
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
  from public.github_connections gc
  join vault.decrypted_secrets ds on ds.id = gc.vault_secret_id
  join vault.secrets vs on vs.id = gc.vault_secret_id
  where gc.id = p_connection_id
    and gc.user_id = p_user_id
    and vs.name = 'github_pat_' || gc.id::text
    and not exists (
      select 1
      from public.mail_accounts ma
      where ma.vault_secret_id = gc.vault_secret_id
    )
    and (
      coalesce(vs.description, '') ilike 'GitHub fine-grained PAT%'
      or coalesce(vs.description, '') ilike 'GitHub PAT%'
    );

  return v_token;
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
  select ma.vault_secret_id into v_secret_id
  from public.mail_accounts ma
  join vault.secrets vs on vs.id = ma.vault_secret_id
  where ma.id = p_account_id
    and ma.user_id = p_user_id
    and vs.name = 'gmail_rt_' || ma.id::text
    and not exists (
      select 1
      from public.github_connections gc
      where gc.vault_secret_id = ma.vault_secret_id
    );

  if v_secret_id is null then
    raise exception 'mail_account_not_found';
  end if;

  perform set_config('app.mail_items_allow_delete', 'on', true);
  perform set_config('app.mail_accounts_allow_delete', 'on', true);

  delete from public.mail_items where account_id = p_account_id;
  delete from public.mail_accounts
  where id = p_account_id and user_id = p_user_id;

  delete from vault.secrets
  where id = v_secret_id
    and name = 'gmail_rt_' || p_account_id::text;

  return v_secret_id;
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
  select gc.id, gc.vault_secret_id into v_id, v_secret_id
  from public.github_connections gc
  join vault.secrets vs on vs.id = gc.vault_secret_id
  where gc.user_id = p_user_id
    and vs.name = 'github_pat_' || gc.id::text
    and not exists (
      select 1
      from public.mail_accounts ma
      where ma.vault_secret_id = gc.vault_secret_id
    );

  if v_secret_id is null then
    raise exception 'github_connection_not_found';
  end if;

  perform set_config('app.github_connections_allow_delete', 'on', true);

  delete from public.github_connections
  where id = v_id and user_id = p_user_id;

  delete from vault.secrets
  where id = v_secret_id
    and name = 'github_pat_' || v_id::text;

  return v_secret_id;
end;
$$;

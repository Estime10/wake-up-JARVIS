-- H1 / JV-01 — lockdown vault_secret_id (mail + GitHub).
-- Lecture jeton liée à (user, compte/connexion) ; plus jamais p_secret_id seul.
-- Grants colonnes : authenticated ne voit / ne touche plus vault_secret_id.

-- ---------------------------------------------------------------------------
-- mail_accounts : privileges colonnes + drop UPDATE client
-- ---------------------------------------------------------------------------
revoke all on table public.mail_accounts from anon, authenticated;

grant select (
  id,
  user_id,
  provider,
  email,
  label,
  status,
  connected_at,
  updated_at,
  gmail_history_id
) on table public.mail_accounts to authenticated;

drop policy if exists "mail_accounts_update_own" on public.mail_accounts;

-- Défense en profondeur : colonnes immuables hors chemin admin normal.
create or replace function private.forbid_mail_accounts_immutable_cols()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.vault_secret_id is distinct from old.vault_secret_id
     or new.user_id is distinct from old.user_id
     or new.email is distinct from old.email then
    raise exception 'mail_accounts_immutable_columns';
  end if;
  return new;
end;
$$;

drop trigger if exists mail_accounts_immutable_cols on public.mail_accounts;
create trigger mail_accounts_immutable_cols
  before update on public.mail_accounts
  for each row
  execute function private.forbid_mail_accounts_immutable_cols();

-- ---------------------------------------------------------------------------
-- github_connections : privileges colonnes (pas d'UPDATE client déjà)
-- ---------------------------------------------------------------------------
revoke all on table public.github_connections from anon, authenticated;

grant select (
  id,
  user_id,
  github_user_id,
  github_login,
  status,
  expires_at,
  connected_at,
  updated_at
) on table public.github_connections to authenticated;

-- ---------------------------------------------------------------------------
-- Lecture jeton mail : (user_id, account_id) + garde de type
-- ---------------------------------------------------------------------------
drop function if exists public.admin_mail_account_read_token(uuid);
drop function if exists private.mail_account_read_token(uuid);

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
    and not exists (
      select 1
      from public.github_connections gc
      where gc.vault_secret_id = ma.vault_secret_id
    )
    and coalesce(vs.description, '') ilike 'Gmail refresh token%';

  return v_token;
end;
$$;

create or replace function public.admin_mail_account_read_token(
  p_user_id uuid,
  p_account_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.mail_account_read_token(p_user_id, p_account_id);
end;
$$;

revoke all on function public.admin_mail_account_read_token(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_mail_account_read_token(uuid, uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- Lecture jeton GitHub : (user_id, connection_id) + garde de type
-- ---------------------------------------------------------------------------
drop function if exists public.admin_github_connection_read_token(uuid);
drop function if exists private.github_connection_read_token(uuid);

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

create or replace function public.admin_github_connection_read_token(
  p_user_id uuid,
  p_connection_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.github_connection_read_token(p_user_id, p_connection_id);
end;
$$;

revoke all on function public.admin_github_connection_read_token(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_github_connection_read_token(uuid, uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- Suppression mail : secret lu uniquement via (user, account) + garde type
-- ---------------------------------------------------------------------------
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
  where ma.id = p_account_id
    and ma.user_id = p_user_id
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

  delete from vault.secrets where id = v_secret_id;

  return v_secret_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Suppression GitHub : garde type croisée
-- ---------------------------------------------------------------------------
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
  where gc.user_id = p_user_id
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

  delete from vault.secrets where id = v_secret_id;

  return v_secret_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_status : lié au propriétaire (plus d'UPDATE client)
-- ---------------------------------------------------------------------------
drop function if exists public.admin_mail_account_set_status(uuid, public.mail_account_status);

create or replace function public.admin_mail_account_set_status(
  p_user_id uuid,
  p_account_id uuid,
  p_status public.mail_account_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated int;
begin
  update public.mail_accounts
  set status = p_status, updated_at = now()
  where id = p_account_id and user_id = p_user_id;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'mail_account_not_found';
  end if;
end;
$$;

revoke all on function public.admin_mail_account_set_status(
  uuid, uuid, public.mail_account_status
) from public, anon, authenticated;
grant execute on function public.admin_mail_account_set_status(
  uuid, uuid, public.mail_account_status
) to service_role;

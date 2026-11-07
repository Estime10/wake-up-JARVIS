-- DEV-2 (extension platform) — garde par nom Vault supabase_platform_<id>.
-- Pré-vol (2026-11-07) : 1 compte, name_ok = true.
-- Empêche read/delete d’un secret détourné (pointeur hérité).

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
    and vs.name = 'supabase_platform_' || spc.id::text
    and not exists (
      select 1
      from public.mail_accounts ma
      where ma.vault_secret_id = spc.vault_secret_id
    )
    and not exists (
      select 1
      from public.github_connections gc
      where gc.vault_secret_id = spc.vault_secret_id
    )
    and (
      coalesce(vs.description, '') ilike 'Supabase platform access token%'
      or coalesce(vs.description, '') ilike 'Supabase platform token%'
    );

  return v_token;
end;
$$;

create or replace function private.supabase_platform_connection_delete(
  p_user_id uuid,
  p_connection_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret_id uuid;
  v_was_active boolean;
  v_next_id uuid;
begin
  select spc.vault_secret_id, spc.is_active
  into v_secret_id, v_was_active
  from public.supabase_platform_connections spc
  join vault.secrets vs on vs.id = spc.vault_secret_id
  where spc.id = p_connection_id
    and spc.user_id = p_user_id
    and vs.name = 'supabase_platform_' || spc.id::text
    and not exists (
      select 1
      from public.mail_accounts ma
      where ma.vault_secret_id = spc.vault_secret_id
    )
    and not exists (
      select 1
      from public.github_connections gc
      where gc.vault_secret_id = spc.vault_secret_id
    );

  if v_secret_id is null then
    raise exception 'supabase_platform_connection_not_found';
  end if;

  perform set_config('app.supabase_platform_connections_allow_delete', 'on', true);

  delete from public.supabase_platform_connections
  where id = p_connection_id and user_id = p_user_id;

  delete from vault.secrets
  where id = v_secret_id
    and name = 'supabase_platform_' || p_connection_id::text;

  if v_was_active then
    select id into v_next_id
    from public.supabase_platform_connections
    where user_id = p_user_id
    order by connected_at desc
    limit 1;

    if v_next_id is not null then
      update public.supabase_platform_connections
      set is_active = true, updated_at = now()
      where id = v_next_id;
    end if;
  end if;

  return v_secret_id;
end;
$$;

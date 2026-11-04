-- DEV-11 — défense en profondeur : pas d'EXECUTE PUBLIC sur private.*
-- DEV-14 — borne multi-comptes platform (max 5, comme mail_accounts = 3).

revoke usage on schema private from public, anon, authenticated;

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end;
$$;

alter default privileges in schema private
  revoke execute on functions from public;

alter default privileges for role postgres in schema private
  revoke execute on functions from public;

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
  v_row public.supabase_platform_connections;
  v_has_any boolean;
  v_count int;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'supabase_platform_token_required';
  end if;

  if p_account_label is null or length(trim(p_account_label)) = 0 then
    raise exception 'supabase_platform_label_required';
  end if;

  select count(*) into v_count
  from public.supabase_platform_connections
  where user_id = p_user_id;

  if v_count >= 5 then
    raise exception 'supabase_platform_connection_limit';
  end if;

  select exists(
    select 1 from public.supabase_platform_connections where user_id = p_user_id
  ) into v_has_any;

  v_secret_id := vault.create_secret(
    p_token,
    null,
    'Supabase platform token pending row'
  );

  insert into public.supabase_platform_connections (
    user_id,
    account_label,
    status,
    vault_secret_id,
    is_active
  )
  values (
    p_user_id,
    trim(p_account_label),
    'active',
    v_secret_id,
    not v_has_any
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

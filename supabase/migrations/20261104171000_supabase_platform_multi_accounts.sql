-- Multi-comptes platform : plusieurs tokens Vault par user JARVIS.
-- 1 ligne = 1 compte Supabase (sbp_) ; is_active = session courante.

alter table public.supabase_platform_connections
  drop constraint if exists supabase_platform_connections_user_id_key;

alter table public.supabase_platform_connections
  add column if not exists is_active boolean not null default false;

create unique index if not exists supabase_platform_connections_one_active_per_user
  on public.supabase_platform_connections (user_id)
  where is_active;

grant select (
  id,
  user_id,
  account_label,
  status,
  selected_project_ref,
  selected_project_name,
  is_active,
  connected_at,
  updated_at
) on table public.supabase_platform_connections to authenticated;

-- Remplace l’upsert mono-compte par un insert multi-comptes.
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
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'supabase_platform_token_required';
  end if;

  if p_account_label is null or length(trim(p_account_label)) = 0 then
    raise exception 'supabase_platform_label_required';
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
  select vault_secret_id, is_active
  into v_secret_id, v_was_active
  from public.supabase_platform_connections
  where id = p_connection_id and user_id = p_user_id;

  if v_secret_id is null then
    raise exception 'supabase_platform_connection_not_found';
  end if;

  perform set_config('app.supabase_platform_connections_allow_delete', 'on', true);

  delete from public.supabase_platform_connections
  where id = p_connection_id and user_id = p_user_id;

  delete from vault.secrets where id = v_secret_id;

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

create or replace function private.supabase_platform_connection_select_project(
  p_user_id uuid,
  p_connection_id uuid,
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
  set is_active = false, updated_at = now()
  where user_id = p_user_id and is_active and id is distinct from p_connection_id;

  update public.supabase_platform_connections
  set
    selected_project_ref = trim(p_project_ref),
    selected_project_name = nullif(trim(coalesce(p_project_name, '')), ''),
    is_active = true,
    updated_at = now()
  where id = p_connection_id and user_id = p_user_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'supabase_platform_connection_not_found';
  end if;

  return v_row;
end;
$$;

create or replace function private.supabase_platform_connection_set_active(
  p_user_id uuid,
  p_connection_id uuid
)
returns public.supabase_platform_connections
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.supabase_platform_connections;
begin
  update public.supabase_platform_connections
  set is_active = false, updated_at = now()
  where user_id = p_user_id and is_active;

  update public.supabase_platform_connections
  set is_active = true, updated_at = now()
  where id = p_connection_id and user_id = p_user_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'supabase_platform_connection_not_found';
  end if;

  return v_row;
end;
$$;

drop function if exists public.admin_supabase_platform_connection_delete(uuid);
drop function if exists public.admin_supabase_platform_connection_select_project(uuid, text, text);

create or replace function public.admin_supabase_platform_connection_delete(
  p_user_id uuid,
  p_connection_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.supabase_platform_connection_delete(p_user_id, p_connection_id);
end;
$$;

create or replace function public.admin_supabase_platform_connection_select_project(
  p_user_id uuid,
  p_connection_id uuid,
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
    p_connection_id,
    p_project_ref,
    p_project_name
  );
end;
$$;

create or replace function public.admin_supabase_platform_connection_set_active(
  p_user_id uuid,
  p_connection_id uuid
)
returns public.supabase_platform_connections
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.supabase_platform_connection_set_active(p_user_id, p_connection_id);
end;
$$;

-- store_token signature inchangée (uuid, text, text) — corps remplacé via private.

revoke all on function public.admin_supabase_platform_connection_delete(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.admin_supabase_platform_connection_select_project(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.admin_supabase_platform_connection_set_active(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.admin_supabase_platform_connection_delete(uuid, uuid)
  to service_role;
grant execute on function public.admin_supabase_platform_connection_select_project(uuid, uuid, text, text)
  to service_role;
grant execute on function public.admin_supabase_platform_connection_set_active(uuid, uuid)
  to service_role;

-- Purge admin hors fenêtre — saturation DB (ADR 0010 étape 2).
-- Les DELETE client restent interdits ; seul service_role via RPC.

create or replace function private.forbid_mail_mutate_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception '%_delete_forbidden', tg_table_name;
end;
$$;

drop trigger if exists mail_reads_no_delete on public.mail_reads;

create trigger mail_reads_no_delete
  before delete on public.mail_reads
  for each row
  when (current_setting('app.mail_reads_allow_delete', true) is distinct from 'on')
  execute function private.forbid_mail_mutate_delete();

/** Supprime mail_items (+ reads) d’un user avant une date. */
create or replace function public.admin_mail_items_purge_before(
  p_user_id uuid,
  p_before timestamptz
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform set_config('app.mail_items_allow_delete', 'on', true);
  perform set_config('app.mail_reads_allow_delete', 'on', true);

  delete from public.mail_reads
  where user_id = p_user_id
    and mail_item_id in (
      select id from public.mail_items
      where user_id = p_user_id and received_at < p_before
    );

  delete from public.mail_items
  where user_id = p_user_id and received_at < p_before;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

/** Wipe total mail_items (+ reads) — reset CLI / resync. */
create or replace function public.admin_mail_items_purge_all(
  p_user_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform set_config('app.mail_items_allow_delete', 'on', true);
  perform set_config('app.mail_reads_allow_delete', 'on', true);

  if p_user_id is null then
    -- `WHERE true` : évite le garde-fou « DELETE requires a WHERE clause ».
    delete from public.mail_reads where true;
    delete from public.mail_items where true;
    update public.mail_accounts set gmail_history_id = null, updated_at = now()
    where true;
  else
    delete from public.mail_reads where user_id = p_user_id;
    delete from public.mail_items where user_id = p_user_id;
    update public.mail_accounts
    set gmail_history_id = null, updated_at = now()
    where user_id = p_user_id;
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.admin_mail_items_purge_before(uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.admin_mail_items_purge_all(uuid)
  from public, anon, authenticated;

grant execute on function public.admin_mail_items_purge_before(uuid, timestamptz)
  to service_role;
grant execute on function public.admin_mail_items_purge_all(uuid)
  to service_role;

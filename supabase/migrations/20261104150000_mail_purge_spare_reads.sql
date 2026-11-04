-- M1 — les purges admin ne touchent plus mail_reads (ADR 0010 CA7 journal).
-- Sorties du chemin de relève : pas d’appel applicatif (poll).

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

  -- mail_reads volontairement épargnés (journal consentement).
  delete from public.mail_items
  where user_id = p_user_id and received_at < p_before;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

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

  if p_user_id is null then
    delete from public.mail_items where true;
    update public.mail_accounts set gmail_history_id = null, updated_at = now()
    where true;
  else
    delete from public.mail_items where user_id = p_user_id;
    update public.mail_accounts
    set gmail_history_id = null, updated_at = now()
    where user_id = p_user_id;
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

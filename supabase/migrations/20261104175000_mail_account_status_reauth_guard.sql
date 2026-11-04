-- DEV-6 — interdire needs_reauth → active hors reconnexion OAuth
-- (OAuth repasse en active via private.mail_account_upsert, pas cette RPC).

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
  v_current public.mail_account_status;
  v_updated int;
begin
  select status into v_current
  from public.mail_accounts
  where id = p_account_id and user_id = p_user_id
  for update;

  if v_current is null then
    raise exception 'mail_account_not_found';
  end if;

  if v_current = 'needs_reauth'::public.mail_account_status
     and p_status = 'active'::public.mail_account_status then
    raise exception 'mail_account_needs_reauth';
  end if;

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

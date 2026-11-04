-- H2 — plus de persistance snippet / résumé tronqué (ADR 0010 CA5).
-- Aucun corps ni extrait stocké tant qu’il n’y a pas de vrai SummaryPort.

update public.mail_items
set
  snippet = '',
  summary = null,
  summary_at = null;

alter table public.mail_items drop column if exists snippet;

-- Anciennes signatures upsert (avec p_snippet).
drop function if exists public.admin_mail_item_upsert(
  uuid, uuid, text, text, text, text, text, timestamptz, text, boolean, text
);
drop function if exists public.admin_mail_item_upsert(
  uuid, uuid, text, text, text, text, text, timestamptz, text, boolean, text, boolean
);

create or replace function public.admin_mail_item_upsert(
  p_user_id uuid,
  p_account_id uuid,
  p_gmail_message_id text,
  p_gmail_thread_id text,
  p_from_raw text,
  p_subject text,
  p_received_at timestamptz,
  p_category text,
  p_flagged boolean,
  p_flag_reason text,
  p_is_sent boolean default false
)
returns public.mail_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.mail_items;
begin
  insert into public.mail_items (
    user_id, account_id, gmail_message_id, gmail_thread_id,
    from_raw, subject, received_at,
    category, flagged, flag_reason, is_sent
  )
  values (
    p_user_id, p_account_id, p_gmail_message_id, p_gmail_thread_id,
    p_from_raw, coalesce(p_subject, ''), p_received_at,
    coalesce(nullif(trim(p_category), ''), 'DIVERS/À trier'),
    coalesce(p_flagged, false), p_flag_reason,
    coalesce(p_is_sent, false)
  )
  on conflict (account_id, gmail_message_id) do update set
    from_raw = excluded.from_raw,
    subject = excluded.subject,
    received_at = excluded.received_at,
    category = excluded.category,
    flagged = excluded.flagged,
    flag_reason = excluded.flag_reason,
    is_sent = excluded.is_sent
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_mail_item_upsert(
  uuid, uuid, text, text, text, text, timestamptz, text, boolean, text, boolean
) from public, anon, authenticated;
grant execute on function public.admin_mail_item_upsert(
  uuid, uuid, text, text, text, text, timestamptz, text, boolean, text, boolean
) to service_role;

-- Plus d’appelant applicatif : retirer le store de résumé tronqué.
drop function if exists public.admin_mail_item_store_summary(uuid, uuid, text);

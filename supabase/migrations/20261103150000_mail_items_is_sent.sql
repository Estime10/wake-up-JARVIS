-- Distingue reçus (UI) vs envoyés (agent « ce que j’ai répondu »).
alter table public.mail_items
  add column if not exists is_sent boolean not null default false;

create index if not exists mail_items_user_inbox_received_idx
  on public.mail_items (user_id, received_at desc)
  where is_sent = false;

create index if not exists mail_items_user_sent_received_idx
  on public.mail_items (user_id, received_at desc)
  where is_sent = true;

comment on column public.mail_items.is_sent is
  'true = libellé Gmail SENT (envoi) — hors feed UI, dispo agent.';

create or replace function public.admin_mail_item_upsert(
  p_user_id uuid,
  p_account_id uuid,
  p_gmail_message_id text,
  p_gmail_thread_id text,
  p_from_raw text,
  p_subject text,
  p_snippet text,
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
    from_raw, subject, snippet, received_at,
    category, flagged, flag_reason, is_sent
  )
  values (
    p_user_id, p_account_id, p_gmail_message_id, p_gmail_thread_id,
    p_from_raw, coalesce(p_subject, ''), coalesce(p_snippet, ''), p_received_at,
    coalesce(nullif(trim(p_category), ''), 'DIVERS/À trier'),
    coalesce(p_flagged, false), p_flag_reason,
    coalesce(p_is_sent, false)
  )
  on conflict (account_id, gmail_message_id) do update set
    from_raw = excluded.from_raw,
    subject = excluded.subject,
    snippet = excluded.snippet,
    received_at = excluded.received_at,
    category = excluded.category,
    flagged = excluded.flagged,
    flag_reason = excluded.flag_reason,
    is_sent = excluded.is_sent
  returning * into v_row;

  return v_row;
end;
$$;

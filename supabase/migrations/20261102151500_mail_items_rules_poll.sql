-- ADR 0010 étape 2 — relève, tri, signalement, résumé (métadonnées only).

alter table public.mail_accounts
  add column if not exists gmail_history_id text;

comment on column public.mail_accounts.gmail_history_id is
  'Curseur Gmail History API — relève incrémentale.';

create table public.mail_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  match_type text not null check (match_type in ('sender', 'subject')),
  pattern text not null,
  category text not null,
  priority int not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint mail_rules_pattern_nonempty check (length(trim(pattern)) > 0),
  constraint mail_rules_category_nonempty check (length(trim(category)) > 0)
);

create index mail_rules_user_priority_idx
  on public.mail_rules (user_id, enabled, match_type, priority);

comment on table public.mail_rules is
  'Règles de tri déterministe (expéditeur puis objet) — regex côté app.';

alter table public.mail_rules enable row level security;

create policy "mail_rules_select_own"
  on public.mail_rules for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "mail_rules_insert_own"
  on public.mail_rules for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "mail_rules_update_own"
  on public.mail_rules for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Pas de DELETE client (ADR CA7).

create table public.mail_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.mail_accounts (id) on delete cascade,
  gmail_message_id text not null,
  gmail_thread_id text,
  from_raw text not null,
  subject text not null default '',
  snippet text not null default '',
  received_at timestamptz not null,
  category text not null default 'DIVERS/À trier',
  flagged boolean not null default false,
  flag_reason text,
  summary text,
  summary_at timestamptz,
  created_at timestamptz not null default now(),
  unique (account_id, gmail_message_id)
);

create index mail_items_user_received_idx
  on public.mail_items (user_id, received_at desc);

create index mail_items_account_received_idx
  on public.mail_items (account_id, received_at desc);

create index mail_items_flagged_idx
  on public.mail_items (user_id, flagged, received_at desc)
  where flagged = true;

comment on table public.mail_items is
  'Métadonnées mail + catégorie / signalement / résumé — jamais le corps.';

alter table public.mail_items enable row level security;

create policy "mail_items_select_own"
  on public.mail_items for select to authenticated
  using ((select auth.uid()) = user_id);

-- Insert/update via service_role poll uniquement.

create table public.mail_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mail_item_id uuid not null references public.mail_items (id) on delete cascade,
  action text not null check (action in ('summary_yes', 'summary_no')),
  created_at timestamptz not null default now()
);

create index mail_reads_user_idx on public.mail_reads (user_id, created_at desc);

comment on table public.mail_reads is
  'Journal consentement résumé (oui/non) — pas d’effacement métier.';

alter table public.mail_reads enable row level security;

create policy "mail_reads_select_own"
  on public.mail_reads for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "mail_reads_insert_own"
  on public.mail_reads for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Interdiction DELETE (sauf flag session pour admin_mail_account_delete cascade).
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

create trigger mail_rules_no_delete
  before delete on public.mail_rules
  for each row
  execute function private.forbid_mail_mutate_delete();

create trigger mail_items_no_delete
  before delete on public.mail_items
  for each row
  when (current_setting('app.mail_items_allow_delete', true) is distinct from 'on')
  execute function private.forbid_mail_mutate_delete();

create trigger mail_reads_no_delete
  before delete on public.mail_reads
  for each row
  execute function private.forbid_mail_mutate_delete();

-- Upsert poll (service_role).
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
  p_flag_reason text
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
    category, flagged, flag_reason
  )
  values (
    p_user_id, p_account_id, p_gmail_message_id, p_gmail_thread_id,
    p_from_raw, coalesce(p_subject, ''), coalesce(p_snippet, ''), p_received_at,
    coalesce(nullif(trim(p_category), ''), 'DIVERS/À trier'),
    coalesce(p_flagged, false), p_flag_reason
  )
  on conflict (account_id, gmail_message_id) do update set
    from_raw = excluded.from_raw,
    subject = excluded.subject,
    snippet = excluded.snippet,
    received_at = excluded.received_at,
    category = excluded.category,
    flagged = excluded.flagged,
    flag_reason = excluded.flag_reason
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.admin_mail_account_set_history(
  p_account_id uuid,
  p_history_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mail_accounts
  set gmail_history_id = p_history_id, updated_at = now()
  where id = p_account_id;
end;
$$;

create or replace function public.admin_mail_account_set_status(
  p_account_id uuid,
  p_status public.mail_account_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.mail_accounts
  set status = p_status, updated_at = now()
  where id = p_account_id;
end;
$$;

create or replace function public.admin_mail_item_store_summary(
  p_user_id uuid,
  p_mail_item_id uuid,
  p_summary text
)
returns public.mail_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.mail_items;
begin
  update public.mail_items
  set summary = p_summary, summary_at = now()
  where id = p_mail_item_id and user_id = p_user_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'mail_item_not_found';
  end if;

  return v_row;
end;
$$;

revoke all on function public.admin_mail_item_upsert(
  uuid, uuid, text, text, text, text, text, timestamptz, text, boolean, text
) from public, anon, authenticated;
revoke all on function public.admin_mail_account_set_history(uuid, text)
  from public, anon, authenticated;
revoke all on function public.admin_mail_account_set_status(uuid, public.mail_account_status)
  from public, anon, authenticated;
revoke all on function public.admin_mail_item_store_summary(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.admin_mail_item_upsert(
  uuid, uuid, text, text, text, text, text, timestamptz, text, boolean, text
) to service_role;
grant execute on function public.admin_mail_account_set_history(uuid, text)
  to service_role;
grant execute on function public.admin_mail_account_set_status(uuid, public.mail_account_status)
  to service_role;
grant execute on function public.admin_mail_item_store_summary(uuid, uuid, text)
  to service_role;

-- Débranchement boîte : autoriser cascade items puis compte.
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
  select vault_secret_id into v_secret_id
  from public.mail_accounts
  where id = p_account_id and user_id = p_user_id;

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

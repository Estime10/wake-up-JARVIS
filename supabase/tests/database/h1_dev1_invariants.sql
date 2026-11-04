-- DEV-16 — invariants H1 (Vault) + DEV-1 (mail_reads SET NULL).
-- Exécutable via `supabase test db` (pgTAP) ou contrôle manuel.

begin;
select plan(4);

-- H1 : schéma private sans USAGE pour anon/authenticated
select is(
  has_schema_privilege('anon', 'private', 'USAGE'),
  false,
  'anon has no USAGE on private'
);

select is(
  has_schema_privilege('authenticated', 'private', 'USAGE'),
  false,
  'authenticated has no USAGE on private'
);

-- DEV-1 : FK mail_reads.mail_item_id → ON DELETE SET NULL
select is(
  (
    select confdeltype
    from pg_constraint
    where conname = 'mail_reads_mail_item_id_fkey'
       or (
         conrelid = 'public.mail_reads'::regclass
         and confrelid = 'public.mail_items'::regclass
         and array_length(conkey, 1) = 1
       )
    limit 1
  ),
  'n', -- 'n' = SET NULL in pg_constraint.confdeltype
  'mail_reads.mail_item_id ON DELETE SET NULL'
);

-- DEV-6 : RPC set_status refuse needs_reauth → active (présence du guard)
select ok(
  position(
    'mail_account_needs_reauth' in
    pg_get_functiondef('public.admin_mail_account_set_status(uuid,uuid,public.mail_account_status)'::regprocedure)
  ) > 0,
  'admin_mail_account_set_status guards needs_reauth → active'
);

select * from finish();
rollback;

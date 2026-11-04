-- DEV-1 — journal mail_reads survit à la suppression des items (M1 / ADR 0010 CA7).
-- Avant : ON DELETE CASCADE + trigger mail_reads_no_delete → disconnect / purge
-- échouent dès qu’un consentement est journalisé.

alter table public.mail_reads
  alter column mail_item_id drop not null;

alter table public.mail_reads
  drop constraint mail_reads_mail_item_id_fkey;

alter table public.mail_reads
  add constraint mail_reads_mail_item_id_fkey
  foreign key (mail_item_id)
  references public.mail_items (id)
  on delete set null;

comment on column public.mail_reads.mail_item_id is
  'Réf. item (nullable). SET NULL à la suppression de l’item — journal consentement conservé.';

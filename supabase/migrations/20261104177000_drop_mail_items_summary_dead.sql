-- DEV-15 — colonnes summary / summary_at mortes (toujours nulles depuis H2).

alter table public.mail_items drop column if exists summary;
alter table public.mail_items drop column if exists summary_at;

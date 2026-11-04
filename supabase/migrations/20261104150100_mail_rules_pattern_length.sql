-- M5 — borne la longueur des motifs mail_rules (anti-ReDoS à l’insertion).

alter table public.mail_rules
  drop constraint if exists mail_rules_pattern_nonempty;

alter table public.mail_rules
  add constraint mail_rules_pattern_nonempty
  check (length(trim(pattern)) > 0 and length(pattern) <= 200);

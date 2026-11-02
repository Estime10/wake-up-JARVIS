-- Profil utilisateur — display_name (saisi manuellement) pour le salut.
-- username optionnel (terminal / identité machine).

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil JARVIS — display_name pour le salut ; username pour le shell.';

comment on column public.profiles.display_name is
  'Nom affiché dans « Bonjour / Bonsoir, {name} » (saisie manuelle).';

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Création automatique d'une ligne vide à l'inscription.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- Backfill des comptes déjà créés.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

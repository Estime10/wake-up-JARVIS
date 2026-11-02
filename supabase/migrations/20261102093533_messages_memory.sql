-- Mémoire conversation (MemoryPort) — append-only, isolée par utilisateur.
-- RLS obligatoire : la Data API expose `public`.

create table public.messages (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  created_at timestamptz not null
);

create index messages_user_created_idx
  on public.messages (user_id, created_at asc);

comment on table public.messages is
  'Fil de conversation JARVIS — une ligne = un message MemoryPort.';

alter table public.messages enable row level security;

create policy "messages_select_own"
  on public.messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "messages_insert_own"
  on public.messages
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Pas d'UPDATE / DELETE : journal mémoire append-only côté app.

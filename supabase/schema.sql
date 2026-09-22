-- Biblioteca de jogos do usuário (My Book Games)
-- Execute no SQL Editor do Supabase.

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  igdb_id bigint not null,
  title text not null,
  cover_url text,
  release_date date,
  companies text[] not null default '{}',
  started_at date,
  completed_at date,
  playtime_hours integer not null default 0,
  zerado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, igdb_id)
);

create index if not exists games_user_id_idx on public.games (user_id);
create index if not exists games_title_idx on public.games (title);

alter table public.games enable row level security;

create policy "Usuários leem seus próprios jogos"
  on public.games
  for select
  using (auth.uid() = user_id);

create policy "Usuários inserem seus próprios jogos"
  on public.games
  for insert
  with check (auth.uid() = user_id);

create policy "Usuários atualizam seus próprios jogos"
  on public.games
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários removem seus próprios jogos"
  on public.games
  for delete
  using (auth.uid() = user_id);

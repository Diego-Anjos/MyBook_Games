-- Biblioteca de jogos do usuário (My Book Games)
-- Execute no SQL Editor do Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  nickname text,
  birth_date date,
  platform text,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  igdb_id bigint not null,
  title text not null,
  cover_url text,
  developer text,
  publisher text,
  release_date date,
  genres text[] not null default '{}',
  start_time timestamptz,
  end_time timestamptz,
  platform text,
  playtime integer not null default 0,
  rating numeric not null default 0,
  narrative text,
  synopsis text,
  is_cleared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, igdb_id)
);

-- Instalações antigas: acrescenta as colunas usadas pelo diário.
alter table public.games add column if not exists developer text;
alter table public.games add column if not exists publisher text;
alter table public.games add column if not exists genres text[] not null default '{}';
alter table public.games add column if not exists start_time timestamptz;
alter table public.games add column if not exists end_time timestamptz;
alter table public.games add column if not exists platform text;
alter table public.games add column if not exists playtime integer not null default 0;
alter table public.games add column if not exists rating numeric not null default 0;
alter table public.games add column if not exists narrative text;
alter table public.games add column if not exists synopsis text;
alter table public.games add column if not exists is_cleared boolean not null default false;

create index if not exists games_user_id_idx on public.games (user_id);
create index if not exists games_title_idx on public.games (title);

alter table public.profiles enable row level security;
alter table public.games enable row level security;

drop policy if exists "Leitores leem a própria ficha" on public.profiles;
create policy "Leitores leem a própria ficha"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Leitores criam a própria ficha" on public.profiles;
create policy "Leitores criam a própria ficha"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Leitores atualizam a própria ficha" on public.profiles;
create policy "Leitores atualizam a própria ficha"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Usuários leem seus próprios jogos" on public.games;
create policy "Usuários leem seus próprios jogos"
  on public.games
  for select
  using (auth.uid() = user_id);

drop policy if exists "Usuários inserem seus próprios jogos" on public.games;
create policy "Usuários inserem seus próprios jogos"
  on public.games
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuários atualizam seus próprios jogos" on public.games;
create policy "Usuários atualizam seus próprios jogos"
  on public.games
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuários removem seus próprios jogos" on public.games;
create policy "Usuários removem seus próprios jogos"
  on public.games
  for delete
  using (auth.uid() = user_id);

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.games to authenticated;

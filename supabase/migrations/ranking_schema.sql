-- Ranking anual do escritor: Top 10 de jogos zerados em um ano.
-- Execute no SQL Editor do Supabase.

create table if not exists public.yearly_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year integer not null,
  rank_position integer not null check (rank_position between 1 and 10),
  game_id uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, year, rank_position),
  unique (user_id, year, game_id)
);

alter table public.yearly_rankings enable row level security;

drop policy if exists "Escritores leem o próprio ranking" on public.yearly_rankings;
create policy "Escritores leem o próprio ranking"
  on public.yearly_rankings
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Escritores criam o próprio ranking" on public.yearly_rankings;
create policy "Escritores criam o próprio ranking"
  on public.yearly_rankings
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.games
      where games.id = game_id
        and games.user_id = auth.uid()
    )
  );

drop policy if exists "Escritores atualizam o próprio ranking" on public.yearly_rankings;
create policy "Escritores atualizam o próprio ranking"
  on public.yearly_rankings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.games
      where games.id = game_id
        and games.user_id = auth.uid()
    )
  );

drop policy if exists "Escritores removem o próprio ranking" on public.yearly_rankings;
create policy "Escritores removem o próprio ranking"
  on public.yearly_rankings
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.yearly_rankings to authenticated;

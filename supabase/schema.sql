-- Biblioteca de jogos do usuário (My Book Games)
-- Execute no SQL Editor do Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  nickname text,
  birth_date date,
  platform text,
  avatar_url text,
  cover_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists uid text;

-- UID numérico de 8 dígitos, no estilo de um código de viajante.
create or replace function public.assign_profile_uid()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  attempts int := 0;
begin
  if new.uid is not null and new.uid ~ '^[0-9]{8}$' then
    return new;
  end if;

  loop
    attempts := attempts + 1;
    candidate := lpad((floor(random() * 90000000) + 10000000)::bigint::text, 8, '0');
    exit when not exists (
      select 1 from public.profiles where uid = candidate
    );
    if attempts > 20 then
      raise exception 'Não foi possível gerar um UID único';
    end if;
  end loop;

  new.uid := candidate;
  return new;
end;
$$;

drop trigger if exists profiles_assign_uid on public.profiles;
create trigger profiles_assign_uid
  before insert on public.profiles
  for each row
  execute function public.assign_profile_uid();

do $$
declare
  rec record;
  candidate text;
  attempts int;
begin
  for rec in select id from public.profiles where uid is null loop
    attempts := 0;
    loop
      attempts := attempts + 1;
      candidate := lpad((floor(random() * 90000000) + 10000000)::bigint::text, 8, '0');
      exit when not exists (
        select 1 from public.profiles where uid = candidate
      );
      if attempts > 20 then
        raise exception 'Não foi possível gerar um UID único';
      end if;
    end loop;
    update public.profiles set uid = candidate where id = rec.id;
  end loop;
end $$;

create unique index if not exists profiles_uid_key on public.profiles (uid);

do $$
begin
  if not exists (
    select 1 from public.profiles where uid is null
  ) then
    alter table public.profiles alter column uid set not null;
  end if;
end $$;

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists friendships_user_id_idx on public.friendships (user_id);
create index if not exists friendships_friend_id_idx on public.friendships (friend_id);

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
alter table public.friendships enable row level security;

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

drop policy if exists "Leitores encontram companheiros" on public.profiles;
create policy "Leitores encontram companheiros"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "Leitores leem as próprias amizades" on public.friendships;
create policy "Leitores leem as próprias amizades"
  on public.friendships
  for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

drop policy if exists "Leitores adicionam companheiros" on public.friendships;
create policy "Leitores adicionam companheiros"
  on public.friendships
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Leitores respondem a pedidos" on public.friendships;
create policy "Leitores respondem a pedidos"
  on public.friendships
  for update
  to authenticated
  using (auth.uid() = friend_id)
  with check (auth.uid() = friend_id);

drop policy if exists "Leitores recusam pedidos" on public.friendships;
create policy "Leitores recusam pedidos"
  on public.friendships
  for delete
  to authenticated
  using (auth.uid() = friend_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('friend_request', 'friend_accepted')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);

alter table public.notifications enable row level security;

drop policy if exists "Leitores leem as próprias notificações" on public.notifications;
create policy "Leitores leem as próprias notificações"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Leitores enviam notificações" on public.notifications;
create policy "Leitores enviam notificações"
  on public.notifications
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

drop policy if exists "Leitores marcam as próprias notificações" on public.notifications;
create policy "Leitores marcam as próprias notificações"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
grant select, insert, update, delete on table public.friendships to authenticated;
grant select, insert, update on table public.notifications to authenticated;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  check (char_length(btrim(content)) > 0),
  check (sender_id <> receiver_id)
);

create index if not exists messages_sender_id_idx on public.messages (sender_id);
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);
create index if not exists messages_pair_created_idx
  on public.messages (sender_id, receiver_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "Leitores leem as próprias mensagens" on public.messages;
create policy "Leitores leem as próprias mensagens"
  on public.messages
  for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Leitores enviam mensagens" on public.messages;
create policy "Leitores enviam mensagens"
  on public.messages
  for insert
  to authenticated
  with check (auth.uid() = sender_id);

grant select, insert on table public.messages to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'messages'
     )
  then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Bucket público para o retrato da ficha. Execute no SQL Editor do Supabase.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Avatares são públicos" on storage.objects;
create policy "Avatares são públicos"
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "Leitores enviam avatares" on storage.objects;
create policy "Leitores enviam avatares"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "Leitores substituem avatares" on storage.objects;
create policy "Leitores substituem avatares"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'avatars');

-- Ranking anual do escritor: Top 10 de jogos zerados em um ano.
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

-- ============================================================
-- SCHEMA COMPLETO - Oribius Discovery
-- Ejecutar en: https://supabase.com/dashboard/project/pwmydijhjmyrbhllbozm/sql/new
-- ============================================================

-- 1. TABLA DE PERFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  bio text default '',
  level int default 1,
  xp int default 0,
  profile_public boolean default false,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

drop policy if exists "Perfiles - lectura propia" on profiles;
create policy "Perfiles - lectura propia"
  on profiles for select using (auth.uid() = id);

drop policy if exists "Perfiles - lectura pública" on profiles;
create policy "Perfiles - lectura pública"
  on profiles for select using (profile_public = true OR auth.uid() = id);

drop policy if exists "Perfiles - actualización propia" on profiles;
create policy "Perfiles - actualización propia"
  on profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    AND coalesce(xp, 0) = (select coalesce(xp, 0) from profiles where id = auth.uid())
    AND coalesce(level, 0) = (select coalesce(level, 0) from profiles where id = auth.uid())
  );

-- 2. TRIGGER: crear perfil automático al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. FAVORITOS
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_slug text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, game_slug)
);

alter table favorites enable row level security;

drop policy if exists "Favoritos - solo propios" on favorites;
create policy "Favoritos - solo propios"
  on favorites for all using (auth.uid() = user_id);

-- 4. COLECCIÓN
create table if not exists collection (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_slug text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, game_slug)
);

alter table collection enable row level security;

drop policy if exists "Colección - solo propios" on collection;
create policy "Colección - solo propios"
  on collection for all using (auth.uid() = user_id);

-- 5. RECIENTE
create table if not exists recent (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_slug text not null,
  visited_at timestamp with time zone default now()
);

alter table recent enable row level security;

drop policy if exists "Reciente - solo propios" on recent;
create policy "Reciente - solo propios"
  on recent for all using (auth.uid() = user_id);

-- 6. RESEÑAS
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  game_slug text not null,
  rating int check (rating >= 1 and rating <= 5) not null,
  content text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, game_slug)
);

alter table reviews enable row level security;

drop policy if exists "Reseñas - lectura pública" on reviews;
create policy "Reseñas - lectura pública"
  on reviews for select using (true);

drop policy if exists "Reseñas - solo usuario puede crear" on reviews;
create policy "Reseñas - solo usuario puede crear"
  on reviews for insert with check (auth.uid() = user_id);

drop policy if exists "Reseñas - solo usuario puede actualizar" on reviews;
create policy "Reseñas - solo usuario puede actualizar"
  on reviews for update using (auth.uid() = user_id);

drop policy if exists "Reseñas - solo usuario puede eliminar" on reviews;
create policy "Reseñas - solo usuario puede eliminar"
  on reviews for delete using (auth.uid() = user_id);

-- 7. LOGROS
create table if not exists achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  achievement_key text not null,
  unlocked_at timestamp with time zone default now(),
  unique(user_id, achievement_key)
);

alter table achievements enable row level security;

drop policy if exists "Logros - solo propios" on achievements;
create policy "Logros - solo propios"
  on achievements for all using (auth.uid() = user_id);

-- 8. ÍNDICES DE RENDIMIENTO
create index if not exists idx_favorites_user on favorites(user_id);
create index if not exists idx_collection_user on collection(user_id);
create index if not exists idx_recent_user on recent(user_id);
create index if not exists idx_reviews_slug on reviews(game_slug);
create index if not exists idx_achievements_user on achievements(user_id);

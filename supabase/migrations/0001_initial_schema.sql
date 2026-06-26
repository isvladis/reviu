-- ============================================================================
-- Reviu — Migración 0001: modelo de datos inicial (Fase 1)
-- ============================================================================
-- Referencia: ARQUITECTURA.md §2 (modelo), §3 (seguridad), §4 (Supabase).
-- Convenciones:
--   * snake_case, esquema public.
--   * UUID v4 por defecto, salvo profiles.id = auth.users.id.
--   * timestamptz + now() en created_at/updated_at.
--   * RLS habilitado y FORZADO en cada tabla (fail-closed).
--   * NUNCA dirección exacta: solo neighborhood + coords difuminadas.
-- Tablas de Fase 2 (role_grants, rewards, proposals, votes) NO se crean aquí;
-- ver ARQUITECTURA.md §2.3.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tipos enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.object_status as enum
    ('draft','published','reserved','completed','withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.exchange_status as enum
    ('requested','accepted','rejected','completed','cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 con auth.users; datos mínimos, sin email duplicado)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 50),
  neighborhood  text,
  city          text not null default 'Barcelona',
  avatar_url    text,
  bio           text check (char_length(bio) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger: crea profile automáticamente al registrarse en auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Vecino/a')
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories  (datos de referencia, jerárquica)
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  parent_id   uuid references public.categories(id),
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- destinations  (4 destinos fijos del producto)
-- ---------------------------------------------------------------------------
create table if not exists public.destinations (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  sort_order  int not null default 0
);

-- ---------------------------------------------------------------------------
-- objects  (objetos publicados)
-- ---------------------------------------------------------------------------
create table if not exists public.objects (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  category_id    uuid not null references public.categories(id),
  destination_id uuid not null references public.destinations(id),
  title          text not null check (char_length(title) between 3 and 120),
  description    text check (char_length(description) <= 2000),
  neighborhood   text,
  city           text not null default 'Barcelona',
  -- Coordenadas DIFUMINADAS al centroide del barrio. Nunca posición exacta.
  approx_lat     numeric(9,6),
  approx_lng     numeric(9,6),
  status         public.object_status not null default 'draft',
  -- Fase 2 (validadores): se mantienen nulas hasta entonces.
  validated_by   uuid references public.profiles(id),
  validated_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists objects_status_idx       on public.objects (status);
create index if not exists objects_category_idx     on public.objects (category_id);
create index if not exists objects_destination_idx  on public.objects (destination_id);
create index if not exists objects_neighborhood_idx on public.objects (neighborhood);

-- ---------------------------------------------------------------------------
-- object_photos  (binarios en Storage; aquí solo la ruta)
-- ---------------------------------------------------------------------------
create table if not exists public.object_photos (
  id           uuid primary key default gen_random_uuid(),
  object_id    uuid not null references public.objects(id) on delete cascade,
  storage_path text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists object_photos_object_idx on public.object_photos (object_id);

-- ---------------------------------------------------------------------------
-- exchanges  (trazabilidad cedente → receptor)
-- ---------------------------------------------------------------------------
create table if not exists public.exchanges (
  id           uuid primary key default gen_random_uuid(),
  object_id    uuid not null references public.objects(id) on delete cascade,
  giver_id     uuid not null references public.profiles(id),
  receiver_id  uuid not null references public.profiles(id),
  status       public.exchange_status not null default 'requested',
  message      text check (char_length(message) <= 1000),
  -- Trazabilidad: solo barrio destino. Nunca dirección.
  destination_neighborhood text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (giver_id <> receiver_id)
);

create index if not exists exchanges_object_idx   on public.exchanges (object_id);
create index if not exists exchanges_giver_idx    on public.exchanges (giver_id);
create index if not exists exchanges_receiver_idx on public.exchanges (receiver_id);

-- ---------------------------------------------------------------------------
-- impact  (ledger append-only de impacto por persona)
-- ---------------------------------------------------------------------------
create table if not exists public.impact (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  exchange_id       uuid references public.exchanges(id) on delete set null,
  object_id         uuid references public.objects(id) on delete set null,
  destination_id    uuid references public.destinations(id),
  co2_saved_kg      numeric(10,2) not null default 0,
  waste_diverted_kg numeric(10,2) not null default 0,
  objects_count     int not null default 1,
  occurred_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists impact_profile_idx on public.impact (profile_id);

-- ============================================================================
-- RLS — habilitado y forzado en TODAS las tablas (ARQUITECTURA §3.1)
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.profiles      force  row level security;
alter table public.categories    enable row level security;
alter table public.categories    force  row level security;
alter table public.destinations  enable row level security;
alter table public.destinations  force  row level security;
alter table public.objects       enable row level security;
alter table public.objects       force  row level security;
alter table public.object_photos enable row level security;
alter table public.object_photos force  row level security;
alter table public.exchanges     enable row level security;
alter table public.exchanges     force  row level security;
alter table public.impact        enable row level security;
alter table public.impact        force  row level security;

-- ============================================================================
-- GRANTs — permisos SQL base para que RLS pueda actuar.
-- RLS decide QUÉ filas; GRANT decide SI puede acceder a la tabla.
-- ============================================================================

-- profiles: lectura todos, escritura autenticados
grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

-- categories / destinations: solo lectura (escritura via service_role)
grant select on public.categories  to anon, authenticated;
grant select on public.destinations to anon, authenticated;

-- objects: lectura todos, escritura autenticados
grant select on public.objects to anon, authenticated;
grant insert, update, delete on public.objects to authenticated;

-- object_photos: lectura todos, escritura autenticados
grant select on public.object_photos to anon, authenticated;
grant insert, update, delete on public.object_photos to authenticated;

-- exchanges: solo autenticados
grant select, insert, update on public.exchanges to authenticated;

-- impact: lectura autenticados (escritura via service_role/trigger)
grant select on public.impact to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas — profiles  (lectura pública; escritura solo del propio)
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Políticas — categories / destinations  (lectura pública; escritura: service_role)
-- ---------------------------------------------------------------------------
drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories
  for select using (true);

drop policy if exists destinations_select_all on public.destinations;
create policy destinations_select_all on public.destinations
  for select using (true);

-- ---------------------------------------------------------------------------
-- Políticas — objects  (público ve 'published'; dueño gestiona los suyos)
-- ---------------------------------------------------------------------------
drop policy if exists objects_select_published_or_own on public.objects;
create policy objects_select_published_or_own on public.objects
  for select using (status = 'published' or owner_id = auth.uid());

drop policy if exists objects_insert_own on public.objects;
create policy objects_insert_own on public.objects
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists objects_update_own on public.objects;
create policy objects_update_own on public.objects
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists objects_delete_own on public.objects;
create policy objects_delete_own on public.objects
  for delete to authenticated using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Políticas — object_photos  (visible si el objeto es público o propio)
-- ---------------------------------------------------------------------------
drop policy if exists object_photos_select_visible on public.object_photos;
create policy object_photos_select_visible on public.object_photos
  for select using (
    exists (
      select 1 from public.objects o
      where o.id = object_id
        and (o.status = 'published' or o.owner_id = auth.uid())
    )
  );

drop policy if exists object_photos_insert_own on public.object_photos;
create policy object_photos_insert_own on public.object_photos
  for insert to authenticated with check (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.owner_id = auth.uid()
    )
  );

drop policy if exists object_photos_update_own on public.object_photos;
create policy object_photos_update_own on public.object_photos
  for update to authenticated using (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.owner_id = auth.uid()
    )
  );

drop policy if exists object_photos_delete_own on public.object_photos;
create policy object_photos_delete_own on public.object_photos
  for delete to authenticated using (
    exists (
      select 1 from public.objects o
      where o.id = object_id and o.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Políticas — exchanges  (solo las partes)
-- ---------------------------------------------------------------------------
drop policy if exists exchanges_select_parties on public.exchanges;
create policy exchanges_select_parties on public.exchanges
  for select to authenticated
  using (giver_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists exchanges_insert_receiver on public.exchanges;
create policy exchanges_insert_receiver on public.exchanges
  for insert to authenticated
  with check (
    receiver_id = auth.uid()
    and exists (
      select 1 from public.objects o
      where o.id = object_id and o.status = 'published' and o.owner_id = giver_id
    )
  );

drop policy if exists exchanges_update_parties on public.exchanges;
create policy exchanges_update_parties on public.exchanges
  for update to authenticated
  using (giver_id = auth.uid() or receiver_id = auth.uid())
  with check (giver_id = auth.uid() or receiver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Políticas — impact  (cada persona ve solo lo suyo; escritura del sistema)
-- ---------------------------------------------------------------------------
drop policy if exists impact_select_own on public.impact;
create policy impact_select_own on public.impact
  for select to authenticated using (profile_id = auth.uid());

-- ============================================================================
-- Seeds — datos de referencia
-- ============================================================================

-- categories (Fase 1: 6 categorías base)
insert into public.categories (slug, name, description, sort_order) values
  ('ropa',        'Ropa',        'Prendas, calzado y complementos.',           1),
  ('muebles',     'Muebles',     'Mobiliario del hogar y oficina.',            2),
  ('electronica', 'Electrónica', 'Aparatos eléctricos y dispositivos.',        3),
  ('libros',      'Libros',      'Libros, revistas y material impreso.',       4),
  ('hogar',       'Hogar',       'Menaje, decoración y utensilios del hogar.', 5),
  ('otros',       'Otros',       'Cualquier objeto que no encaje arriba.',     6)
on conflict (slug) do nothing;

-- destinations (los 4 destinos del producto)
insert into public.destinations (slug, name, description, sort_order) values
  ('segunda_vida',         'Segunda vida',         'El objeto pasa a otra persona que lo necesita.',        1),
  ('reciclaje_real',       'Reciclaje real',       'Gestión correcta del material para reciclarlo.',        2),
  ('reacondicionamiento',  'Reacondicionamiento',  'Reparación/restauración en un taller antes de reusar.', 3),
  ('donacion',             'Donación',             'Cesión a entidad o persona sin contraprestación.',      4)
on conflict (slug) do nothing;

-- ============================================================================
-- FASE 2 — anticipado en ARQUITECTURA.md §2.3 (NO crear todavía):
--   * role_grants (+ has_active_role)  → roles caducables por categoría
--   * rewards                          → ledger numeric con on_chain_ref
--   * proposals, votes                 → gobernanza + veto ciudadano
-- ============================================================================

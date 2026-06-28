-- ============================================================================
-- Reviu — Migración 0004: panel de moderación
-- ============================================================================
-- Referencia: ARQUITECTURA.md §2 (modelo), §3 (seguridad), §4 (Supabase),
-- ADR-018 (§9).
--
-- Motivación:
--   Los objetos enviados por usuarios entran como 'pending' (ADR-017) y deben
--   pasar revisión humana antes de ser visibles públicamente como 'published'.
--   Esta migración añade el rol 'moderator' como rol funcional MÍNIMO (Fase 1),
--   sin saltarse el principio anti-acumulación de poder: el rol vive como
--   columna en profiles para Fase 1; en Fase 2 migra a role_grants caducable
--   (ARQUITECTURA §2.3) sin reescritura de los policies (el helper has_role()
--   pasa a consultar role_grants y todo lo demás sigue igual).
--
-- Cambios:
--   1. enum public.user_role ('user','moderator','admin').
--   2. profiles.role  user_role  default 'user'   (idempotente).
--   3. objects.rejection_reason  text             (idempotente).
--   4. Helper has_role() — punto único de verificación de rol en RLS.
--   5. Políticas: moderator puede LEER objetos pending y sus fotos,
--      y ACTUALIZAR objetos pending (aprobar/rechazar).
--      El dueño ya puede leer su rejection_reason por la policy existente
--      objects_select_published_or_own (owner_id = auth.uid()).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. enum user_role (idempotente)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('user','moderator','admin');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. profiles.role
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role public.user_role not null default 'user';

create index if not exists profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- 3. objects.rejection_reason
-- ---------------------------------------------------------------------------
alter table public.objects
  add column if not exists rejection_reason text
    check (rejection_reason is null or char_length(rejection_reason) <= 300);

-- ---------------------------------------------------------------------------
-- 4. has_role(): punto único de comprobación de rol desde RLS
-- ---------------------------------------------------------------------------
-- security definer + search_path = '' por convención de funciones llamadas
-- desde RLS. Stable: ningún side-effect; se cachea por sentencia.
create or replace function public.has_role(p_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = p_role
  );
$$;

grant execute on function public.has_role(public.user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Políticas RLS adicionales para moderación
-- ---------------------------------------------------------------------------

-- objects: moderator lee TODOS los pending (además del dueño / published vía
-- la policy existente objects_select_published_or_own).
drop policy if exists objects_select_moderator_pending on public.objects;
create policy objects_select_moderator_pending on public.objects
  for select
  to authenticated
  using (status = 'pending' and public.has_role('moderator'));

-- objects: moderator puede actualizar SOLO los pending (aprobar → published,
-- rechazar → withdrawn + rejection_reason).
drop policy if exists objects_update_moderator_pending on public.objects;
create policy objects_update_moderator_pending on public.objects
  for update
  to authenticated
  using (status = 'pending' and public.has_role('moderator'))
  with check (public.has_role('moderator'));

-- object_photos: moderator ve las fotos de objetos pending.
drop policy if exists object_photos_select_moderator_pending on public.object_photos;
create policy object_photos_select_moderator_pending on public.object_photos
  for select
  to authenticated
  using (
    exists (
      select 1 from public.objects o
      where o.id = object_id
        and o.status = 'pending'
        and public.has_role('moderator')
    )
  );

-- Nota: el dueño puede leer su propio rejection_reason a través de la policy
-- objects_select_published_or_own (owner_id = auth.uid()), sin policy nueva.

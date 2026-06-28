-- ============================================================================
-- Reviu — Migración 0002: Storage para fotos de objetos (Fase 1)
-- ============================================================================
-- Referencia: ARQUITECTURA.md §4.1 (Storage), §4.4 (políticas Storage).
--
-- Decisiones:
--   * Bucket 'object-photos' PRIVADO (public = false).
--     Las URLs son firmadas y temporales; no hay URLs públicas adivinables.
--   * Estructura de rutas: object-photos/{owner_id}/{object_id}/{filename}.
--     La primera carpeta = owner_id permite que RLS valide la propiedad
--     mediante storage.foldername(name)[1] = auth.uid()::text.
--   * Solo authenticated puede insertar/seleccionar bajo su propia carpeta.
--   * Solo service_role puede eliminar (no se define policy de delete).
--   * Los binarios de objetos "publicados" se sirven mediante URL firmada
--     generada en servidor (lib/supabase/storage.ts), nunca enlace público
--     permanente.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Bucket privado
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('object-photos', 'object-photos', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Políticas de Storage
-- (RLS sobre storage.objects ya viene habilitado por Supabase.)
-- ---------------------------------------------------------------------------

-- INSERT: solo en su propia carpeta (primer segmento = uid)
drop policy if exists object_photos_storage_insert_own on storage.objects;
create policy object_photos_storage_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'object-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: solo el dueño puede leer directamente; el resto del mundo accede
-- a las fotos de objetos aprobados mediante URLs firmadas (service_role).
drop policy if exists object_photos_storage_select_own on storage.objects;
create policy object_photos_storage_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'object-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: solo en su propia carpeta (renombrados, metadata)
drop policy if exists object_photos_storage_update_own on storage.objects;
create policy object_photos_storage_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'object-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'object-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: deliberadamente SIN política → solo service_role.
-- Borrar fotos es operación administrativa (moderación, baja de cuenta).

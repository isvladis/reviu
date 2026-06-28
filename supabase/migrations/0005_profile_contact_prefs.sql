-- ============================================================================
-- Reviu — Migración 0005: preferencias de contacto en profiles
-- ============================================================================
-- Referencia: ARQUITECTURA.md §2 (modelo), §3 (seguridad), §4 (Supabase),
-- ADR-019 (§9).
--
-- Motivación:
--   Fase 1 introduce listado público y detalle de objetos con sistema "gancho":
--   los visitantes anónimos NUNCA deben ver email ni teléfono; los usuarios
--   registrados solo si el publicador ha consentido explícitamente.
--
--   El email vive en auth.users (gestionado por Supabase Auth); no se duplica.
--   El teléfono es opcional, se guarda en profiles.phone y SOLO se expone si
--   contact_phone = true.
--
-- Cambios:
--   1. profiles: añadir phone, contact_email, contact_phone, contact_inapp
--      (idempotentes).
--   2. GRANTs por columna en profiles para 'anon': solo columnas mínimas
--      (id, display_name, neighborhood, city, avatar_url, bio). Las columnas
--      phone y de preferencias NO se conceden a anon → la RLS de fila sigue
--      siendo USING(true), pero anon no tiene permiso SQL para leerlas
--      (ARQUITECTURA §3.2). Doble barrera: GRANT por columna + RLS.
--   3. 'authenticated' mantiene SELECT en todas las columnas; el código
--      servidor decide si revela phone/email del publicador según consentimiento
--      del propio dueño (ADR-019).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Columnas nuevas en profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone text
    check (phone is null or char_length(phone) between 5 and 30);

alter table public.profiles
  add column if not exists contact_email boolean not null default false;

alter table public.profiles
  add column if not exists contact_phone boolean not null default false;

alter table public.profiles
  add column if not exists contact_inapp boolean not null default true;

-- ---------------------------------------------------------------------------
-- 2. GRANTs por columna en profiles
-- ---------------------------------------------------------------------------
-- Revocar el SELECT general que la migración 0001 concedía a anon.
-- A continuación reconceder SELECT solo en las columnas seguras.
revoke select on public.profiles from anon;

grant select (
  id,
  display_name,
  neighborhood,
  city,
  avatar_url,
  bio
) on public.profiles to anon;

-- authenticated puede leer todas las columnas; la lógica de revelar
-- phone/email según consentimiento se aplica en el servidor.
-- (La línea siguiente es idempotente con la 0001; explícita por claridad.)
grant select on public.profiles to authenticated;

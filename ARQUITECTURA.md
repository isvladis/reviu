# ARQUITECTURA.md — Reviu

> **Documento fundacional. Única fuente de verdad sobre arquitectura, seguridad y convenciones.**
>
> Este fichero se adjunta como contexto fijo a **todas** las sesiones de desarrollo (humanas o de Claude Code). Antes de tomar cualquier decisión de arquitectura, seguridad, modelo de datos o convención de código, **consúltalo aquí primero**. Si una decisión no está cubierta, añádela siguiendo el formato de la sección 9 (ADR) en lugar de improvisar en el código.
>
> **Regla de oro:** ninguna sesión debe contradecir lo escrito aquí. Si hay que cambiar una decisión, se modifica este documento _en el mismo cambio_ que el código, con su ADR actualizado y la razón del cambio.

---

## 0. Visión, principios y cómo informan la arquitectura

Reviu es un ecosistema de **economía circular** (web → PWA) nacido en Barcelona. En lugar de tirar un objeto, la persona decide su destino: **reciclaje real, segunda vida, reacondicionamiento en taller o donación**. Cada objeto deja **trazabilidad**: el cedente puede ver qué pasó con él (_"tu silla está ahora en casa de Marta, Gràcia"_).

### Principios no negociables (deben informar cada decisión técnica)

| Principio | Consecuencia arquitectónica directa |
|---|---|
| Modelo comunitario tipo Linux/Wikipedia, **sin ánimo de lucro** | Stack open-source y **auto-hospedable** (Supabase es Postgres). Evitar lock-in propietario irreversible. |
| **Anti-corrupción, anti-monopolio, anti-acumulación de poder** | Roles **caducables y rotatorios** desde el diseño del modelo de datos (no permisos eternos). Auditoría/trazabilidad de acciones privilegiadas. |
| El fundador se rige por **las mismas reglas que todos** | No existe un rol "superadmin" con bypass de las reglas de negocio. Lo privilegiado vive en `service_role` (operaciones de sistema), nunca en una cuenta-persona con poderes especiales. |
| **Transparencia total** | Datos de gobernanza y validación legibles públicamente (RLS de solo-lectura amplia), salvo PII. |
| **Gobernanza democrática con contrapesos** (Fase 2): rotación forzada, transparencia, **veto ciudadano** | El modelo de datos **anticipa** `role_grants` (caducables), `proposals` y `votes` desde hoy, aunque no se implementen hasta Fase 2. |
| **Privacidad por defecto** | La trazabilidad muestra **barrio + nombre de pila**, **nunca dirección exacta**. Mínimo de datos. Cookie más privada por defecto. |

### Hoja de ruta (la arquitectura está diseñada para soportarla entera)

- **Fase 0 — Landing:** manifiesto + formulario de email + enlace a Change.org. Estática, **sin BD**.
- **Fase 1 — Núcleo:** registro/perfil, publicar objeto (foto, categoría, destino), listado cercano filtrable, contacto, confirmación de intercambio, impacto personal. **Entra Supabase.**
- **Fase 2 — Sistema:** validadores (rol funcional **caducable**, por categoría), recompensas (compatibles con blockchain a futuro, en BD normal primero), vertedero visual de impacto, gobernanza con contrapesos.
- **Fase 3 — Escala:** PWA instalable, transporte organizado, ampliación de categorías, (futuro) migración a blockchain.

**Principio clave:** _la misma base de código crece por fases_. La landing de hoy es el cimiento real de toda la plataforma. Se diseña para el largo plazo, no solo para la landing.

### Stack

Next.js (App Router) + Tailwind CSS · Supabase (PostgreSQL, Auth, Storage) · Despliegue en Vercel · Futuro: PWA. Dominios `reviu.es` / `reviu.org`.

### Índice

1. [Estructura de carpetas (App Router)](#1-estructura-de-carpetas-app-router)
2. [Modelo de datos inicial](#2-modelo-de-datos-inicial)
3. [Convenciones de seguridad desde el día 1](#3-convenciones-de-seguridad-desde-el-día-1)
4. [Configuración de Supabase](#4-configuración-de-supabase)
5. [Convenciones de código](#5-convenciones-de-código)
6. [Cabeceras de seguridad de Next.js](#6-cabeceras-de-seguridad-de-nextjs)
7. [Gestión de errores](#7-gestión-de-errores)
8. [Checklist de privacidad GDPR](#8-checklist-de-privacidad-gdpr)
9. [Decisiones de arquitectura (ADR)](#9-decisiones-de-arquitectura-adr)
- [Apéndice A — `.env.example`](#apéndice-a--envexample)
- [Apéndice B — Mapa fase → componentes](#apéndice-b--mapa-fase--componentes)

---

## 1. Estructura de carpetas (App Router)

```
reviu/
├── app/                      # App Router: rutas, layouts, páginas, route handlers, server actions
│   ├── (marketing)/          # Grupo de rutas PÚBLICAS (Fase 0): landing, manifiesto, /gracias
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (app)/                # Grupo de rutas de la APP autenticada (Fase 1+)
│   │   ├── layout.tsx        # Comprueba sesión; redirige si no hay auth
│   │   ├── objetos/          # Listado, detalle, publicar
│   │   ├── perfil/
│   │   └── impacto/
│   ├── api/                  # Route Handlers (solo cuando se necesite un endpoint HTTP real)
│   │   └── .../route.ts
│   ├── layout.tsx            # Layout raíz (html, lang, providers, fuentes)
│   ├── globals.css           # Tailwind base + tokens
│   ├── error.tsx             # Error boundary global (ver §7)
│   └── not-found.tsx
├── components/               # Componentes React reutilizables (presentación + interacción)
│   ├── ui/                   # Primitivos sin lógica de dominio (Button, Input, Card…)
│   └── <dominio>/            # Componentes con dominio (ObjectCard, ExchangeStatus…)
├── lib/                      # Lógica de negocio, clientes externos y configuración
│   ├── supabase/
│   │   ├── client.ts         # Cliente de NAVEGADOR (anon key + sesión). Importable en cliente.
│   │   ├── server.ts         # Cliente de SERVIDOR (anon key + cookies de sesión). server-only.
│   │   └── admin.ts          # Cliente service_role. server-only. NUNCA importar en cliente.
│   ├── validations/          # Esquemas Zod (entrada de formularios y APIs). Compartidos.
│   ├── errors/               # AppError, códigos, helpers (ver §7)
│   ├── env.ts                # Lectura y validación de variables de entorno (Zod)
│   └── rate-limit.ts         # Límite de tasa para endpoints sensibles
├── hooks/                    # React hooks de CLIENTE (useXxx). Llevan 'use client'.
├── types/                    # Tipos TypeScript compartidos
│   ├── database.types.ts     # GENERADO por Supabase CLI (no editar a mano)
│   └── domain.ts             # Tipos de dominio derivados/curados
├── utils/                    # Funciones PURAS y sin estado (formateo, fechas, geo, slugs)
├── public/                   # Estáticos (favicon, imágenes del manifiesto, manifest PWA futuro)
├── supabase/                 # Migraciones SQL y config del proyecto Supabase (CLI)
│   └── migrations/
├── middleware.ts             # Refresco de sesión, rate limiting de borde, cabeceras
├── next.config.ts            # Cabeceras de seguridad (ver §6)
├── .env.example              # Plantilla de variables (ver Apéndice A). SIN valores reales.
└── ARQUITECTURA.md           # Este documento
```

### Responsabilidad de cada carpeta

| Carpeta | Responsabilidad | NO debe contener |
|---|---|---|
| `app/` | Enrutado, layouts, páginas, server actions, route handlers. Componer datos y UI. | Lógica de negocio reutilizable (va en `lib/`). |
| `components/` | UI reutilizable. `ui/` = primitivos tontos; `<dominio>/` = compuestos. | Acceso directo a `service_role` o secretos. |
| `lib/` | Reglas de negocio, clientes externos (Supabase), validaciones, errores, config. | JSX de presentación. |
| `types/` | Contratos TypeScript. `database.types.ts` es **generado** y no se edita. | Lógica ejecutable. |
| `hooks/` | Estado e interacción de cliente. Siempre `'use client'`. | Secretos o `service_role`. |
| `utils/` | Funciones puras, deterministas, sin I/O ni estado. | Llamadas a red o a Supabase. |

### Regla de separación cliente / servidor (crítica)

1. **Server Components por defecto.** Solo se añade `'use client'` cuando hay interactividad, estado o APIs de navegador.
2. **Tres clientes de Supabase, tres ámbitos** (ver §4):
   - `lib/supabase/client.ts` → navegador, usa **anon key** + sesión del usuario. RLS aplica.
   - `lib/supabase/server.ts` → Server Components / Server Actions / Route Handlers, usa **anon key** + cookies de sesión. RLS aplica.
   - `lib/supabase/admin.ts` → **service_role**, solo operaciones de sistema. Marcado con `import 'server-only'`. **Jamás** se importa desde un componente cliente.
3. **`import 'server-only'`** encabeza todo módulo que toque secretos o `service_role`. Si alguien lo importa por error desde cliente, el build **falla**. Para lo opuesto, `import 'client-only'`.
4. **Los secretos solo viven en código de servidor.** Únicamente las variables con prefijo `NEXT_PUBLIC_` pueden llegar al bundle del cliente (ver §3 y Apéndice A).
5. **El navegador nunca es de fiar.** Toda escritura se valida en el servidor (Zod) _y_ la autoriza la BD (RLS). La validación de cliente es solo UX.

---

## 2. Modelo de datos inicial

Diseñado para **toda** la hoja de ruta. Las tablas de Fase 1 se crean ya; las de Fase 2 (validadores, recompensas, gobernanza) están **especificadas aquí** para que encajen **sin reescrituras mayores**.

Convenciones del esquema:
- Todo en `snake_case` (convención Postgres). Esquema de aplicación: `public`.
- Claves primarias `uuid` (`gen_random_uuid()`), salvo `profiles.id` que **es** `auth.users.id`.
- Timestamps `timestamptz` con `now()` por defecto. `created_at` / `updated_at` en toda tabla mutable.
- **Privacidad estructural:** no existe columna de dirección exacta en ninguna tabla. La ubicación más fina es `neighborhood` (barrio). Las coordenadas, si se usan para "cerca de mí", se almacenan **difuminadas** al centroide del barrio (ver nota en `objects`).

### 2.1 Diagrama de relaciones (resumen)

```
auth.users ──1:1── profiles ──1:N── objects ──N:1── categories
                      │                  │   └────────── N:1 ── destinations
                      │                  └──1:N── object_photos
                      │
                      ├──1:N (giver)──┐
                      ├──1:N (receiver)─ exchanges ──N:1── objects
                      │
                      └──1:N── impact   (ledger de impacto por persona)

   FASE 2 (anticipado, no se crea aún):
   profiles ──1:N── role_grants ──N:1── categories   (rol CADUCABLE por categoría)
   profiles ──1:N── rewards                            (saldo, compatible blockchain)
   profiles ──1:N── proposals ──1:N── votes            (gobernanza + veto ciudadano)
```

### 2.2 Tablas de Fase 1 (DDL de referencia)

> El DDL siguiente es **referencia documental**. Las migraciones reales se crean en Fase 1 dentro de `supabase/migrations/`. Aquí no se ejecuta nada.

#### `profiles` — datos mínimos del usuario, vinculada a `auth.users`

Diseño deliberadamente **mínimo**: ni email, ni teléfono, ni dirección. El email vive en `auth.users` (gestionado por Supabase Auth) y **no** se duplica aquí. `display_name` es **nombre de pila**, no nombre completo. Esta minimización es lo que hace seguro exponer `profiles` en lectura pública.

```sql
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 50), -- nombre de pila
  neighborhood  text,                       -- barrio, p.ej. 'Gràcia'. NUNCA dirección exacta
  city          text not null default 'Barcelona',
  avatar_url    text,                        -- ruta en Storage, no URL de terceros
  bio           text check (char_length(bio) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- El perfil se crea automáticamente al registrarse (trigger sobre auth.users).
-- (Función de referencia; se implementa en Fase 1)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Vecino/a'));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

#### `categories` — categorías de objeto (datos de referencia)

Jerárquica (`parent_id`) para la **ampliación de categorías** de Fase 3 sin reescritura. En Fase 2 los **validadores se asignan por categoría** (ver `role_grants.category_id`).

```sql
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  parent_id   uuid references public.categories(id),   -- jerarquía (Fase 3)
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
```

#### `destinations` — los 4 destinos del objeto (datos de referencia, fijos)

```sql
create table public.destinations (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,    -- 'reciclaje' | 'segunda-vida' | 'reacondicionamiento' | 'donacion'
  name        text not null,
  description text,
  icon        text,
  sort_order  int not null default 0
);

-- Seed de referencia (los 4 destinos del producto):
insert into public.destinations (slug, name, description, sort_order) values
  ('reciclaje',          'Reciclaje real',        'Gestión correcta del material para reciclarlo.',        1),
  ('segunda-vida',       'Segunda vida',          'El objeto pasa a otra persona que lo necesita.',        2),
  ('reacondicionamiento','Reacondicionamiento',   'Reparación/restauración en un taller antes de reusar.', 3),
  ('donacion',           'Donación',              'Cesión a entidad o persona sin contraprestación.',      4);
```

#### `objects` — objetos publicados

```sql
-- 'pending' = enviado por el usuario, en cola de moderación (ADR-017).
-- 'draft'   = borrador del usuario (aún no enviado a moderar).
create type object_status as enum ('draft','pending','published','reserved','completed','withdrawn');

create table public.objects (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  category_id    uuid not null references public.categories(id),
  destination_id uuid not null references public.destinations(id),
  title          text not null check (char_length(title) between 3 and 120),
  description    text check (char_length(description) <= 2000),

  -- Ubicación: SOLO a nivel de barrio. NO existe columna de dirección.
  neighborhood   text,
  city           text not null default 'Barcelona',
  -- Para el filtro "cerca de mí". Se almacenan DIFUMINADAS al centroide del barrio
  -- (redondeo a ~3 decimales / snap a rejilla). Nunca la posición exacta del domicilio.
  approx_lat     numeric(9,6),
  approx_lng     numeric(9,6),

  status         object_status not null default 'draft',

  -- FASE 2 (validadores): columnas previstas, nulas hasta entonces. No requieren reescritura.
  validated_by   uuid references public.profiles(id),
  validated_at   timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index objects_status_idx       on public.objects (status);
create index objects_category_idx     on public.objects (category_id);
create index objects_destination_idx  on public.objects (destination_id);
create index objects_neighborhood_idx on public.objects (neighborhood);
```

```sql
-- Fotos del objeto (1:N). El binario vive en Supabase Storage; aquí solo la ruta.
create table public.object_photos (
  id           uuid primary key default gen_random_uuid(),
  object_id    uuid not null references public.objects(id) on delete cascade,
  storage_path text not null,            -- ruta dentro del bucket 'object-photos'
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
```

#### `exchanges` — trazabilidad cedente → receptor

Núcleo de la promesa _"tu silla está ahora en casa de Marta, Gràcia"_. La trazabilidad expone **nombre de pila + barrio destino**, nunca dirección.

```sql
create type exchange_status as enum ('requested','accepted','rejected','completed','cancelled');

create table public.exchanges (
  id           uuid primary key default gen_random_uuid(),
  object_id    uuid not null references public.objects(id) on delete cascade,
  giver_id     uuid not null references public.profiles(id),   -- cedente (dueño del objeto)
  receiver_id  uuid not null references public.profiles(id),   -- receptor (quien lo solicita)
  status       exchange_status not null default 'requested',
  message      text check (char_length(message) <= 1000),      -- mensaje inicial de contacto

  -- Trazabilidad mostrada al cedente: SOLO barrio destino. Nunca dirección.
  destination_neighborhood text,

  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  check (giver_id <> receiver_id)
);

create index exchanges_object_idx   on public.exchanges (object_id);
create index exchanges_giver_idx    on public.exchanges (giver_id);
create index exchanges_receiver_idx on public.exchanges (receiver_id);
```

#### `impact` — impacto personal (ledger append-only)

Registro **append-only** de eventos de impacto por persona. Alimenta el "impacto personal" (Fase 1) y el **vertedero visual de impacto** (Fase 2) mediante agregación. Lo escribe el sistema (trigger / `service_role`) al completarse un intercambio, no el cliente.

```sql
create table public.impact (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  exchange_id      uuid references public.exchanges(id) on delete set null,
  object_id        uuid references public.objects(id) on delete set null,
  destination_id   uuid references public.destinations(id),
  -- Métricas estimadas del evento (se suman para el total de la persona / global):
  co2_saved_kg     numeric(10,2) not null default 0,
  waste_diverted_kg numeric(10,2) not null default 0,
  objects_count    int not null default 1,
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index impact_profile_idx on public.impact (profile_id);
```

### 2.3 Tablas de Fase 2 — anticipadas (NO se crean aún)

Especificadas aquí para garantizar que el modelo de Fase 1 las admite sin migración destructiva. **No** forman parte de las migraciones de Fase 1.

#### Roles caducables por categoría (`role_grants`) — anti-acumulación de poder

Los roles **no son permisos eternos**: son **concesiones con caducidad** (`expires_at`) y revocables. Implementa la **rotación forzada** y el principio de que nadie acumula poder indefinidamente. Un validador se asigna **por categoría** (`category_id`).

```sql
-- FASE 2 — referencia, no crear todavía
create type app_role as enum ('member','validator','steward');  -- steward = gobernanza

create table public.role_grants (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  role         app_role not null,
  category_id  uuid references public.categories(id),   -- validator: acotado por categoría
  granted_by   uuid references public.profiles(id),     -- trazabilidad de quién concede
  granted_at   timestamptz not null default now(),
  expires_at   timestamptz,                             -- CADUCABLE: rotación forzada
  revoked_at   timestamptz
);

-- Comprobación de rol activo: función, NO columna generada
-- (una columna generada no puede usar now()).
create or replace function public.has_active_role(
  p_profile uuid, p_role app_role, p_category uuid default null
) returns boolean language sql stable as $$
  select exists (
    select 1 from public.role_grants g
    where g.profile_id = p_profile
      and g.role = p_role
      and g.revoked_at is null
      and (g.expires_at is null or g.expires_at > now())
      and (p_category is null or g.category_id = p_category)
  );
$$;
```

> **Cómo encaja sin reescritura:** `objects.validated_by` / `validated_at` ya existen. La política RLS de validación de Fase 2 será simplemente `has_active_role(auth.uid(), 'validator', category_id)`. Nada que migrar en `objects`.

#### Recompensas (`rewards`) — compatibles con blockchain a futuro

Saldo en **BD normal primero**. El campo `amount` es `numeric` de alta precisión y existe `on_chain_ref` (nulo) para una **futura** migración a token sin reescribir el histórico.

```sql
-- FASE 2 — referencia, no crear todavía
create table public.rewards (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  kind         text not null,                       -- p.ej. 'exchange_completed', 'validation'
  amount       numeric(20,6) not null default 0,    -- precisión apta para tokens futuros
  reason       text,
  exchange_id  uuid references public.exchanges(id),
  on_chain_ref text,                                -- NULL hoy; hash/tx cuando migre a blockchain
  created_at   timestamptz not null default now()
);
```

#### Gobernanza (`proposals`, `votes`) — contrapesos y veto ciudadano

```sql
-- FASE 2 — referencia, no crear todavía
create table public.proposals (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id),
  title      text not null,
  body       text not null,
  status     text not null default 'open',  -- 'open' | 'passed' | 'rejected' | 'vetoed'
  opens_at   timestamptz not null default now(),
  closes_at  timestamptz,
  created_at timestamptz not null default now()
);

create table public.votes (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  voter_id    uuid not null references public.profiles(id),
  choice      text not null,                 -- 'yes' | 'no' | 'abstain' | 'veto'
  created_at  timestamptz not null default now(),
  unique (proposal_id, voter_id)             -- una persona, un voto
);
```

> **Transparencia (principio):** gobernanza y validación se diseñan con **lectura pública** (RLS `select` abierto), porque la transparencia es un principio. Solo se protege la PII de `profiles` (que ya es mínima).

### 2.4 Privacidad en el modelo — reglas estructurales

- **No hay dirección exacta en ninguna tabla.** El dato más fino es `neighborhood`.
- Coordenadas (`approx_lat/lng`) **difuminadas** al centroide del barrio. Nunca geolocalización precisa del domicilio.
- La trazabilidad al cedente = `receiver.display_name` (nombre de pila) + `exchanges.destination_neighborhood`. Ejemplo de salida: _"Tu silla está ahora en casa de **Marta**, **Gràcia**."_
- El **email** solo en `auth.users`, gestionado por Supabase Auth. No se copia a `public`.
- Ver §8 para el inventario GDPR completo (qué se recoge, base legal, supresión).

---

## 3. Convenciones de seguridad desde el día 1

No es una capa que se añade después: es la línea base desde la primera migración.

### 3.1 RLS activado en **todas** las tablas

```sql
-- Patrón aplicado a CADA tabla de public.* sin excepción:
alter table public.<tabla> enable row level security;
alter table public.<tabla> force row level security;  -- ni el dueño de la tabla salta RLS
```

> **Regla:** una tabla sin RLS habilitado **no se mergea**. Con RLS habilitado y **sin** políticas, el acceso queda denegado por defecto (fail-closed), que es justo lo que queremos hasta definir políticas explícitas.

### 3.2 Políticas de acceso explícitas por rol (Fase 1)

Resumen de la intención por tabla (DDL de políticas en §4.4):

| Tabla | `anon` (no autenticado) | `authenticated` (sesión) | Escritura |
|---|---|---|---|
| `profiles` | `select` (datos mínimos, públicos) | `select` todos; `update`/`delete` **solo el propio** | Solo el propio (`id = auth.uid()`) |
| `categories`, `destinations` | `select` | `select` | Solo `service_role` (seed/migración) |
| `objects` | `select` de `status='published'` | + `select` propios borradores; `insert`/`update`/`delete` **solo propios** | Dueño (`owner_id = auth.uid()`) |
| `object_photos` | `select` si el objeto es público | igual + gestión de los propios | Dueño del objeto |
| `exchanges` | — (nada) | `select`/`update` **solo si eres `giver` o `receiver`**; `insert` como `receiver` | Partes implicadas |
| `impact` | — | `select` **solo el propio** | Sistema (`service_role`/trigger), no cliente |

### 3.3 Separación estricta cliente / servidor

- `service_role` **jamás** en el navegador. Vive solo en `lib/supabase/admin.ts` con `import 'server-only'`.
- Solo variables `NEXT_PUBLIC_*` pueden entrar al bundle de cliente. Cualquier otro secreto es server-only.
- Las **Server Actions** y **Route Handlers** son la frontera de confianza: validan entrada (Zod) y dependen de RLS para autorizar.

### 3.4 Validación y saneamiento de toda entrada

- **Doble validación:** cliente (UX inmediata) **y** servidor (autoridad). El servidor nunca confía en lo que envía el cliente.
- Esquemas **Zod** en `lib/validations/`, **compartidos** entre formulario y Server Action/route.
- Saneamiento de texto libre antes de renderizar (evitar XSS); nunca interpolar HTML sin escapar.
- IDs y enums validados contra el esquema; rechazar lo desconocido (allow-list, no deny-list).

```ts
// lib/validations/object.ts — esquema compartido cliente+servidor (referencia)
import { z } from 'zod';

export const createObjectSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().uuid(),
  destinationId: z.string().uuid(),
  neighborhood: z.string().trim().max(80).optional(), // barrio, nunca dirección
});
export type CreateObjectInput = z.infer<typeof createObjectSchema>;
```

### 3.5 Variables de entorno documentadas

- Nunca hardcodear claves/tokens. Todo por entorno: `.env.local` (local) y **Vercel Env** (despliegue).
- `.env.example` (Apéndice A) documenta **todas** las variables, **sin valores reales**.
- Lectura **validada y centralizada** en `lib/env.ts` (falla el arranque si falta algo o si un secreto server-only se marca como público).

```ts
// lib/env.ts — validación centralizada (referencia)
import 'server-only';
import { z } from 'zod';

const serverEnv = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
}).parse(process.env);

// Las NEXT_PUBLIC_* se validan aparte y SÍ pueden usarse en cliente.
export const env = serverEnv;
```

### 3.6 Transporte y cabeceras

- **HTTPS siempre** (Vercel lo provee; HSTS forzado, ver §6).
- Cabeceras de seguridad razonables en `next.config.ts` (§6).

### 3.7 Rate limiting en endpoints sensibles

- Formularios públicos (alta de email Fase 0, contacto), **auth** (login/registro/reset) y creación de recursos llevan límite de tasa.
- Implementación de referencia con almacén de borde (p.ej. Upstash Redis) en `lib/rate-limit.ts`, invocado desde `middleware.ts` o desde la propia Server Action.

```ts
// lib/rate-limit.ts — referencia (Fase 1)
import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 intentos / 10 min por clave (IP+ruta)
  prefix: 'rl:auth',
});
```

### 3.8 Dependencias mínimas, conocidas y actualizadas

- Añadir una dependencia es una **decisión**: preferir la plataforma (Next/Supabase) antes que una librería nueva.
- Fijar versiones, revisar `npm audit` / Dependabot, eliminar lo no usado.
- Base esperada Fase 1: `next`, `react`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `tailwindcss`. Todo lo demás se justifica.

---

## 4. Configuración de Supabase

### 4.1 Estructura del proyecto Supabase

- **Auth** siempre vía **Supabase Auth** (email/OTP, OAuth si se decide). **Nunca** autenticación propia, nunca tablas de contraseñas a mano.
- **Database**: esquema de aplicación en `public`; el de Auth (`auth.users`) lo gestiona Supabase. `profiles.id` referencia `auth.users.id`.
- **Storage**: bucket **privado** `object-photos`. El acceso a binarios pasa por políticas de Storage (no URLs públicas adivinables); se sirven con URLs firmadas o vía proxy autorizado.
- **Migraciones**: versionadas en `supabase/migrations/` con la Supabase CLI. Toda definición de tabla, RLS y política **vive en migración**, no se toca a mano en el panel para producción.
- **Tipos**: `types/database.types.ts` se **genera** desde el esquema (`supabase gen types typescript`). No se edita a mano.

### 4.2 Roles y qué puede hacer cada uno

| Rol | Quién es | Qué puede hacer | Dónde se usa |
|---|---|---|---|
| `anon` | Visitante sin sesión | Solo lo que permitan políticas RLS para anónimos (p.ej. ver objetos publicados, categorías). | Cliente público (landing, listado). |
| `authenticated` | Usuario con sesión Supabase Auth | Lo que permita RLS para su `auth.uid()`: gestionar lo propio, participar en intercambios. | Cliente y servidor con sesión del usuario. |
| `service_role` | **Sistema** (backend) | **Bypassa RLS.** Operaciones de plataforma: seeds, escritura en `impact`, tareas administrativas. | **Solo** en servidor (`lib/supabase/admin.ts`, `import 'server-only'`). **Nunca** en el navegador. |

> **Principio anti-poder:** `service_role` representa al **sistema**, no a una persona. No existe una cuenta-humana con poderes que esquive las reglas de negocio. El fundador usa la app con un rol normal como cualquiera (ver §0 y ADR-005/ADR-007).

### 4.3 Los tres clientes (separación cliente/servidor)

```ts
// lib/supabase/client.ts — NAVEGADOR (anon key + sesión). RLS aplica.
import { createBrowserClient } from '@supabase/ssr';
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

```ts
// lib/supabase/server.ts — SERVIDOR (anon key + cookies de sesión). RLS aplica.
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => toSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)),
      },
    },
  );
}
```

```ts
// lib/supabase/admin.ts — service_role. SOLO SERVIDOR. Bypassa RLS. Uso excepcional.
import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,                 // sin NEXT_PUBLIC_: nunca al cliente
    process.env.SUPABASE_SERVICE_ROLE_KEY!,    // secreto server-only
    { auth: { persistSession: false } },
  );
}
```

### 4.4 Políticas base (DDL de referencia)

```sql
-- profiles: lectura pública (datos ya mínimos), escritura solo del propio.
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "profiles_select_public" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = auth.uid());
```

```sql
-- categories / destinations: lectura para todos; escritura solo service_role
-- (no se definen políticas de escritura → denegado para anon/authenticated).
alter table public.categories  enable row level security;
alter table public.destinations enable row level security;

create policy "categories_select_all"   on public.categories   for select using (true);
create policy "destinations_select_all"  on public.destinations for select using (true);
```

```sql
-- objects: público ve 'published'; el dueño gestiona los suyos.
alter table public.objects enable row level security;
alter table public.objects force row level security;

create policy "objects_select_published_or_own" on public.objects
  for select using (status = 'published' or owner_id = auth.uid());

create policy "objects_insert_own" on public.objects
  for insert to authenticated with check (owner_id = auth.uid());

create policy "objects_update_own" on public.objects
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "objects_delete_own" on public.objects
  for delete to authenticated using (owner_id = auth.uid());
```

```sql
-- exchanges: solo las partes (cedente o receptor) ven y operan su intercambio.
alter table public.exchanges enable row level security;
alter table public.exchanges force row level security;

create policy "exchanges_select_parties" on public.exchanges
  for select to authenticated
  using (giver_id = auth.uid() or receiver_id = auth.uid());

-- El receptor inicia la solicitud; el objeto debe estar publicado y no ser suyo.
create policy "exchanges_insert_receiver" on public.exchanges
  for insert to authenticated
  with check (
    receiver_id = auth.uid()
    and exists (
      select 1 from public.objects o
      where o.id = object_id and o.status = 'published' and o.owner_id = giver_id
    )
  );

create policy "exchanges_update_parties" on public.exchanges
  for update to authenticated
  using (giver_id = auth.uid() or receiver_id = auth.uid())
  with check (giver_id = auth.uid() or receiver_id = auth.uid());
```

```sql
-- impact: cada persona ve solo su impacto. La escritura la hace el sistema
-- (service_role / trigger), no el cliente → sin política de insert para usuarios.
alter table public.impact enable row level security;
alter table public.impact force row level security;

create policy "impact_select_own" on public.impact
  for select to authenticated using (profile_id = auth.uid());
```

```sql
-- Storage: bucket privado 'object-photos'. Lectura solo del dueño o vía URL firmada;
-- escritura del usuario en su propia carpeta (prefijo = su uid).
create policy "object_photos_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'object-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "object_photos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'object-photos' and (storage.foldername(name))[1] = auth.uid()::text);
```

> **Fase 2 (anticipado):** las políticas de validación/recompensas/gobernanza reutilizan `has_active_role(...)` (§2.3). Ej.: `objects_update_validator` con `using (has_active_role(auth.uid(),'validator',category_id))`. No requiere cambiar las tablas de Fase 1.

---

## 5. Convenciones de código

### 5.1 Nombrado de archivos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes React | `kebab-case.tsx` | `object-card.tsx`, `exchange-status.tsx` |
| Hooks | `use-*.ts` | `use-nearby-objects.ts` |
| Utilidades / lib | `kebab-case.ts` | `format-distance.ts`, `rate-limit.ts` |
| Esquemas Zod | `<dominio>.ts` en `lib/validations/` | `object.ts`, `profile.ts` |
| Rutas App Router | carpetas en `kebab-case`; ficheros especiales de Next (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`) | `app/objetos/[id]/page.tsx` |
| Tipos generados | fijo | `types/database.types.ts` |

### 5.2 Componentes

- Nombre de componente en **PascalCase**; el fichero en `kebab-case`. Un componente principal por fichero.
- **Server Component por defecto.** `'use client'` solo cuando hace falta (estado, eventos, APIs de navegador), y tan abajo en el árbol como sea posible.
- Props tipadas con `type Props = {...}`. Sin `any`.
- UI sin lógica de dominio en `components/ui/`; compuestos con dominio en `components/<dominio>/`.

```tsx
// components/objetos/object-card.tsx (referencia)
type Props = { object: ObjectSummary; onContact?: (id: string) => void };

export function ObjectCard({ object, onContact }: Props) {
  return ( /* ...JSX... */ );
}
```

### 5.3 Funciones

- **camelCase**, nombre que empieza por verbo: `getNearbyObjects`, `createExchange`, `formatNeighborhood`.
- Booleanos y predicados con prefijo `is/has/should/can`: `isOwner`, `hasActiveRole`.
- Funciones de `utils/` **puras** (sin I/O, deterministas). El acceso a datos vive en `lib/`.
- Server Actions: nombre por intención de negocio; validan con Zod al entrar.

### 5.4 Tipos TypeScript

- **TypeScript `strict`** activado. Prohibido `any` (usar `unknown` + narrowing).
- `type` para alias/uniones/props; `interface` solo si se necesita extensión/merge.
- Tipos de dominio en `types/domain.ts`, derivados de los **generados** (`database.types.ts`), no duplicados a mano.
- Mapeo `snake_case` (BD) → `camelCase` (TS): los tipos generados conservan `snake_case`; si se exponen al dominio, se mapean en una capa de `lib/`. Mantener el criterio **consistente** en todo el repo.
- Enums de BD (`object_status`, etc.) se importan del tipo generado; no se redefinen como strings sueltos.

```ts
// types/domain.ts (referencia)
import type { Database } from './database.types';

export type ObjectRow   = Database['public']['Tables']['objects']['Row'];
export type ObjectStatus = Database['public']['Enums']['object_status'];

// Vista curada para tarjetas del listado (lo que el cliente necesita, nada más):
export type ObjectSummary = Pick<ObjectRow,
  'id' | 'title' | 'neighborhood' | 'status'> & { photoUrl: string | null };
```

### 5.5 Constantes y enums de aplicación

- Constantes en `UPPER_SNAKE_CASE`. Agrupar las de dominio en `lib/constants.ts`.
- Las cadenas mágicas (slugs de destino, estados) provienen de tipos/constantes, nunca literales repetidos.

### 5.6 Estilos

- **Tailwind** con utilidades en el JSX. Tokens/colores de marca en config de Tailwind y `globals.css`. Evitar CSS suelto salvo necesidad puntual.

---

## 6. Cabeceras de seguridad de Next.js

Definidas de forma global en `next.config.ts`. **HTTPS siempre** (Vercel). Incluye: CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

```ts
// next.config.ts — referencia
import type { NextConfig } from 'next';

const supabaseHost = '*.supabase.co';

// CSP base. En producción, endurecer script-src con NONCE por petición (vía middleware)
// y eliminar 'unsafe-inline'. style-src 'unsafe-inline' se mantiene por Tailwind/runtime.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,                    // → migrar a nonce en prod
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://${supabaseHost}`,
  `font-src 'self'`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
```

| Cabecera | Valor | Por qué |
|---|---|---|
| `Content-Security-Policy` | ver arriba | Mitiga XSS/inyección; restringe orígenes a `self` + Supabase. Endurecer con nonce en prod. |
| `X-Frame-Options` | `DENY` | Anti-clickjacking (refuerza `frame-ancestors 'none'`). |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS; previene downgrade. |
| `X-Content-Type-Options` | `nosniff` | Evita MIME-sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No filtra ruta/PII en el `Referer` a terceros. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self), interest-cohort=()` | Desactiva APIs no usadas; `geolocation` solo propio (filtro "cerca de mí"); opta fuera de FLoC. |

> **Nota geolocalización:** aunque se permita `geolocation=(self)`, la coordenada del usuario se usa **en cliente** para calcular cercanía y **nunca** se persiste con precisión. Lo guardado es barrio + coordenada difuminada (§2.4).

---

## 7. Gestión de errores

**Un único patrón** para toda la app (cliente, Server Actions y Route Handlers). Objetivos: (1) nunca filtrar detalles internos al cliente, (2) registrar el error completo en servidor con un identificador de correlación, (3) devolver al cliente un mensaje seguro y un `code` estable.

### 7.1 Clase de error y códigos

```ts
// lib/errors/app-error.ts — referencia
export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND'
  | 'VALIDATION' | 'RATE_LIMITED' | 'CONFLICT' | 'INTERNAL';

const HTTP_STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404,
  VALIDATION: 422, RATE_LIMITED: 429, CONFLICT: 409, INTERNAL: 500,
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    /** Mensaje SEGURO para el usuario (sin detalles internos). */
    public readonly publicMessage: string,
    /** Causa interna para logs; nunca se envía al cliente. */
    public readonly cause?: unknown,
  ) {
    super(publicMessage);
    this.name = 'AppError';
  }
  get status() { return HTTP_STATUS[this.code]; }
}
```

### 7.2 Forma de respuesta única (APIs y Server Actions)

Todo fallo se serializa igual. **Nunca** se incluye `stack` ni `cause` en la respuesta.

```jsonc
// Éxito
{ "data": { /* ... */ } }
// Error
{ "error": { "code": "VALIDATION", "message": "Revisa los campos marcados." } }
```

```ts
// lib/errors/to-response.ts — referencia (Route Handlers)
import { ZodError } from 'zod';
import { AppError } from './app-error';

export function toErrorResponse(err: unknown): Response {
  const correlationId = crypto.randomUUID();

  if (err instanceof AppError) {
    console.error(`[${correlationId}] AppError ${err.code}`, err.cause ?? err);
    return Response.json(
      { error: { code: err.code, message: err.publicMessage } },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    console.warn(`[${correlationId}] Validation`, err.flatten());
    return Response.json(
      { error: { code: 'VALIDATION', message: 'Datos no válidos.' } },
      { status: 422 },
    );
  }
  // Desconocido: se registra completo, al cliente solo lo genérico.
  console.error(`[${correlationId}] Unhandled`, err);
  return Response.json(
    { error: { code: 'INTERNAL', message: 'Algo ha ido mal. Inténtalo de nuevo.' } },
    { status: 500 },
  );
}
```

```ts
// Uso en un Route Handler (referencia)
export async function POST(req: Request) {
  try {
    const input = createObjectSchema.parse(await req.json()); // ZodError → 422
    // ...lógica con RLS...
    return Response.json({ data: result });
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

```ts
// Server Action: devuelve un resultado tipado, no lanza al cliente (referencia)
export async function createObjectAction(input: unknown): Promise<
  { data: ObjectRow } | { error: { code: ErrorCode; message: string } }
> {
  try {
    const parsed = createObjectSchema.parse(input);
    /* ... */
    return { data };
  } catch (err) {
    if (err instanceof AppError) return { error: { code: err.code, message: err.publicMessage } };
    console.error(err);
    return { error: { code: 'INTERNAL', message: 'No se ha podido completar.' } };
  }
}
```

### 7.3 Cliente

- **Error boundaries** de Next: `app/error.tsx` (segmentos) y `app/global-error.tsx` (raíz). `not-found.tsx` para 404.
- El cliente **traduce `code` → mensaje** para el usuario (centralizado), no muestra mensajes crudos del servidor.
- Nunca se vuelca PII ni detalles técnicos en la UI ni en `console` del navegador.

### 7.4 Reglas transversales de logging

- Log **solo en servidor**, con `correlationId`. **Nunca** registrar PII (email, nombre, coordenadas), tokens ni cuerpos completos con datos personales (ver §8).
- En cliente, `console` queda libre de datos personales y de errores con detalle interno.

---

## 8. Checklist de privacidad GDPR

Privacidad **por defecto y desde el diseño** (art. 25 RGPD). Responsable: el proyecto Reviu (entidad sin ánimo de lucro). Marco: RGPD (UE) + LOPDGDD (España).

### 8.1 Inventario de datos y base legal

| Dato | Dónde | Finalidad | Base legal (art. 6) | Conservación |
|---|---|---|---|---|
| Email | `auth.users` (Supabase Auth) | Identificación, login, avisos del servicio | **Ejecución de servicio** + consentimiento para avisos | Hasta baja de cuenta |
| Email de la landing (Fase 0) | (Fase 0 sin BD; si se captura, tabla `subscribers`) | Avisar del lanzamiento | **Consentimiento explícito** (checkbox no premarcado) | Hasta lanzamiento o baja; lo antes |
| `display_name` (nombre de pila) | `profiles` | Mostrar autoría/trazabilidad humana | Ejecución de servicio | Hasta baja |
| `neighborhood` (barrio) | `profiles`, `objects`, `exchanges` | Filtro de cercanía y trazabilidad **aproximada** | Ejecución de servicio | Hasta baja / borrado del objeto |
| Coordenada **difuminada** | `objects.approx_lat/lng` | Filtro "cerca de mí" | Ejecución de servicio | Hasta borrado del objeto |
| Fotos de objeto | Storage `object-photos` | Mostrar el objeto | Ejecución de servicio | Hasta borrado del objeto |
| Mensajes de intercambio | `exchanges.message` | Coordinar la cesión | Ejecución de servicio | Hasta baja / cierre |
| Métricas de impacto | `impact` | Impacto personal y agregado | Interés legítimo / servicio | Agregable y anonimizable |

> **No se recoge:** dirección exacta, teléfono, DNI, datos de categorías especiales (art. 9). Si en el futuro hiciera falta, requiere su propia evaluación (DPIA) y entra como ADR.

### 8.2 Minimización de datos

- `profiles` es deliberadamente mínima (§2.1). El email **no** se duplica fuera de Auth.
- Ubicación siempre a nivel **barrio**; coordenadas **difuminadas**; **nunca** dirección exacta (§2.4).
- Cada campo nuevo debe justificar su finalidad antes de añadirse (regla de revisión en PR).

### 8.3 Consentimiento

- Consentimiento **explícito** (checkbox **no** premarcado) para el alta de email/avisos. Texto claro de finalidad y enlace a política de privacidad.
- Granular: aceptar el servicio ≠ aceptar comunicaciones. Revocable en cualquier momento.
- Registro de cuándo y a qué se consintió.

### 8.4 Cookies — opción más privada por defecto

- **Sin cookies de tracking/marketing.** Solo cookies **estrictamente necesarias** (sesión de Supabase Auth), exentas de consentimiento.
- Si en el futuro se añade analítica, debe ser **sin cookies / sin PII** y **opt-in**; por defecto **desactivada**.
- Banner de cookies: por defecto **solo lo necesario**; nada se activa hasta consentimiento explícito (no "aceptar todo" premarcado).

### 8.5 Derechos de la persona usuaria

- **Acceso / portabilidad:** exportación de los datos propios (perfil, objetos, intercambios, impacto) en formato legible.
- **Rectificación:** edición del perfil y de los objetos propios.
- **Supresión (derecho al olvido):** eliminar la cuenta borra `auth.users`; el `on delete cascade` de `profiles` arrastra `objects`, `object_photos` (+ binarios en Storage), `exchanges` propios e `impact`. Datos en intercambios con terceros se **anonimizan** (se sustituye autoría por "usuario eliminado") en lugar de romper la trazabilidad del otro participante.
- **Oposición / limitación:** revocar consentimiento de comunicaciones sin perder el servicio.
- Procedimiento y plazos (1 mes, art. 12) documentados de cara al usuario en la política de privacidad.

```sql
-- Referencia: el borrado en cascada se apoya en las FKs ya definidas (§2.2).
-- delete from auth.users where id = :uid;  -- arrastra profiles → objects → photos/exchanges/impact
-- La anonimización de datos compartidos con terceros se hace con un paso previo
-- (service_role) que sustituye autoría antes del borrado físico.
```

### 8.6 Nada de datos personales en URLs, logs ni front

- **URLs:** identificadores opacos (`uuid`), nunca email/nombre/coordenadas en query params o paths. Sin PII en parámetros que acaben en logs de acceso o `Referer`.
- **Logs:** solo servidor, con `correlationId`, **sin PII** (§7.4). Prohibido loguear emails, nombres, coordenadas o cuerpos con datos personales.
- **Front/bundle:** ningún secreto ni PII de terceros embebida. Solo `NEXT_PUBLIC_*` no sensibles.
- **Trazabilidad pública:** se muestra **nombre de pila + barrio**, nunca dirección (refuerzo de §2.4).

### 8.7 Encargados del tratamiento

- **Supabase** (BD/Auth/Storage) y **Vercel** (hosting) son encargados del tratamiento: preferir regiones **UE** y firmar/aceptar sus DPA. Documentar en el registro de actividades.

---

## 9. Decisiones de arquitectura (ADR)

Formato breve para **no reabrir debates** cada sesión. Si una decisión cambia, se edita aquí (con fecha y motivo) en el mismo PR que el código.

> **Estado inicial:** todas `Aceptada` el 2026-06-25 salvo indicación. Las marcadas _(Fase 2/3)_ son compromisos de diseño ya tomados aunque se implementen más tarde.

| ADR | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| **001** | **Next.js App Router** (no Pages Router) | RSC, layouts anidados, server actions, frontera cliente/servidor clara; base válida hasta PWA. | Pages Router (modelo más antiguo). |
| **002** | **Supabase** (Postgres + Auth + Storage) como backend | Open-source y **auto-hospedable** → coherente con el ethos sin ánimo de lucro y anti-lock-in; RLS potente; rapidez de Fase 1. | Backend propio a medida (más coste/tiempo); BaaS propietario cerrado. |
| **003** | **RLS como mecanismo de autorización primario** | La seguridad vive en la BD, no solo en la app; fail-closed por defecto; difícil de saltarse desde el cliente. | Autorización solo en capa de aplicación. |
| **004** | **Una sola base de código que crece por fases** | La landing es el cimiento real; evita reescrituras entre fases; el modelo de datos ya anticipa Fase 2–3. | Proyecto landing desechable + reescritura posterior. |
| **005** | **Auth siempre vía Supabase Auth; nunca auth propia** | Seguridad de credenciales delegada a un sistema probado; sin tablas de contraseñas caseras. | Sistema de login propio. |
| **006** _(Fase 2)_ | **Recompensas como ledger `numeric` en Postgres**, con `on_chain_ref` nulo | Permite operar ya en BD normal y migrar a blockchain sin reescribir el histórico. | Saltar directamente a blockchain (complejidad prematura). |
| **007** _(Fase 2)_ | **Roles como concesiones caducables/revocables** (`role_grants` con `expires_at`) | Implementa rotación forzada y **anti-acumulación de poder**; el fundador no es excepción. | Roles permanentes / superadmin con bypass. |
| **008** | **Privacidad: barrio + nombre de pila; nunca dirección exacta** | Cumple privacidad por defecto y la promesa de trazabilidad humana sin exponer domicilios. | Geolocalización precisa / nombre completo. |
| **009** | **TypeScript `strict` + tipos generados de Supabase** | Tipos como contrato único derivado del esquema; menos errores y duplicación. | Tipos a mano / `any`. |
| **010** | **Tailwind CSS** | Velocidad, consistencia, poco CSS suelto; encaja con componentes RSC. | CSS-in-JS / CSS modules como base. |
| **011** | **Cookies: solo estrictamente necesarias por defecto** | Opción más privada; sin tracking; analítica futura opt-in y sin PII. | Analítica con cookies por defecto. |
| **012** | **Rate limiting en auth y formularios** (almacén de borde) | Mitiga abuso/fuerza bruta en los puntos sensibles desde Fase 1. | Sin límite / solo en producción tardía. |
| **013** | **Validación con Zod compartida cliente+servidor** | Una sola definición de forma de datos; el servidor nunca confía en el cliente. | Validar solo en cliente. |
| **014** | **Secretos solo por entorno; `service_role` server-only** | Evita fugas en el bundle; separación de confianza estricta. | Claves en código / en cliente. |
| **015** _(Fase 3)_ | **PWA como evolución de la misma app**, no app nativa separada | Reutiliza el código y la arquitectura; instalable; coherente con ADR-004. | App nativa independiente. |
| **016** | **Regiones UE en Supabase/Vercel + DPA** | Cumplimiento RGPD y minimización de transferencias internacionales. | Regiones fuera de UE por defecto. |
| **017** _(2026-06-28)_ | **`pending` añadido a `object_status`** como estado de moderación previo a `published` | Distinguir "borrador del usuario" (`draft`) de "enviado y en cola de moderación" (`pending`). La RLS `objects_select_published_or_own` existente ya lo oculta al público sin cambios. Migración: `0003_add_pending_status.sql`. | Reutilizar `draft` para ambos (mezcla intenciones distintas: edición vs. revisión externa). |

---

## Apéndice A — `.env.example`

> Plantilla de referencia. El fichero real `.env.example` se crea en Fase 1 **sin valores**. `.env.local` (local) y **Vercel Env** (despliegue) contienen los valores reales y **nunca** se commitean. Solo `NEXT_PUBLIC_*` llega al cliente.

```bash
# === Público (SÍ llega al bundle de cliente; no debe ser sensible) ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=

# === Solo servidor (NUNCA con prefijo NEXT_PUBLIC_, nunca en el cliente) ===
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=        # bypassa RLS: máximo cuidado, solo en lib/supabase/admin.ts

# === Rate limiting (Fase 1+) ===
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Reglas:
- Nunca hardcodear estos valores en el código.
- `SUPABASE_SERVICE_ROLE_KEY` jamás se referencia desde un módulo importable por el cliente.
- Toda variable nueva se documenta aquí **y** se valida en `lib/env.ts` antes de usarse.

---

## Apéndice B — Mapa fase → componentes

| Fase | Entregable | Toca | No toca aún |
|---|---|---|---|
| **0 — Landing** | Manifiesto + form email + enlace Change.org. Estática, sin BD. | `app/(marketing)/`, cabeceras (§6), consentimiento (§8.3) | Supabase, tablas |
| **1 — Núcleo** | Auth, perfil, publicar objeto, listado cercano, contacto, intercambio, impacto personal. | `profiles, categories, destinations, objects, object_photos, exchanges, impact` + RLS (§4.4) + Storage | `role_grants, rewards, proposals, votes` |
| **2 — Sistema** | Validadores (rol caducable por categoría), recompensas, vertedero visual, gobernanza con contrapesos. | `role_grants` (+`has_active_role`), `rewards`, `proposals`, `votes`; políticas de validación | Blockchain |
| **3 — Escala** | PWA instalable, transporte organizado, más categorías, (futuro) blockchain. | `manifest`, service worker, `categories.parent_id`, `rewards.on_chain_ref` | — |

---

_Fin de ARQUITECTURA.md. Si vas a tomar una decisión que este documento no cubre, **añádela como ADR (§9)** en el mismo cambio. Mantener este fichero coherente es responsabilidad de cada sesión._

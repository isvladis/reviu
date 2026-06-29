-- ============================================================================
-- Reviu — Migración 0006: mensajería interna entre usuarios
-- ============================================================================
-- Referencia: ARQUITECTURA.md §2 (modelo), §3 (seguridad), §4 (Supabase).
--
-- Motivación:
--   Fase 1 incorpora mensajería interna ligada al objeto: una conversación
--   por (objeto, interesado), con el publicador como segundo participante.
--   El sistema "gancho" del detalle público ya muestra el botón "Enviar
--   mensaje" cuando el publicador tiene contact_inapp = true. Esta migración
--   crea el soporte de datos: conversations + messages.
--
-- Reglas:
--   * Una conversación por (object_id, requester_id) — unique constraint.
--   * Solo participantes (requester o owner) leen/escriben la conversación
--     y sus mensajes — RLS lo garantiza en BD (ARQUITECTURA §3).
--   * Rate limiting (10 msg/hora/conversación) se aplica en Server Action,
--     no en BD (sería overengineering para Fase 1).
--   * read_at en messages para badge de no leídos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  object_id     uuid not null references public.objects(id) on delete cascade,
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (object_id, requester_id),
  check (requester_id <> owner_id)
);

create index if not exists conversations_requester_idx on public.conversations (requester_id);
create index if not exists conversations_owner_idx     on public.conversations (owner_id);
create index if not exists conversations_object_idx    on public.conversations (object_id);
create index if not exists conversations_updated_idx   on public.conversations (updated_at desc);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  content         text not null check (char_length(content) between 1 and 1000),
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_sender_idx       on public.messages (sender_id);
create index if not exists messages_unread_idx       on public.messages (conversation_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Trigger: al insertar un mensaje, actualizar updated_at de la conversación
-- para que el orden "última actividad" sea barato.
-- ---------------------------------------------------------------------------
create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations
     set updated_at = now()
   where id = new.conversation_id;
  return new;
end; $$;

drop trigger if exists on_message_inserted on public.messages;
create trigger on_message_inserted
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- ============================================================================
-- RLS — habilitado y forzado (ARQUITECTURA §3.1)
-- ============================================================================
alter table public.conversations enable row level security;
alter table public.conversations force  row level security;
alter table public.messages      enable row level security;
alter table public.messages      force  row level security;

-- ============================================================================
-- GRANTs — autenticados únicamente; anónimos sin acceso.
-- ============================================================================
grant select, insert, update on public.conversations to authenticated;
grant select, insert, update on public.messages      to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas — conversations  (solo participantes)
-- ---------------------------------------------------------------------------
drop policy if exists conversations_select_parties on public.conversations;
create policy conversations_select_parties on public.conversations
  for select to authenticated
  using (requester_id = auth.uid() or owner_id = auth.uid());

-- Inserción: el interesado inicia la conversación. owner_id debe coincidir
-- con el dueño REAL del objeto (en BD), no con un valor enviado por el
-- cliente. El objeto debe estar publicado y el publicador debe permitir
-- contact_inapp (consentimiento del publicador, ADR-019).
drop policy if exists conversations_insert_requester on public.conversations;
create policy conversations_insert_requester on public.conversations
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_id <> owner_id
    and exists (
      select 1 from public.objects o
       where o.id = object_id
         and o.status = 'published'
         and o.owner_id = conversations.owner_id
    )
    and exists (
      select 1 from public.profiles p
       where p.id = owner_id
         and p.contact_inapp = true
    )
  );

-- ---------------------------------------------------------------------------
-- Políticas — messages  (solo participantes de la conversación)
-- ---------------------------------------------------------------------------
drop policy if exists messages_select_parties on public.messages;
create policy messages_select_parties on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
       where c.id = conversation_id
         and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Inserción: el sender es siempre el usuario actual y debe ser participante.
drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
       where c.id = conversation_id
         and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Update: solo se permite para marcar como leído. La policy comprueba que
-- el usuario es participante; lo que se modifica (solo read_at) se controla
-- en servidor con una whitelist de campos.
drop policy if exists messages_update_parties on public.messages;
create policy messages_update_parties on public.messages
  for update to authenticated
  using (
    exists (
      select 1 from public.conversations c
       where c.id = conversation_id
         and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
       where c.id = conversation_id
         and (c.requester_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

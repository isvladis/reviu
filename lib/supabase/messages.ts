import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createSignedPhotoUrl } from "@/lib/supabase/storage";

// ---------------------------------------------------------------------------
// Tipos de salida (curados para la UI)
// ---------------------------------------------------------------------------

export type ConversationListItem = {
  id: string;
  objectId: string;
  objectTitle: string;
  objectThumbnailUrl: string | null;
  otherDisplayName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
  hasUnread: boolean;
};

export type ConversationMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
};

export type ConversationDetail = {
  id: string;
  objectId: string;
  objectTitle: string;
  objectThumbnailUrl: string | null;
  otherDisplayName: string;
  iAmRequester: boolean;
  messages: ConversationMessage[];
};

// ---------------------------------------------------------------------------
// Forma de filas con joins (Relationships=[] en types/supabase.ts → no se
// deducen; tipamos a mano como en el resto de queries).
// ---------------------------------------------------------------------------

type OneOrMany<T> = T | T[] | null;

function pickOne<T>(value: OneOrMany<T> | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type ConversationListRow = {
  id: string;
  object_id: string;
  requester_id: string;
  owner_id: string;
  updated_at: string;
  objects: OneOrMany<{
    id: string;
    title: string;
    object_photos: { storage_path: string; sort_order: number }[] | null;
  }>;
  requester: OneOrMany<{ id: string; display_name: string }>;
  owner: OneOrMany<{ id: string; display_name: string }>;
};

// ---------------------------------------------------------------------------
// Lista de conversaciones del usuario actual (como interesado o publicador).
// Ordenadas por última actividad. Cada item incluye preview del último
// mensaje y flag de no leídos.
// ---------------------------------------------------------------------------

export async function listMyConversations(): Promise<ConversationListItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      object_id,
      requester_id,
      owner_id,
      updated_at,
      objects:object_id (
        id,
        title,
        object_photos ( storage_path, sort_order )
      ),
      requester:requester_id ( id, display_name ),
      owner:owner_id ( id, display_name )
      `,
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[listMyConversations]", error);
    }
    return [];
  }

  const rows = (data ?? []) as ConversationListRow[];
  if (rows.length === 0) return [];

  const conversationIds = rows.map((r) => r.id);

  // Último mensaje + count no leídos por conversación. Se hace en dos
  // queries pequeñas (Fase 1; volumen bajo). Optimizable más tarde con
  // función SQL si hace falta.
  const { data: lastMessagesData } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at, sender_id, read_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const lastByConversation = new Map<
    string,
    { content: string; createdAt: string }
  >();
  const unreadByConversation = new Map<string, boolean>();

  for (const m of lastMessagesData ?? []) {
    if (!lastByConversation.has(m.conversation_id)) {
      lastByConversation.set(m.conversation_id, {
        content: m.content,
        createdAt: m.created_at,
      });
    }
    // No leídos: mensajes recibidos (sender != yo) sin read_at.
    if (m.sender_id !== user.id && m.read_at === null) {
      unreadByConversation.set(m.conversation_id, true);
    }
  }

  return Promise.all(
    rows.map(async (row) => {
      const object = pickOne(row.objects);
      const requester = pickOne(row.requester);
      const owner = pickOne(row.owner);

      const iAmRequester = row.requester_id === user.id;
      const otherDisplayName = iAmRequester
        ? owner?.display_name ?? "Vecino/a"
        : requester?.display_name ?? "Vecino/a";

      const photos = (object?.object_photos ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);
      const firstPath = photos[0]?.storage_path ?? null;
      const objectThumbnailUrl = firstPath
        ? await createSignedPhotoUrl(firstPath, 3600)
        : null;

      const last = lastByConversation.get(row.id);
      const preview = last ? truncate(last.content, 60) : null;

      return {
        id: row.id,
        objectId: row.object_id,
        objectTitle: object?.title ?? "Objeto",
        objectThumbnailUrl,
        otherDisplayName,
        lastMessagePreview: preview,
        lastMessageAt: last?.createdAt ?? null,
        updatedAt: row.updated_at,
        hasUnread: unreadByConversation.get(row.id) === true,
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// Cuenta de mensajes no leídos del usuario (badge en dashboard).
// ---------------------------------------------------------------------------

export async function countUnreadMessages(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  // RLS ya filtra a las conversaciones del usuario; aquí pedimos los
  // mensajes que NO ha enviado él y aún no han sido marcados como leídos.
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[countUnreadMessages]", error);
    }
    return 0;
  }
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Detalle de conversación: cabecera con objeto + lista de mensajes.
// Devuelve null si no existe o si el usuario no es participante (RLS lo
// filtra silenciosamente).
// ---------------------------------------------------------------------------

type ConversationDetailRow = {
  id: string;
  object_id: string;
  requester_id: string;
  owner_id: string;
  objects: OneOrMany<{
    id: string;
    title: string;
    object_photos: { storage_path: string; sort_order: number }[] | null;
  }>;
  requester: OneOrMany<{ id: string; display_name: string }>;
  owner: OneOrMany<{ id: string; display_name: string }>;
};

export async function getConversationDetail(
  conversationId: string,
): Promise<ConversationDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const result = await supabase
    .from("conversations")
    .select(
      `
      id,
      object_id,
      requester_id,
      owner_id,
      objects:object_id (
        id,
        title,
        object_photos ( storage_path, sort_order )
      ),
      requester:requester_id ( id, display_name ),
      owner:owner_id ( id, display_name )
      `,
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (result.error || !result.data) {
    if (result.error && process.env.NODE_ENV !== "production") {
      console.error("[getConversationDetail]", result.error);
    }
    return null;
  }

  const row = result.data as ConversationDetailRow;
  const object = pickOne(row.objects);
  const requester = pickOne(row.requester);
  const owner = pickOne(row.owner);

  const iAmRequester = row.requester_id === user.id;
  const otherDisplayName = iAmRequester
    ? owner?.display_name ?? "Vecino/a"
    : requester?.display_name ?? "Vecino/a";

  const photos = (object?.object_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
  const firstPath = photos[0]?.storage_path ?? null;
  const objectThumbnailUrl = firstPath
    ? await createSignedPhotoUrl(firstPath, 3600)
    : null;

  const { data: messageRows, error: msgError } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[getConversationDetail] messages", msgError);
    }
    return null;
  }

  const messages: ConversationMessage[] = (messageRows ?? []).map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    content: m.content,
    createdAt: m.created_at,
    readAt: m.read_at,
    isMine: m.sender_id === user.id,
  }));

  return {
    id: row.id,
    objectId: row.object_id,
    objectTitle: object?.title ?? "Objeto",
    objectThumbnailUrl,
    otherDisplayName,
    iAmRequester,
    messages,
  };
}

// ---------------------------------------------------------------------------
// Marca como leídos todos los mensajes recibidos en la conversación. Lo
// llama la página al cargar el hilo.
// ---------------------------------------------------------------------------

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[markConversationRead]", error);
  }
}

// ---------------------------------------------------------------------------
// Cuenta de mensajes enviados por el usuario en la última hora dentro de
// una conversación (rate limiting de Server Action).
// ---------------------------------------------------------------------------

export async function countRecentMessagesFromUser(
  conversationId: string,
  userId: string,
): Promise<number> {
  const supabase = await createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("sender_id", userId)
    .gte("created_at", oneHourAgo);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[countRecentMessagesFromUser]", error);
    }
    // Fail-closed: si no podemos contar, mejor bloquear.
    return Number.MAX_SAFE_INTEGER;
  }
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

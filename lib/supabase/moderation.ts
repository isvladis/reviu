import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createSignedPhotoUrl } from "@/lib/supabase/storage";
import type { UserRole } from "@/types/supabase";

/**
 * Comprueba el rol del usuario actual desde profiles.
 * Devuelve null si no hay sesión.
 *
 * NOTA: la verificación auténtica vive en la BD (RLS + has_role()).
 * Esta función es la primera línea (UX + 404 amigable + guard de Server Action);
 * RLS bloquea cualquier intento que se le escape.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role ?? null;
}

export async function isModerator(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "moderator" || role === "admin";
}

export type PendingObjectListItem = {
  id: string;
  title: string;
  neighborhood: string | null;
  city: string;
  createdAt: string;
  categoryName: string;
  destinationName: string;
  giverName: string;
  thumbnailUrl: string | null;
};

// Forma de fila tras la consulta con joins; types/supabase.ts tiene
// Relationships=[] (tipos a mano), así que el cliente PostgREST no la deduce.
type PendingObjectRow = {
  id: string;
  title: string;
  neighborhood: string | null;
  city: string;
  created_at: string;
  categories: { name: string } | { name: string }[] | null;
  destinations: { name: string } | { name: string }[] | null;
  profiles:
    | { display_name: string; neighborhood: string | null; city: string }
    | { display_name: string; neighborhood: string | null; city: string }[]
    | null;
  object_photos: { storage_path: string; sort_order: number }[] | null;
};

type PendingObjectDetailRow = PendingObjectRow & {
  description: string | null;
  status: "pending";
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Lista de objetos en cola de moderación (status = 'pending').
 * Ordenados por más antiguos primero (cola FIFO de revisión).
 * Las miniaturas son URLs firmadas (1 h) generadas en servidor.
 */
export async function listPendingObjects(): Promise<PendingObjectListItem[]> {
  const supabase = await createClient();

  const result = await supabase
    .from("objects")
    .select(
      `
      id,
      title,
      neighborhood,
      city,
      created_at,
      categories:category_id ( name ),
      destinations:destination_id ( name ),
      profiles:owner_id ( display_name, neighborhood, city ),
      object_photos ( storage_path, sort_order )
      `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const error = result.error;
  const data = (result.data ?? []) as PendingObjectRow[];

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[listPendingObjects]", error);
    }
    return [];
  }

  const items: PendingObjectListItem[] = await Promise.all(
    data.map(async (row) => {
      const photos = (row.object_photos ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);
      const firstPath = photos[0]?.storage_path ?? null;
      const thumbnailUrl = firstPath
        ? await createSignedPhotoUrl(firstPath, 3600)
        : null;

      const category = pickOne(row.categories);
      const destination = pickOne(row.destinations);
      const profile = pickOne(row.profiles);

      return {
        id: row.id,
        title: row.title,
        neighborhood: row.neighborhood,
        city: row.city,
        createdAt: row.created_at,
        categoryName: category?.name ?? "—",
        destinationName: destination?.name ?? "—",
        giverName: profile?.display_name ?? "Vecino/a",
        thumbnailUrl,
      };
    }),
  );

  return items;
}

export async function countPendingObjects(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("objects")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[countPendingObjects]", error);
    }
    return 0;
  }
  return count ?? 0;
}

export type PendingObjectDetail = {
  id: string;
  title: string;
  description: string | null;
  neighborhood: string | null;
  city: string;
  createdAt: string;
  categoryName: string;
  destinationName: string;
  giverName: string;
  // PII restringida: nombre + barrio del cedente; nunca email.
  giverNeighborhood: string | null;
  giverCity: string | null;
  photoUrls: string[];
};

/**
 * Detalle de un objeto pending para revisión.
 * Genera URLs firmadas (1 h) para TODAS las fotos.
 * Devuelve null si no existe o no está en pending.
 */
export async function getPendingObjectDetail(
  objectId: string,
): Promise<PendingObjectDetail | null> {
  const supabase = await createClient();

  const result = await supabase
    .from("objects")
    .select(
      `
      id,
      title,
      description,
      neighborhood,
      city,
      status,
      created_at,
      categories:category_id ( name ),
      destinations:destination_id ( name ),
      profiles:owner_id ( display_name, neighborhood, city ),
      object_photos ( storage_path, sort_order )
      `,
    )
    .eq("id", objectId)
    .eq("status", "pending")
    .maybeSingle();

  const error = result.error;
  const data = result.data as PendingObjectDetailRow | null;

  if (error || !data) {
    if (process.env.NODE_ENV !== "production" && error) {
      console.error("[getPendingObjectDetail]", error);
    }
    return null;
  }

  const photos = (data.object_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const photoUrls = (
    await Promise.all(
      photos.map((p) => createSignedPhotoUrl(p.storage_path, 3600)),
    )
  ).filter((url): url is string => Boolean(url));

  const category = pickOne(data.categories);
  const destination = pickOne(data.destinations);
  const profile = pickOne(data.profiles);

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    neighborhood: data.neighborhood,
    city: data.city,
    createdAt: data.created_at,
    categoryName: category?.name ?? "—",
    destinationName: destination?.name ?? "—",
    giverName: profile?.display_name ?? "Vecino/a",
    giverNeighborhood: profile?.neighborhood ?? null,
    giverCity: profile?.city ?? null,
    photoUrls,
  };
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createSignedPhotoUrl } from "@/lib/supabase/storage";

// ---------------------------------------------------------------------------
// Tipos de salida (curados para la UI pública)
// ---------------------------------------------------------------------------

export type PublicObjectListItem = {
  id: string;
  title: string;
  neighborhood: string | null;
  city: string;
  createdAt: string;
  categoryName: string;
  categorySlug: string;
  thumbnailUrl: string | null;
};

export type PublicObjectDetail = {
  id: string;
  title: string;
  description: string | null;
  neighborhood: string | null;
  city: string;
  createdAt: string;
  categoryName: string;
  destinationName: string;
  ownerId: string;
  ownerDisplayName: string;
  // Datos sensibles: rellenados condicionalmente según consentimiento
  // del PUBLICADOR y SI el visitante está autenticado. Si el visitante
  // no tiene sesión, todos quedan en null (sistema "gancho").
  contact: {
    email: string | null;
    phone: string | null;
    inapp: boolean;
  };
  // Preferencias del publicador, para que el detalle sepa si mostrar el
  // banner "este usuario prefiere no recibir contacto directo".
  ownerPrefs: {
    contactEmail: boolean;
    contactPhone: boolean;
    contactInapp: boolean;
  };
  photoUrls: string[];
};

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
};

// ---------------------------------------------------------------------------
// Forma de la fila tras los joins (PostgREST devuelve objeto u array según
// la cardinalidad inferida; types/supabase.ts tiene Relationships=[] por lo
// que el cliente no la deduce).
// ---------------------------------------------------------------------------

type OneOrMany<T> = T | T[] | null;

type ListRow = {
  id: string;
  title: string;
  neighborhood: string | null;
  city: string;
  created_at: string;
  categories: OneOrMany<{ name: string; slug: string }>;
  object_photos: { storage_path: string; sort_order: number }[] | null;
};

type DetailRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  neighborhood: string | null;
  city: string;
  created_at: string;
  categories: OneOrMany<{ name: string }>;
  destinations: OneOrMany<{ name: string }>;
  profiles: OneOrMany<{
    display_name: string;
    phone: string | null;
    contact_email: boolean;
    contact_phone: boolean;
    contact_inapp: boolean;
  }>;
  object_photos: { storage_path: string; sort_order: number }[] | null;
};

function pickOne<T>(value: OneOrMany<T> | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ---------------------------------------------------------------------------
// Listado público de categorías activas (para el FilterBar)
// ---------------------------------------------------------------------------

export async function listCategories(): Promise<PublicCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[listCategories]", error);
    }
    return [];
  }
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Listado público de objetos publicados, con filtros opcionales
// ---------------------------------------------------------------------------

export type ListPublicObjectsFilters = {
  categorySlug?: string;
  location?: string;
};

export async function listPublicObjects(
  filters: ListPublicObjectsFilters = {},
): Promise<PublicObjectListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("objects")
    .select(
      `
      id,
      title,
      neighborhood,
      city,
      created_at,
      categories:category_id ( name, slug ),
      object_photos ( storage_path, sort_order )
      `,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);

  // Filtro por categoría: traducimos slug → id con una subconsulta extra
  // simple. Se podría hacer con un join filtrado, pero PostgREST no permite
  // filtrar por columna de tabla referenciada cuando es un nested select
  // sin !inner. Mantenemos dos pasos por claridad.
  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .maybeSingle();
    if (cat?.id) {
      query = query.eq("category_id", cat.id);
    } else {
      return [];
    }
  }

  if (filters.location && filters.location.trim() !== "") {
    const term = filters.location.trim();
    // Búsqueda case-insensitive en barrio o ciudad. La columna está indexada
    // en barrio; suficiente para volumen Fase 1.
    query = query.or(
      `neighborhood.ilike.%${escapeIlike(term)}%,city.ilike.%${escapeIlike(term)}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[listPublicObjects]", error);
    }
    return [];
  }

  const rows = (data ?? []) as ListRow[];

  return Promise.all(
    rows.map(async (row) => {
      const photos = (row.object_photos ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);
      const firstPath = photos[0]?.storage_path ?? null;
      const thumbnailUrl = firstPath
        ? await createSignedPhotoUrl(firstPath, 3600)
        : null;

      const category = pickOne(row.categories);

      return {
        id: row.id,
        title: row.title,
        neighborhood: row.neighborhood,
        city: row.city,
        createdAt: row.created_at,
        categoryName: category?.name ?? "—",
        categorySlug: category?.slug ?? "",
        thumbnailUrl,
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// Detalle público de un objeto. Aplica sistema "gancho":
//   - Sin sesión: contact.{email,phone}=null, contact.inapp=false
//   - Con sesión: revela según preferencias del publicador.
// El email se obtiene de auth.users con service_role solo cuando procede.
// ---------------------------------------------------------------------------

export async function getPublicObjectDetail(
  objectId: string,
): Promise<PublicObjectDetail | null> {
  const supabase = await createClient();

  const result = await supabase
    .from("objects")
    .select(
      `
      id,
      owner_id,
      title,
      description,
      neighborhood,
      city,
      created_at,
      categories:category_id ( name ),
      destinations:destination_id ( name ),
      profiles:owner_id ( display_name, phone, contact_email, contact_phone, contact_inapp ),
      object_photos ( storage_path, sort_order )
      `,
    )
    .eq("id", objectId)
    .eq("status", "published")
    .maybeSingle();

  const error = result.error;
  const data = result.data as DetailRow | null;

  if (error || !data) {
    if (process.env.NODE_ENV !== "production" && error) {
      console.error("[getPublicObjectDetail]", error);
    }
    return null;
  }

  const category = pickOne(data.categories);
  const destination = pickOne(data.destinations);
  const owner = pickOne(data.profiles);

  // ¿Hay sesión activa?
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(viewer);

  // Revelación condicional de datos de contacto.
  let email: string | null = null;
  let phone: string | null = null;
  let inapp = false;

  if (isAuthed && owner) {
    if (owner.contact_phone && owner.phone) {
      phone = owner.phone;
    }
    if (owner.contact_inapp) {
      inapp = true;
    }
    if (owner.contact_email) {
      // El email vive en auth.users; el cliente con sesión no puede consultarlo
      // de otro usuario. Usamos service_role acotado a este caso de uso.
      try {
        const admin = createAdminClient();
        const { data: adminData } = await admin.auth.admin.getUserById(
          data.owner_id,
        );
        email = adminData.user?.email ?? null;
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[getPublicObjectDetail] auth.admin", e);
        }
      }
    }
  }

  const photos = (data.object_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
  const photoUrls = (
    await Promise.all(
      photos.map((p) => createSignedPhotoUrl(p.storage_path, 3600)),
    )
  ).filter((url): url is string => Boolean(url));

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    neighborhood: data.neighborhood,
    city: data.city,
    createdAt: data.created_at,
    categoryName: category?.name ?? "—",
    destinationName: destination?.name ?? "—",
    ownerId: data.owner_id,
    ownerDisplayName: owner?.display_name ?? "Vecino/a",
    contact: { email, phone, inapp },
    ownerPrefs: {
      contactEmail: owner?.contact_email ?? false,
      contactPhone: owner?.contact_phone ?? false,
      contactInapp: owner?.contact_inapp ?? false,
    },
    photoUrls,
  };
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

// Escapa los wildcards de ILIKE para que el usuario no pueda inyectar % o _.
function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

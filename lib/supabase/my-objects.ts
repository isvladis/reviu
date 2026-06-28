import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createSignedPhotoUrl } from "@/lib/supabase/storage";

export type MyObjectListItem = {
  id: string;
  title: string;
  status: string;
  rejectionReason: string | null;
  neighborhood: string | null;
  city: string;
  createdAt: string;
  categoryName: string;
  thumbnailUrl: string | null;
};

type OneOrMany<T> = T | T[] | null;

type MyObjectRow = {
  id: string;
  title: string;
  status: string;
  rejection_reason: string | null;
  neighborhood: string | null;
  city: string;
  created_at: string;
  categories: OneOrMany<{ name: string }>;
  object_photos: { storage_path: string; sort_order: number }[] | null;
};

function pickOne<T>(value: OneOrMany<T> | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listMyObjects(): Promise<MyObjectListItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("objects")
    .select(
      `
      id,
      title,
      status,
      rejection_reason,
      neighborhood,
      city,
      created_at,
      categories:category_id ( name ),
      object_photos ( storage_path, sort_order )
      `,
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[listMyObjects]", error);
    }
    return [];
  }

  const rows = (data ?? []) as MyObjectRow[];

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
        status: row.status,
        rejectionReason: row.rejection_reason,
        neighborhood: row.neighborhood,
        city: row.city,
        createdAt: row.created_at,
        categoryName: category?.name ?? "—",
        thumbnailUrl,
      };
    }),
  );
}

export async function countMyObjects(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("objects")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[countMyObjects]", error);
    }
    return 0;
  }

  return count ?? 0;
}

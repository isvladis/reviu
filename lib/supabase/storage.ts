import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const OBJECT_PHOTOS_BUCKET = "object-photos";

/**
 * Sanitiza un nombre de archivo: elimina diacríticos, espacios y caracteres
 * que no sean alfanuméricos, guion, guion bajo o punto. Conserva la extensión.
 * Evita rutas inyectadas (../) y caracteres conflictivos en Storage.
 */
export function sanitizeFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";

  const cleanBase = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const safeBase = cleanBase || "foto";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 5);

  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

export function buildPhotoPath(
  ownerId: string,
  objectId: string,
  filename: string,
  index: number,
): string {
  const safe = sanitizeFilename(filename);
  // Prefijo numérico evita colisiones cuando varias fotos llegan con el mismo nombre.
  return `${ownerId}/${objectId}/${String(index).padStart(2, "0")}-${safe}`;
}

/**
 * Sube una foto al bucket privado usando la sesión del usuario.
 * RLS asegura que solo puede escribir bajo su propia carpeta uid.
 */
export async function uploadObjectPhoto(
  file: File,
  storagePath: string,
): Promise<{ path: string } | { error: string }> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.storage
    .from(OBJECT_PHOTOS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    return { error: error.message };
  }
  return { path: data.path };
}

/**
 * Elimina objetos del bucket. Usa service_role porque las políticas no
 * autorizan delete a usuarios (operación administrativa o limpieza al fallar).
 */
export async function deleteObjectPhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const admin = createAdminClient();
  await admin.storage.from(OBJECT_PHOTOS_BUCKET).remove(paths);
}

/**
 * Genera URLs firmadas con expiración para servir fotos en la app.
 * El bucket es privado, así que no hay URL pública permanente.
 */
export async function createSignedPhotoUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(OBJECT_PHOTOS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

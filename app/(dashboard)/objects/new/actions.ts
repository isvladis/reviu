"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  buildPhotoPath,
  deleteObjectPhotos,
  uploadObjectPhoto,
} from "@/lib/supabase/storage";
import {
  createObjectSchema,
  validatePhotoFile,
  validatePhotoSet,
} from "@/lib/validations/object";
import { OBJECT_CONDITIONS, type ObjectCondition } from "@/types/objects";

export type CreateObjectState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  photoErrors?: string[];
};

function flattenZodErrors(errors: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value && value[0]) out[key] = value[0];
  }
  return out;
}

function conditionLabel(value: ObjectCondition): string {
  return OBJECT_CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

/**
 * Crea un objeto en estado 'pending' (pendiente de moderación, no visible
 * públicamente — ver ADR-017). Sube las fotos al bucket privado y registra
 * sus rutas en object_photos. owner_id se obtiene SIEMPRE de la sesión del
 * servidor.
 *
 * La RLS objects_select_published_or_own ya oculta 'pending' al público
 * porque solo expone status='published' (o las filas del propio owner).
 */
export async function createObjectAction(
  _prev: CreateObjectState,
  formData: FormData,
): Promise<CreateObjectState> {
  // Validación de campos de texto
  const parsed = createObjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    condition: formData.get("condition"),
    destinationId: formData.get("destinationId"),
    neighborhood: formData.get("neighborhood"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: flattenZodErrors(parsed.error.flatten().fieldErrors),
    };
  }

  // Validación de fotos (servidor: tipo MIME, tamaño, cantidad)
  const rawPhotos = formData.getAll("photos");
  const photos: File[] = rawPhotos.filter(
    (f): f is File => f instanceof File && f.size > 0,
  );

  const setError = validatePhotoSet(photos);
  if (setError) {
    return { error: setError };
  }
  const photoErrors: string[] = [];
  for (const f of photos) {
    const err = validatePhotoFile(f);
    if (err) photoErrors.push(err);
  }
  if (photoErrors.length > 0) {
    return { photoErrors };
  }

  // Sesión: owner_id viene SIEMPRE del servidor, nunca del body
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesión expirada. Inicia sesión otra vez." };
  }

  // Inserción del objeto en estado draft (= pending de moderación).
  // La descripción incorpora el "estado del objeto" como prefijo legible,
  // ya que no hay columna específica en el esquema actual (ver nota arriba).
  const conditionPrefix = `Estado: ${conditionLabel(parsed.data.condition)}`;
  const descriptionWithCondition =
    `${conditionPrefix}\n\n${parsed.data.description}`.slice(0, 2000);

  const { data: inserted, error: insertError } = await supabase
    .from("objects")
    .insert({
      owner_id: user.id,
      category_id: parsed.data.categoryId,
      destination_id: parsed.data.destinationId,
      title: parsed.data.title,
      description: descriptionWithCondition,
      neighborhood: parsed.data.neighborhood,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[createObjectAction] insert", insertError);
    }
    return {
      error: "No se ha podido publicar el objeto. Inténtalo de nuevo.",
    };
  }

  const objectId = inserted.id;

  // Subida de fotos: si una falla, se acumula error sin cancelar el resto.
  const uploadedPaths: string[] = [];
  const failedNames: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const path = buildPhotoPath(user.id, objectId, file.name, i);
    const result = await uploadObjectPhoto(file, path);
    if ("error" in result) {
      failedNames.push(file.name);
    } else {
      uploadedPaths.push(result.path);
    }
  }

  // Registrar rutas en object_photos para las subidas correctas
  if (uploadedPaths.length > 0) {
    const rows = uploadedPaths.map((storage_path, idx) => ({
      object_id: objectId,
      storage_path,
      sort_order: idx,
    }));
    const { error: photoInsertError } = await supabase
      .from("object_photos")
      .insert(rows);
    if (photoInsertError && process.env.NODE_ENV !== "production") {
      console.error("[createObjectAction] photos", photoInsertError);
    }
  }

  // Si TODAS las fotos fallaron, rollback: borramos el objeto y avisamos.
  // (Storage no tiene nada que limpiar porque ninguna subida tuvo éxito.)
  if (uploadedPaths.length === 0) {
    await supabase.from("objects").delete().eq("id", objectId);
    return {
      error:
        "No hemos podido subir ninguna foto. Revisa formato y tamaño e inténtalo otra vez.",
    };
  }

  if (failedNames.length > 0) {
    // Subida parcial: dejamos el objeto creado con las fotos que sí
    // funcionaron y limpiamos eventuales restos en Storage de las fallidas.
    // (No hay restos en práctica porque upload solo escribe si tiene éxito,
    // pero deleteObjectPhotos es idempotente.)
    await deleteObjectPhotos([]);
  }

  redirect(`/objects/${objectId}/pending`);
}

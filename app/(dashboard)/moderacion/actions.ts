"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { isModerator } from "@/lib/supabase/moderation";
import {
  approveObjectSchema,
  rejectObjectSchema,
} from "@/lib/validations/moderation";

export type ModerationActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function flattenZodErrors(errors: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value && value[0]) out[key] = value[0];
  }
  return out;
}

// Las operaciones de moderación usan service_role (createAdminClient) porque
// son tareas administrativas (ARQUITECTURA §4.2). La verificación de rol se
// hace ANTES con isModerator() desde la sesión del usuario — el admin client
// solo ejecuta el UPDATE una vez confirmado el permiso.
//
// Las policies RLS de moderación (objects_update_moderator_pending) siguen
// existiendo como documentación de intención y como barrera si en el futuro
// se usa el client con sesión para estas operaciones.

/**
 * Aprueba un objeto pending → status 'published'.
 */
export async function approveObjectAction(
  _prev: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const parsed = approveObjectSchema.safeParse({
    objectId: formData.get("objectId"),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error.flatten().fieldErrors) };
  }

  if (!(await isModerator())) {
    return { error: "No tienes permisos para esta acción." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("objects")
    .update({ status: "published", rejection_reason: null })
    .eq("id", parsed.data.objectId)
    .eq("status", "pending");

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[approveObjectAction]", error);
    }
    return { error: "No se ha podido aprobar el objeto. Inténtalo de nuevo." };
  }

  revalidatePath("/moderacion");
  revalidatePath("/dashboard");
  redirect("/moderacion?msg=aprobado");
}

/**
 * Rechaza un objeto pending → status 'withdrawn' + rejection_reason.
 */
export async function rejectObjectAction(
  _prev: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const parsed = rejectObjectSchema.safeParse({
    objectId: formData.get("objectId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenZodErrors(parsed.error.flatten().fieldErrors) };
  }

  if (!(await isModerator())) {
    return { error: "No tienes permisos para esta acción." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("objects")
    .update({
      status: "withdrawn",
      rejection_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.objectId)
    .eq("status", "pending");

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[rejectObjectAction]", error);
    }
    return { error: "No se ha podido rechazar el objeto. Inténtalo de nuevo." };
  }

  revalidatePath("/moderacion");
  revalidatePath("/dashboard");
  redirect("/moderacion?msg=rechazado");
}

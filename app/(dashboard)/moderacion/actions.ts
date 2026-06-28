"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isModerator } from "@/lib/supabase/moderation";
import { createClient } from "@/lib/supabase/server";
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

/**
 * Aprueba un objeto pending → status 'published'.
 *
 * Cadena de defensa:
 *  1. Comprobación de rol en servidor (this function).
 *  2. RLS objects_update_moderator_pending impone la misma condición en BD.
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

  const supabase = await createClient();
  const { error } = await supabase
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

  const supabase = await createClient();
  const { error } = await supabase
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

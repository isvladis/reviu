"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

function flattenZodErrors(errors: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value && value[0]) out[key] = value[0];
  }
  return out;
}

/**
 * Actualiza el perfil del usuario en sesión. owner_id NUNCA viene del body:
 * siempre se obtiene de auth.getUser() en el servidor. RLS hace de segunda
 * barrera (profiles_update_own).
 */
export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  // formData.has() es la forma fiable de leer checkboxes: el navegador
  // OMITE por completo el campo cuando está desmarcado, así que comparar
  // con "on" o un valor concreto puede dar falsos negativos según el
  // navegador o el orden de los campos. has() detecta presencia directa.
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    contactEmail: formData.has("contactEmail"),
    contactPhone: formData.has("contactPhone"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: flattenZodErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const data = parsed.data;

  // Coherencia: para consentir contacto por teléfono hace falta haber dado uno.
  if (data.contactPhone && !data.phone) {
    return {
      fieldErrors: {
        phone:
          "Para activar el contacto por teléfono primero introduce un número.",
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión expirada. Inicia sesión otra vez." };
  }

  // contact_inapp se mantiene siempre en true: la mensajería interna de Reviu
  // es el canal principal y no es desmarcable. Lo escribimos explícitamente
  // por si algún perfil antiguo lo tuviese a false.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.displayName,
      phone: data.phone,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      contact_inapp: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[updateProfileAction]", error);
    }
    return { error: "No se han podido guardar los cambios. Inténtalo de nuevo." };
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: "Cambios guardados." };
}

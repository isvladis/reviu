"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { startConversationSchema } from "@/lib/validations/message";

/**
 * Inicia (o reabre) la conversación entre el usuario actual (interesado)
 * y el publicador de un objeto. Si ya existe (unique en object_id,
 * requester_id), simplemente redirige a la existente.
 *
 * El owner_id se resuelve en SERVIDOR a partir de objects.owner_id —
 * nunca llega del cliente. La policy de inserción además exige que el
 * publicador tenga contact_inapp = true.
 */
export async function startConversationAction(formData: FormData): Promise<void> {
  const parsed = startConversationSchema.safeParse({
    objectId: formData.get("objectId"),
  });
  if (!parsed.success) {
    redirect("/dashboard?error=mensajes_invalido");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/objetos/${parsed.data.objectId}`);
  }

  // Resolver dueño + verificar publicado + verificar consentimiento inapp.
  const { data: object } = await supabase
    .from("objects")
    .select("id, owner_id, status")
    .eq("id", parsed.data.objectId)
    .maybeSingle();

  if (!object || object.status !== "published") {
    redirect("/objetos");
  }

  if (object.owner_id === user.id) {
    // No tiene sentido conversar contigo mismo.
    redirect(`/objetos/${object.id}`);
  }

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("contact_inapp")
    .eq("id", object.owner_id)
    .maybeSingle();

  if (!ownerProfile?.contact_inapp) {
    redirect(`/objetos/${object.id}`);
  }

  // ¿Ya existe?
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("object_id", object.id)
    .eq("requester_id", user.id)
    .maybeSingle();

  if (existing?.id) {
    redirect(`/mensajes/${existing.id}`);
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      object_id: object.id,
      requester_id: user.id,
      owner_id: object.owner_id,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[startConversationAction]", error);
    }
    redirect(`/objetos/${object.id}?error=conversacion`);
  }

  redirect(`/mensajes/${created.id}`);
}

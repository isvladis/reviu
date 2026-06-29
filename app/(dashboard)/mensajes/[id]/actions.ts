"use server";

import { revalidatePath } from "next/cache";

import { countRecentMessagesFromUser } from "@/lib/supabase/messages";
import { createClient } from "@/lib/supabase/server";
import { sendMessageSchema } from "@/lib/validations/message";

export type SendMessageState = {
  ok?: boolean;
  error?: string;
  submittedAt?: number;
};

const MAX_PER_HOUR = 10;

/**
 * Envía un mensaje a una conversación. El sender_id se toma SIEMPRE de la
 * sesión del servidor; el cliente no puede suplantar a otro usuario. RLS
 * exige además que el usuario sea participante.
 *
 * Rate limit: 10 mensajes por hora por (usuario, conversación). Se cuenta
 * antes de insertar.
 */
export async function sendMessageAction(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.content?.[0] ?? first.conversationId?.[0] ?? "Mensaje no válido.";
    return { error: msg };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Necesitas iniciar sesión." };
  }

  // Rate limiting básico antes de tocar la BD.
  const recent = await countRecentMessagesFromUser(
    parsed.data.conversationId,
    user.id,
  );
  if (recent >= MAX_PER_HOUR) {
    return {
      error: `Has alcanzado el límite de ${MAX_PER_HOUR} mensajes por hora en esta conversación.`,
    };
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[sendMessageAction]", error);
    }
    return { error: "No se ha podido enviar el mensaje. Inténtalo de nuevo." };
  }

  revalidatePath(`/mensajes/${parsed.data.conversationId}`);
  revalidatePath("/mensajes");
  revalidatePath("/dashboard");

  return { ok: true, submittedAt: Date.now() };
}

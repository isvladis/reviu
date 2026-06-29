import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 1000;

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid("Conversación no válida"),
  content: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje")
    .max(MESSAGE_MAX_LENGTH, `El mensaje no puede superar ${MESSAGE_MAX_LENGTH} caracteres`),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// Inicio de conversación desde el detalle del objeto. El owner_id se
// resuelve en servidor a partir de objects.owner_id; NUNCA llega del cliente.
export const startConversationSchema = z.object({
  objectId: z.string().uuid("Objeto no válido"),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;

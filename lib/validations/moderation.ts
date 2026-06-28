import { z } from "zod";

// Motivo de rechazo: obligatorio, breve, sin HTML.
// Límite alineado con el CHECK de objects.rejection_reason (300 chars).
export const REJECTION_REASON_MAX = 300;

export const rejectObjectSchema = z.object({
  objectId: z.string().uuid("Identificador de objeto no válido"),
  reason: z
    .string()
    .trim()
    .min(5, "Explica el motivo en al menos 5 caracteres")
    .max(
      REJECTION_REASON_MAX,
      `El motivo no puede superar ${REJECTION_REASON_MAX} caracteres`,
    ),
});

export type RejectObjectInput = z.infer<typeof rejectObjectSchema>;

export const approveObjectSchema = z.object({
  objectId: z.string().uuid("Identificador de objeto no válido"),
});

export type ApproveObjectInput = z.infer<typeof approveObjectSchema>;

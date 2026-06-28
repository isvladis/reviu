import { z } from "zod";

import { displayNameSchema } from "@/lib/validations/auth";

// phone: opcional, formato libre laxo (números, espacios, +, -, paréntesis).
// Coincide con el CHECK de profiles.phone (5..30 chars).
export const phoneSchema = z
  .string()
  .trim()
  .min(5, "El teléfono debe tener al menos 5 caracteres")
  .max(30, "El teléfono es demasiado largo")
  .regex(
    /^[0-9+()\-.\s]+$/,
    "El teléfono solo puede contener números, espacios y los símbolos + - ( ) .",
  );

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  phone: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      phoneSchema.nullable(),
    )
    .default(null),
  contactEmail: z.coerce.boolean(),
  contactPhone: z.coerce.boolean(),
  contactInapp: z.coerce.boolean(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "El email es obligatorio")
  .email("Email no válido")
  .max(254, "Email demasiado largo");

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña es demasiado larga");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Tu nombre debe tener al menos 2 caracteres")
  .max(50, "Tu nombre es demasiado largo");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const magicLinkSchema = z.object({
  email: emailSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

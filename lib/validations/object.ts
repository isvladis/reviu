import { z } from "zod";

import {
  OBJECT_CONDITIONS,
  PHOTO_ALLOWED_MIME,
  PHOTO_MAX,
  PHOTO_MAX_BYTES,
  PHOTO_MIN,
  type ObjectCondition,
} from "@/types/objects";

const conditionValues = OBJECT_CONDITIONS.map((c) => c.value) as [
  ObjectCondition,
  ...ObjectCondition[],
];

// Paso 1 — Qué es
export const stepWhatSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(80, "El título no puede superar 80 caracteres"),
  description: z
    .string()
    .trim()
    .min(1, "La descripción es obligatoria")
    .max(500, "La descripción no puede superar 500 caracteres"),
  categoryId: z.string().uuid("Selecciona una categoría"),
  condition: z.enum(conditionValues, {
    message: "Selecciona el estado del objeto",
  }),
});

// Paso 2 — Destino
export const stepDestinationSchema = z.object({
  destinationId: z.string().uuid("Selecciona un destino"),
});

// Paso 3 — Ubicación (las fotos se validan aparte, son File[])
export const stepLocationSchema = z.object({
  neighborhood: z
    .string()
    .trim()
    .min(2, "Indica el barrio o ciudad")
    .max(80, "Ubicación demasiado larga"),
});

// Esquema completo de campos de texto (servidor)
export const createObjectSchema = stepWhatSchema
  .extend(stepDestinationSchema.shape)
  .extend(stepLocationSchema.shape);

export type CreateObjectInput = z.infer<typeof createObjectSchema>;
export type StepWhatInput = z.infer<typeof stepWhatSchema>;
export type StepDestinationInput = z.infer<typeof stepDestinationSchema>;
export type StepLocationInput = z.infer<typeof stepLocationSchema>;

// Validación de UNA foto en servidor. Las fotos llegan como File en FormData.
export function validatePhotoFile(file: File): string | null {
  if (!file || file.size === 0) return "Foto vacía";
  if (file.size > PHOTO_MAX_BYTES) {
    return `La foto "${file.name}" supera 5 MB`;
  }
  const mime = file.type as (typeof PHOTO_ALLOWED_MIME)[number];
  if (!PHOTO_ALLOWED_MIME.includes(mime)) {
    return `Formato no soportado en "${file.name}" (usa JPG, PNG o WebP)`;
  }
  return null;
}

export function validatePhotoSet(files: File[]): string | null {
  if (files.length < PHOTO_MIN) return "Sube al menos 1 foto";
  if (files.length > PHOTO_MAX) return `Máximo ${PHOTO_MAX} fotos`;
  return null;
}

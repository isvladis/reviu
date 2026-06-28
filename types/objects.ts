// Tipos de dominio para publicación de objetos (Fase 1).
// Derivados de types/supabase.ts — no duplicar formas a mano.

import type { Database, ObjectStatus } from "@/types/supabase";

export type ObjectRow = Database["public"]["Tables"]["objects"]["Row"];
export type ObjectInsert = Database["public"]["Tables"]["objects"]["Insert"];
export type ObjectPhotoRow =
  Database["public"]["Tables"]["object_photos"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type DestinationRow =
  Database["public"]["Tables"]["destinations"]["Row"];

export type { ObjectStatus };

// Catálogo de "estado del objeto" (condición física), independiente del
// status de moderación. NO se persiste en BD (no hay columna); se concatena
// al inicio de la descripción del objeto. Si en el futuro se quiere persistir
// como columna propia, se añade migración + ADR.
export const OBJECT_CONDITIONS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "como_nuevo", label: "Como nuevo" },
  { value: "buen_estado", label: "Buen estado" },
  { value: "con_detalles", label: "Con detalles" },
] as const;

export type ObjectCondition = (typeof OBJECT_CONDITIONS)[number]["value"];

// Límites de subida de fotos (ARQUITECTURA §3.4 — validación servidor).
export const PHOTO_MIN = 1;
export const PHOTO_MAX = 5;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const PHOTO_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AllowedPhotoMime = (typeof PHOTO_ALLOWED_MIME)[number];

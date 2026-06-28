import "server-only";

import type { AuthError } from "@supabase/supabase-js";

const GENERIC = "No hemos podido completar la operación. Inténtalo de nuevo.";

const MESSAGE_MAP: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed:
    "Tu email aún no está confirmado. Revisa tu correo y haz clic en el enlace.",
  user_already_exists: "Este email ya está registrado. Inicia sesión.",
  weak_password: "La contraseña no cumple los requisitos mínimos.",
  over_email_send_rate_limit:
    "Demasiados intentos en poco tiempo. Espera un momento e inténtalo de nuevo.",
  over_request_rate_limit:
    "Demasiados intentos en poco tiempo. Espera un momento e inténtalo de nuevo.",
  signup_disabled: "El registro no está disponible ahora mismo.",
  validation_failed: "Revisa los campos del formulario.",
};

export function translateAuthError(error: AuthError): string {
  const code = error.code ?? "";
  if (code && MESSAGE_MAP[code]) return MESSAGE_MAP[code];

  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("invalid login credentials"))
    return "Email o contraseña incorrectos.";
  if (msg.includes("email not confirmed"))
    return "Tu email aún no está confirmado. Revisa tu correo.";
  if (msg.includes("already registered") || msg.includes("already exists"))
    return "Este email ya está registrado. Inicia sesión.";
  if (msg.includes("rate limit"))
    return "Demasiados intentos en poco tiempo. Espera un momento.";

  return GENERIC;
}

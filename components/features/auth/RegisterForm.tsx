"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { registerAction, type AuthActionState } from "@/app/(auth)/actions";

const INITIAL: AuthActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-6 py-3 rounded-lg text-base font-medium text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ backgroundColor: "var(--color-accent)" }}
    >
      {pending ? "Creando cuenta…" : "Crear cuenta"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, INITIAL);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label
          htmlFor="register-name"
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Tu nombre de pila
        </label>
        <input
          id="register-name"
          type="text"
          name="displayName"
          required
          minLength={2}
          maxLength={50}
          autoComplete="given-name"
          aria-invalid={Boolean(fieldErrors.displayName) || undefined}
          aria-describedby={
            fieldErrors.displayName ? "register-name-error" : undefined
          }
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "white",
            color: "var(--color-text)",
          }}
        />
        {fieldErrors.displayName && (
          <p
            id="register-name-error"
            className="text-sm"
            style={{ color: "#B91C1C" }}
          >
            {fieldErrors.displayName}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="register-email"
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Email
        </label>
        <input
          id="register-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email) || undefined}
          aria-describedby={
            fieldErrors.email ? "register-email-error" : undefined
          }
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "white",
            color: "var(--color-text)",
          }}
        />
        {fieldErrors.email && (
          <p
            id="register-email-error"
            className="text-sm"
            style={{ color: "#B91C1C" }}
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="register-password"
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Contraseña
        </label>
        <input
          id="register-password"
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password) || undefined}
          aria-describedby={
            fieldErrors.password
              ? "register-password-error"
              : "register-password-hint"
          }
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "white",
            color: "var(--color-text)",
          }}
        />
        {fieldErrors.password ? (
          <p
            id="register-password-error"
            className="text-sm"
            style={{ color: "#B91C1C" }}
          >
            {fieldErrors.password}
          </p>
        ) : (
          <p
            id="register-password-hint"
            className="text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            Mínimo 8 caracteres.
          </p>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          className="text-sm px-3 py-2 rounded-md"
          style={{ color: "#B91C1C", backgroundColor: "#FEE2E2" }}
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="text-sm px-3 py-2 rounded-md"
          style={{
            color: "var(--color-accent)",
            backgroundColor: "var(--color-bg-alt)",
          }}
        >
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

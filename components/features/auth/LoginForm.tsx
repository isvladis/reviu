"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type AuthActionState } from "@/app/(auth)/actions";

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
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email) || undefined}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "white",
            color: "var(--color-text)",
          }}
        />
        {fieldErrors.email && (
          <p
            id="login-email-error"
            className="text-sm"
            style={{ color: "#B91C1C" }}
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Contraseña
        </label>
        <input
          id="login-password"
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.password) || undefined}
          aria-describedby={
            fieldErrors.password ? "login-password-error" : undefined
          }
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "white",
            color: "var(--color-text)",
          }}
        />
        {fieldErrors.password && (
          <p
            id="login-password-error"
            className="text-sm"
            style={{ color: "#B91C1C" }}
          >
            {fieldErrors.password}
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

      <SubmitButton />
    </form>
  );
}

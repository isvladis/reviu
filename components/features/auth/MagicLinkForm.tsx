"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { magicLinkAction, type AuthActionState } from "@/app/(auth)/actions";

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
      {pending ? "Enviando…" : "Envíame el enlace"}
    </button>
  );
}

export function MagicLinkForm() {
  const [state, formAction] = useActionState(magicLinkAction, INITIAL);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label
          htmlFor="magic-email"
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          Email
        </label>
        <input
          id="magic-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email) || undefined}
          aria-describedby={fieldErrors.email ? "magic-email-error" : undefined}
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "white",
            color: "var(--color-text)",
          }}
        />
        {fieldErrors.email && (
          <p
            id="magic-email-error"
            className="text-sm"
            style={{ color: "#B91C1C" }}
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

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

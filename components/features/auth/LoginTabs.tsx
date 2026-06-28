"use client";

import { useState } from "react";

import { LoginForm } from "./LoginForm";
import { MagicLinkForm } from "./MagicLinkForm";

type Mode = "password" | "magic";

export function LoginTabs() {
  const [mode, setMode] = useState<Mode>("password");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Método de inicio de sesión"
        className="grid grid-cols-2 rounded-lg overflow-hidden border"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => setMode("password")}
          className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
          style={{
            backgroundColor:
              mode === "password" ? "var(--color-accent)" : "transparent",
            color: mode === "password" ? "white" : "var(--color-text)",
          }}
        >
          Contraseña
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "magic"}
          onClick={() => setMode("magic")}
          className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
          style={{
            backgroundColor:
              mode === "magic" ? "var(--color-accent)" : "transparent",
            color: mode === "magic" ? "white" : "var(--color-text)",
          }}
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? <LoginForm /> : <MagicLinkForm />}
    </div>
  );
}

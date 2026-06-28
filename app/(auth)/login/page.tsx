import Link from "next/link";
import type { Metadata } from "next";

import { LoginTabs } from "@/components/features/auth/LoginTabs";

export const metadata: Metadata = {
  title: "Entrar — Reviu",
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
        <p className="text-base" style={{ color: "var(--color-muted)" }}>
          Bienvenido/a de vuelta.
        </p>
      </div>

      <LoginTabs />

      <p className="text-sm" style={{ color: "var(--color-muted)" }}>
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-medium underline"
          style={{ color: "var(--color-accent)" }}
        >
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}

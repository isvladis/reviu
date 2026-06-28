import Link from "next/link";
import type { Metadata } from "next";

import { RegisterForm } from "@/components/features/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta — Reviu",
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Crear cuenta</h1>
        <p className="text-base" style={{ color: "var(--color-muted)" }}>
          Únete al movimiento.
        </p>
      </div>

      <RegisterForm />

      <p className="text-sm" style={{ color: "var(--color-muted)" }}>
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium underline"
          style={{ color: "var(--color-accent)" }}
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

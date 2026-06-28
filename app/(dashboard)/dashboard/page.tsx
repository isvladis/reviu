import type { Metadata } from "next";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inicio — Reviu",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle();

  const name = profile?.display_name ?? "Vecino/a";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Hola, {name}
      </h1>
      <p className="text-lg" style={{ color: "var(--color-muted)" }}>
        Esta es la primera versión de tu espacio en Reviu. Pronto podrás
        contactar con vecinos y ver tu impacto.
      </p>

      <div
        className="rounded-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ backgroundColor: "var(--color-bg-alt)" }}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">¿Tienes un objeto que dar?</h2>
          <p style={{ color: "var(--color-muted)" }}>
            Publícalo y elige su destino: segunda vida, reciclaje, reacondicionamiento o donación.
          </p>
        </div>
        <Link
          href="/objects/new"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium text-white transition-colors whitespace-nowrap"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Publicar un objeto
        </Link>
      </div>
    </div>
  );
}

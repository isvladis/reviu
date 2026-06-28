import type { Metadata } from "next";

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
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Hola, {name}
      </h1>
      <p className="text-lg" style={{ color: "var(--color-muted)" }}>
        Esta es la primera versión de tu espacio en Reviu. Pronto podrás
        publicar objetos, contactar con vecinos y ver tu impacto.
      </p>
    </div>
  );
}

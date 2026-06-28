import type { Metadata } from "next";
import Link from "next/link";

import { ObjectForm } from "@/components/features/objects/ObjectForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Publicar objeto — Reviu",
};

export default async function NewObjectPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: destinations }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("destinations")
      .select("id, name, description, slug")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="text-sm font-medium"
          style={{ color: "var(--color-accent)" }}
        >
          ← Volver al inicio
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Publicar un objeto
        </h1>
        <p style={{ color: "var(--color-muted)" }}>
          Cuéntanos qué objeto quieres dar una nueva vida. Pasará por una
          revisión antes de aparecer en la comunidad.
        </p>
      </div>

      <ObjectForm
        categories={categories ?? []}
        destinations={destinations ?? []}
      />
    </div>
  );
}

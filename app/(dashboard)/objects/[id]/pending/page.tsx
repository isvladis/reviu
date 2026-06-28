import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Objeto en revisión — Reviu",
};

export default async function ObjectPendingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS limita el acceso al dueño (status 'draft' no es público).
  const { data: object } = await supabase
    .from("objects")
    .select("id, title")
    .eq("id", id)
    .maybeSingle();

  if (!object) notFound();

  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full text-3xl"
        style={{
          backgroundColor: "var(--color-bg-alt)",
          color: "var(--color-accent)",
        }}
        aria-hidden
      >
        ✓
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Tu objeto está en revisión
      </h1>

      <p className="text-lg" style={{ color: "var(--color-muted)" }}>
        Te avisamos cuando <strong style={{ color: "var(--color-text)" }}>{object.title}</strong>{" "}
        esté visible en la comunidad. Mientras tanto solo lo ves tú.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/objects/new"
          className="px-6 py-3 rounded-lg text-base font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Publicar otro objeto
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-lg text-base font-medium border-2 transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

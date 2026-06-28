import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ObjectReviewCard } from "@/components/features/moderation/ObjectReviewCard";
import {
  isModerator,
  listPendingObjects,
} from "@/lib/supabase/moderation";

export const metadata: Metadata = {
  title: "Panel de moderación — Reviu",
};

const MESSAGES: Record<string, string> = {
  aprobado: "Objeto aprobado y publicado",
  rechazado: "Objeto rechazado",
};

export default async function ModerationListPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  // Defensa en servidor además del middleware (RLS es la 3ª capa).
  if (!(await isModerator())) {
    redirect("/dashboard?error=no_autorizado");
  }

  const { msg } = await searchParams;
  const flashMessage = msg && MESSAGES[msg] ? MESSAGES[msg] : null;

  const items = await listPendingObjects();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Panel de moderación
        </h1>
        <p style={{ color: "var(--color-muted)" }}>
          {items.length === 0
            ? "No hay objetos pendientes de revisión."
            : items.length === 1
            ? "1 objeto pendiente de revisión."
            : `${items.length} objetos pendientes de revisión.`}
        </p>
      </div>

      {flashMessage ? (
        <div
          className="rounded-lg p-4 text-sm font-medium"
          style={{
            backgroundColor: "var(--color-bg-alt)",
            color: "var(--color-accent)",
          }}
          role="status"
        >
          {flashMessage}
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <ObjectReviewCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

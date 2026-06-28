import type { Metadata } from "next";

import { FilterBar } from "@/components/features/objects/FilterBar";
import { ObjectCard } from "@/components/features/objects/ObjectCard";
import {
  listCategories,
  listPublicObjects,
} from "@/lib/supabase/objects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ver objetos — Reviu",
  description:
    "Descubre objetos que vecinos cerca de ti están dando una segunda vida.",
};

export const dynamic = "force-dynamic";

export default async function PublicObjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;

  const [items, categories, session] = await Promise.all([
    listPublicObjects({ categorySlug: cat, location: q }),
    listCategories(),
    (async () => {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return Boolean(user);
    })(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Objetos en busca de una segunda vida
        </h1>
        <p style={{ color: "var(--color-muted)" }}>
          {items.length === 0
            ? "Aún no hay objetos publicados que coincidan."
            : items.length === 1
              ? "1 objeto publicado."
              : `${items.length} objetos publicados.`}
        </p>
      </div>

      <FilterBar categories={categories} />

      {!session ? (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            backgroundColor: "var(--color-bg-alt)",
            color: "var(--color-text)",
          }}
          role="note"
        >
          Estás navegando sin sesión: puedes ver los objetos pero los datos de
          contacto y el destino están reservados a personas con cuenta.
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <li key={item.id}>
              <ObjectCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="rounded-xl border-2 p-10 text-center"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p style={{ color: "var(--color-muted)" }}>
            Prueba a quitar los filtros o cambiar la ubicación.
          </p>
        </div>
      )}
    </div>
  );
}

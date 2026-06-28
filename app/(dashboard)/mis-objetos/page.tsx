import type { Metadata } from "next";
import Link from "next/link";

import { MyObjectCard } from "@/components/features/objects/MyObjectCard";
import { listMyObjects } from "@/lib/supabase/my-objects";

export const metadata: Metadata = {
  title: "Mis objetos — Reviu",
};

export default async function MisObjetosPage() {
  const items = await listMyObjects();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <p
          className="text-lg font-medium"
          style={{ color: "var(--color-muted)" }}
        >
          Todavía no has publicado ningún objeto
        </p>
        <Link
          href="/objects/new"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Publicar tu primer objeto
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Mis objetos
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MyObjectCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

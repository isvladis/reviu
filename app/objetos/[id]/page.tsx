import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ObjectDetail } from "@/components/features/objects/ObjectDetail";
import { getPublicObjectDetail } from "@/lib/supabase/objects";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const object = await getPublicObjectDetail(id);
  if (!object) return { title: "Objeto no encontrado — Reviu" };
  return {
    title: `${object.title} — Reviu`,
    description:
      object.description?.slice(0, 160) ??
      "Un objeto publicado en Reviu para una segunda vida.",
  };
}

export default async function PublicObjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validación mínima de UUID antes de pegar a BD.
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) notFound();

  const object = await getPublicObjectDetail(id);
  if (!object) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <ObjectDetail object={object} isAuthenticated={Boolean(user)} />;
}

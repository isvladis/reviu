import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApproveForm } from "@/components/features/moderation/ApproveForm";
import { RejectForm } from "@/components/features/moderation/RejectForm";
import {
  getPendingObjectDetail,
  isModerator,
} from "@/lib/supabase/moderation";

export const metadata: Metadata = {
  title: "Revisar objeto — Reviu",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ModerationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isModerator())) {
    redirect("/dashboard?error=no_autorizado");
  }

  const { id } = await params;
  const object = await getPendingObjectDetail(id);
  if (!object) notFound();

  const giverLocation = [object.giverNeighborhood, object.giverCity]
    .filter(Boolean)
    .join(", ");
  const objectLocation = [object.neighborhood, object.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/moderacion"
          className="text-sm font-medium"
          style={{ color: "var(--color-accent)" }}
        >
          ← Volver al panel
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {object.title}
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Enviado {formatDateTime(object.createdAt)}
        </p>
      </div>

      {object.photoUrls.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {object.photoUrls.map((url, idx) => (
            <div
              key={url}
              className="relative w-full aspect-[4/3] rounded-lg overflow-hidden"
              style={{ backgroundColor: "var(--color-bg-alt)" }}
            >
              <Image
                src={url}
                alt={`Foto ${idx + 1} de ${object.title}`}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-lg p-4 text-sm"
          style={{
            backgroundColor: "var(--color-bg-alt)",
            color: "var(--color-muted)",
          }}
        >
          Este objeto no tiene fotos visibles.
        </div>
      )}

      <dl
        className="rounded-xl p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"
        style={{ backgroundColor: "var(--color-bg-alt)" }}
      >
        <div>
          <dt
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--color-muted)" }}
          >
            Categoría
          </dt>
          <dd className="text-base font-medium">{object.categoryName}</dd>
        </div>
        <div>
          <dt
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--color-muted)" }}
          >
            Destino
          </dt>
          <dd className="text-base font-medium">{object.destinationName}</dd>
        </div>
        <div>
          <dt
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--color-muted)" }}
          >
            Ubicación del objeto
          </dt>
          <dd className="text-base font-medium">{objectLocation || "—"}</dd>
        </div>
        <div>
          <dt
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--color-muted)" }}
          >
            Cedente
          </dt>
          <dd className="text-base font-medium">
            {object.giverName}
            {giverLocation ? (
              <span
                className="block text-sm font-normal"
                style={{ color: "var(--color-muted)" }}
              >
                {giverLocation}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {object.description ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Descripción</h2>
          <p
            className="whitespace-pre-line"
            style={{ color: "var(--color-text)" }}
          >
            {object.description}
          </p>
        </section>
      ) : null}

      <section
        className="rounded-xl border-2 p-5 md:p-6 space-y-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-semibold">Decisión de moderación</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <ApproveForm objectId={object.id} />
          <RejectForm objectId={object.id} />
        </div>
      </section>
    </div>
  );
}

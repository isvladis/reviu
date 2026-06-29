import Image from "next/image";
import Link from "next/link";

import { startConversationAction } from "@/app/(dashboard)/mensajes/actions";
import type { PublicObjectDetail } from "@/lib/supabase/objects";
import { formatRelativeDate } from "@/utils/dates";

type Props = {
  object: PublicObjectDetail;
  isAuthenticated: boolean;
};

export function ObjectDetail({ object, isAuthenticated }: Props) {
  const location = [object.neighborhood, object.city]
    .filter(Boolean)
    .join(", ");

  const hasAnyConsent =
    object.ownerPrefs.contactEmail ||
    object.ownerPrefs.contactPhone ||
    object.ownerPrefs.contactInapp;

  return (
    <article className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/objetos"
          className="text-sm font-medium"
          style={{ color: "var(--color-accent)" }}
        >
          ← Volver al listado
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {object.title}
        </h1>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Publicado {formatRelativeDate(object.createdAt)} ·{" "}
          {object.categoryName}
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
      ) : null}

      <dl
        className="rounded-xl p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"
        style={{ backgroundColor: "var(--color-bg-alt)" }}
      >
        <Cell label="Categoría" value={object.categoryName} />
        <Cell label="Barrio" value={location || "—"} />
        <Cell label="Cede" value={object.ownerDisplayName} />
        {isAuthenticated ? (
          <Cell label="Destino" value={object.destinationName} />
        ) : (
          <LockedCell label="Destino" />
        )}
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
        className="rounded-xl border-2 p-5 md:p-6 space-y-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h2 className="text-lg font-semibold">Contacto</h2>

        {!isAuthenticated ? (
          <GatedContact ownerName={object.ownerDisplayName} />
        ) : !hasAnyConsent ? (
          <p style={{ color: "var(--color-muted)" }}>
            <strong>{object.ownerDisplayName}</strong> prefiere no recibir
            contacto directo a través de Reviu.
          </p>
        ) : (
          <RevealedContact object={object} />
        )}
      </section>
    </article>
  );
}

// ---------------------------------------------------------------------------

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        className="text-xs uppercase tracking-wide"
        style={{ color: "var(--color-muted)" }}
      >
        {label}
      </dt>
      <dd className="text-base font-medium">{value}</dd>
    </div>
  );
}

function LockedCell({ label }: { label: string }) {
  return (
    <div>
      <dt
        className="text-xs uppercase tracking-wide"
        style={{ color: "var(--color-muted)" }}
      >
        {label}
      </dt>
      <dd
        className="text-base font-medium select-none blur-[3px]"
        aria-hidden="true"
      >
        ●●●●●●
      </dd>
    </div>
  );
}

function GatedContact({ ownerName }: { ownerName: string }) {
  return (
    <div className="space-y-3">
      <p style={{ color: "var(--color-text)" }}>
        Regístrate para ver el destino y contactar con{" "}
        <strong>{ownerName}</strong>.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href="/register"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors"
          style={{
            borderColor: "var(--color-accent)",
            color: "var(--color-accent)",
          }}
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}

function RevealedContact({ object }: { object: PublicObjectDetail }) {
  const { contact, ownerPrefs } = object;
  return (
    <div className="space-y-2 text-sm">
      {contact.email ? (
        <div>
          <span style={{ color: "var(--color-muted)" }}>Email: </span>
          <a
            href={`mailto:${contact.email}`}
            className="font-medium underline"
            style={{ color: "var(--color-accent)" }}
          >
            {contact.email}
          </a>
        </div>
      ) : ownerPrefs.contactEmail ? (
        <p style={{ color: "var(--color-muted)" }}>
          No se ha podido recuperar el email.
        </p>
      ) : null}

      {contact.phone ? (
        <div>
          <span style={{ color: "var(--color-muted)" }}>Teléfono: </span>
          <a
            href={`tel:${contact.phone.replace(/\s+/g, "")}`}
            className="font-medium underline"
            style={{ color: "var(--color-accent)" }}
          >
            {contact.phone}
          </a>
        </div>
      ) : null}

      {contact.inapp ? (
        <form action={startConversationAction} className="mt-2">
          <input type="hidden" name="objectId" value={object.id} />
          <button
            type="submit"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Enviar mensaje a {object.ownerDisplayName}
          </button>
        </form>
      ) : null}
    </div>
  );
}

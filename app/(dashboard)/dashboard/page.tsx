import type { Metadata } from "next";
import Link from "next/link";

import { countUnreadMessages } from "@/lib/supabase/messages";
import { countPendingObjects } from "@/lib/supabase/moderation";
import { countMyObjects } from "@/lib/supabase/my-objects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Inicio — Reviu",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user!.id)
    .maybeSingle();

  const name = profile?.display_name ?? "Vecino/a";
  const isMod = profile?.role === "moderator" || profile?.role === "admin";
  const [pendingCount, myObjectsCount, unreadCount] = await Promise.all([
    isMod ? countPendingObjects() : Promise.resolve(0),
    countMyObjects(),
    countUnreadMessages(),
  ]);

  const { error } = await searchParams;
  const showUnauthorized = error === "no_autorizado";

  return (
    <div className="space-y-8">
      {showUnauthorized ? (
        <div
          className="rounded-lg p-4 text-sm font-medium"
          style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}
          role="alert"
        >
          No tienes permisos para acceder a esa sección.
        </div>
      ) : null}

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

      <Link
        href="/perfil"
        className="rounded-xl border-2 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors hover:bg-[var(--color-bg-alt)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Mi perfil</h2>
          <p style={{ color: "var(--color-muted)" }}>
            Edita tu nombre, teléfono y preferencias de contacto.
          </p>
        </div>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-accent)" }}
        >
          Editar →
        </span>
      </Link>

      <Link
        href="/mensajes"
        className="rounded-xl border-2 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors hover:bg-[var(--color-bg-alt)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Mensajes</h2>
          <p style={{ color: "var(--color-muted)" }}>
            Conversaciones con otras personas sobre objetos.
          </p>
        </div>
        {unreadCount > 0 ? (
          <span
            className="inline-flex items-center justify-center min-w-9 h-9 px-3 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-accent)" }}
            aria-label={`${unreadCount} mensajes sin leer`}
          >
            {unreadCount}
          </span>
        ) : (
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            Abrir →
          </span>
        )}
      </Link>

      <Link
        href="/mis-objetos"
        className="rounded-xl border-2 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors hover:bg-[var(--color-bg-alt)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Mis objetos</h2>
          <p style={{ color: "var(--color-muted)" }}>
            Consulta el estado de todos tus objetos publicados.
          </p>
        </div>
        <span
          className="inline-flex items-center justify-center min-w-9 h-9 px-3 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--color-accent)" }}
          aria-label={`${myObjectsCount} objetos`}
        >
          {myObjectsCount}
        </span>
      </Link>

      {isMod ? (
        <Link
          href="/moderacion"
          className="rounded-xl border-2 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors hover:bg-[var(--color-bg-alt)]"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Panel de moderación</h2>
            <p style={{ color: "var(--color-muted)" }}>
              Revisa los objetos pendientes de aprobación.
            </p>
          </div>
          <span
            className="inline-flex items-center justify-center min-w-9 h-9 px-3 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-accent)" }}
            aria-label={`${pendingCount} pendientes`}
          >
            {pendingCount}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

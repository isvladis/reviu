import type { Metadata } from "next";
import Link from "next/link";

import { ConversationList } from "@/components/features/messages/ConversationList";
import { listMyConversations } from "@/lib/supabase/messages";

export const metadata: Metadata = {
  title: "Mensajes — Reviu",
};

export const dynamic = "force-dynamic";

export default async function MensajesPage() {
  const items = await listMyConversations();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Mensajes
      </h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <p
            className="text-lg font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            Todavía no tienes conversaciones.
          </p>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Cuando contactes con alguien o te contacten por uno de tus
            objetos, aparecerá aquí.
          </p>
          <Link
            href="/objetos"
            className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Ver objetos
          </Link>
        </div>
      ) : (
        <ConversationList items={items} />
      )}
    </div>
  );
}

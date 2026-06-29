import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MessageForm } from "@/components/features/messages/MessageForm";
import { MessageThread } from "@/components/features/messages/MessageThread";
import {
  getConversationDetail,
  markConversationRead,
} from "@/lib/supabase/messages";

import { sendMessageAction } from "./actions";

export const metadata: Metadata = {
  title: "Conversación — Reviu",
};

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) notFound();

  const conversation = await getConversationDetail(id);
  if (!conversation) notFound();

  // Marcar como leídos los mensajes recibidos al abrir el hilo. No bloquea
  // el render; si falla, simplemente quedará el badge hasta la próxima.
  await markConversationRead(id);

  return (
    <div className="space-y-6">
      <Link
        href="/mensajes"
        className="text-sm font-medium"
        style={{ color: "var(--color-accent)" }}
      >
        ← Volver a mensajes
      </Link>

      <header
        className="rounded-xl border-2 p-4 flex items-center gap-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0"
          style={{ backgroundColor: "var(--color-bg-alt)" }}
        >
          {conversation.objectThumbnailUrl ? (
            <Image
              src={conversation.objectThumbnailUrl}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center text-xs"
              style={{ color: "var(--color-muted)" }}
            >
              —
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/objetos/${conversation.objectId}`}
            className="font-semibold truncate hover:underline"
            style={{ color: "var(--color-text)" }}
          >
            {conversation.objectTitle}
          </Link>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Con {conversation.otherDisplayName}
          </p>
        </div>
      </header>

      <MessageThread messages={conversation.messages} />

      <MessageForm conversationId={conversation.id} action={sendMessageAction} />
    </div>
  );
}

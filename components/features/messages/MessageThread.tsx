"use client";

import { useEffect, useRef } from "react";

import type { ConversationMessage } from "@/lib/supabase/messages";

type Props = {
  messages: ConversationMessage[];
};

export function MessageThread({ messages }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        className="rounded-xl border-2 p-8 text-center"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-muted)",
        }}
      >
        Todavía no hay mensajes. Escribe el primero abajo.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.map((m) => (
        <Bubble key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}

function Bubble({ message }: { message: ConversationMessage }) {
  const isMine = message.isMine;
  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[80%] rounded-2xl px-4 py-2.5"
        style={{
          backgroundColor: isMine
            ? "var(--color-accent)"
            : "var(--color-bg-alt)",
          color: isMine ? "#FFFFFF" : "var(--color-text)",
        }}
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>
        <p
          className="text-[10px] mt-1"
          style={{ color: isMine ? "rgba(255,255,255,0.8)" : "var(--color-muted)" }}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

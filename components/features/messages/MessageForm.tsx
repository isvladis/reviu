"use client";

import { useActionState, useEffect, useRef } from "react";

import { MESSAGE_MAX_LENGTH } from "@/lib/validations/message";

import type { SendMessageState } from "@/app/(dashboard)/mensajes/[id]/actions";

type Props = {
  conversationId: string;
  action: (prev: SendMessageState, formData: FormData) => Promise<SendMessageState>;
};

const initialState: SendMessageState = {};

export function MessageForm({ conversationId, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cuando el envío sale bien (state.ok), limpiamos el textarea. El servidor
  // ya hizo revalidatePath, así que la página muestra el mensaje nuevo.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state.ok, state.submittedAt]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2"
    >
      <input type="hidden" name="conversationId" value={conversationId} />

      <textarea
        ref={textareaRef}
        name="content"
        placeholder="Escribe un mensaje…"
        maxLength={MESSAGE_MAX_LENGTH}
        rows={3}
        required
        className="w-full px-4 py-3 rounded-lg border-2 text-base resize-y focus:outline-none focus:ring-2"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
        }}
        onInput={(e) => {
          const counter = document.getElementById("msg-counter");
          if (counter) {
            counter.textContent = `${e.currentTarget.value.length}/${MESSAGE_MAX_LENGTH}`;
          }
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <span
          id="msg-counter"
          className="text-xs"
          style={{ color: "var(--color-muted)" }}
          aria-live="polite"
        >
          0/{MESSAGE_MAX_LENGTH}
        </span>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          {isPending ? "Enviando…" : "Enviar"}
        </button>
      </div>

      {state.error ? (
        <p
          className="text-sm rounded-lg px-3 py-2"
          style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

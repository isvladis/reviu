"use client";

import { useActionState, useState } from "react";

import {
  rejectObjectAction,
  type ModerationActionState,
} from "@/app/(dashboard)/moderacion/actions";
import { REJECTION_REASON_MAX } from "@/lib/validations/moderation";

type Props = {
  objectId: string;
};

const INITIAL: ModerationActionState = {};

export function RejectForm({ objectId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState(
    rejectObjectAction,
    INITIAL,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto px-6 py-3 rounded-lg text-base font-medium border-2 transition-colors"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
      >
        Rechazar
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 w-full">
      <input type="hidden" name="objectId" value={objectId} />

      <label
        htmlFor="reject-reason"
        className="block text-sm font-medium"
        style={{ color: "var(--color-text)" }}
      >
        Motivo del rechazo
      </label>
      <textarea
        id="reject-reason"
        name="reason"
        required
        maxLength={REJECTION_REASON_MAX}
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explica brevemente por qué se rechaza este objeto."
        className="w-full rounded-lg border-2 p-3 text-base"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg)",
          color: "var(--color-text)",
        }}
      />
      <div
        className="flex justify-between text-xs"
        style={{ color: "var(--color-muted)" }}
      >
        <span>{reason.length} / {REJECTION_REASON_MAX}</span>
        {state.fieldErrors?.reason ? (
          <span style={{ color: "#B91C1C" }}>{state.fieldErrors.reason}</span>
        ) : null}
      </div>

      {state.error ? (
        <p className="text-sm" style={{ color: "#B91C1C" }}>
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-3 rounded-lg text-base font-medium text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: "#B91C1C" }}
        >
          {pending ? "Rechazando…" : "Confirmar rechazo"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setReason("");
          }}
          disabled={pending}
          className="px-6 py-3 rounded-lg text-base font-medium border-2 transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

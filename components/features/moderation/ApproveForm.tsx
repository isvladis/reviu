"use client";

import { useActionState } from "react";

import {
  approveObjectAction,
  type ModerationActionState,
} from "@/app/(dashboard)/moderacion/actions";

type Props = {
  objectId: string;
};

const INITIAL: ModerationActionState = {};

export function ApproveForm({ objectId }: Props) {
  const [state, formAction, pending] = useActionState(
    approveObjectAction,
    INITIAL,
  );

  return (
    <form action={formAction} className="w-full sm:w-auto">
      <input type="hidden" name="objectId" value={objectId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto px-6 py-3 rounded-lg text-base font-medium text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: "var(--color-accent)" }}
      >
        {pending ? "Aprobando…" : "Aprobar y publicar"}
      </button>
      {state.error ? (
        <p className="text-sm mt-2" style={{ color: "#B91C1C" }}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

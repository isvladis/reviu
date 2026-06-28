"use client";

import { useActionState, useState } from "react";

import {
  updateProfileAction,
  type ProfileActionState,
} from "@/app/(dashboard)/perfil/actions";

type Props = {
  initial: {
    displayName: string;
    email: string;
    phone: string | null;
    contactEmail: boolean;
    contactPhone: boolean;
    contactInapp: boolean;
  };
};

const INITIAL: ProfileActionState = {};

export function ContactPreferences({ initial }: Props) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    INITIAL,
  );

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone);
  const [contactInapp, setContactInapp] = useState(initial.contactInapp);

  return (
    <form action={formAction} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Datos básicos</h2>

        <div className="space-y-2">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Nombre de pila
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border-2 p-3 text-base"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
          {state.fieldErrors?.displayName ? (
            <p className="text-sm" style={{ color: "#B91C1C" }}>
              {state.fieldErrors.displayName}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={initial.email}
            disabled
            className="w-full rounded-lg border-2 p-3 text-base opacity-70"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg-alt)",
              color: "var(--color-muted)",
            }}
          />
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            El email se gestiona desde tu cuenta y no se puede editar aquí.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="block text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Teléfono <span style={{ color: "var(--color-muted)" }}>(opcional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={30}
            placeholder="+34 600 00 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border-2 p-3 text-base"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            Tu teléfono nunca aparecerá públicamente y solo se mostrará a
            usuarios registrados si así lo activas más abajo.
          </p>
          {state.fieldErrors?.phone ? (
            <p className="text-sm" style={{ color: "#B91C1C" }}>
              {state.fieldErrors.phone}
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Preferencias de contacto</h2>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          Decides tú qué se enseña a otros vecinos. Los visitantes anónimos
          nunca ven ningún dato de contacto, solo el objeto.
        </p>

        <ToggleRow
          name="contactEmail"
          label="Mostrar mi email a otros usuarios registrados"
          description="Tu email será visible para personas con cuenta cuando vean el detalle de tu objeto."
          checked={contactEmail}
          onChange={setContactEmail}
        />

        <ToggleRow
          name="contactPhone"
          label="Mostrar mi teléfono a otros usuarios registrados"
          description="Necesitas haber introducido un teléfono arriba para activar esta opción."
          checked={contactPhone}
          onChange={setContactPhone}
        />

        <ToggleRow
          name="contactInapp"
          label="Permitir que me envíen mensajes por Reviu"
          description="Próximamente: mensajería interna. De momento es un marcador de preferencia."
          checked={contactInapp}
          onChange={setContactInapp}
        />
      </section>

      {state.error ? (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div
          className="rounded-lg p-3 text-sm font-medium"
          style={{
            backgroundColor: "var(--color-bg-alt)",
            color: "var(--color-accent)",
          }}
          role="status"
        >
          {state.success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="px-6 py-3 rounded-lg text-base font-medium text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: "var(--color-accent)" }}
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

type ToggleProps = {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({ name, label, description, checked, onChange }: ToggleProps) {
  const id = `toggle-${name}`;
  return (
    <div
      className="rounded-xl border-2 p-4 flex items-start gap-3"
      style={{ borderColor: "var(--color-border)" }}
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 accent-[var(--color-accent)] cursor-pointer"
      />
      <label htmlFor={id} className="flex-1 cursor-pointer space-y-1">
        <span
          className="block text-base font-medium"
          style={{ color: "var(--color-text)" }}
        >
          {label}
        </span>
        <span className="block text-sm" style={{ color: "var(--color-muted)" }}>
          {description}
        </span>
      </label>
    </div>
  );
}

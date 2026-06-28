"use client";

import { useRef, useState, useTransition } from "react";

import {
  createObjectAction,
  type CreateObjectState,
} from "@/app/(dashboard)/objects/new/actions";
import { PhotoUpload } from "@/components/features/objects/PhotoUpload";
import {
  stepDestinationSchema,
  stepLocationSchema,
  stepWhatSchema,
} from "@/lib/validations/object";
import {
  OBJECT_CONDITIONS,
  PHOTO_MIN,
  type CategoryRow,
  type DestinationRow,
  type ObjectCondition,
} from "@/types/objects";

type Props = {
  categories: Pick<CategoryRow, "id" | "name" | "slug">[];
  destinations: Pick<DestinationRow, "id" | "name" | "description" | "slug">[];
};

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  condition: ObjectCondition | "";
  destinationId: string;
  neighborhood: string;
  photos: File[];
};

const INITIAL: FormState = {
  title: "",
  description: "",
  categoryId: "",
  condition: "",
  destinationId: "",
  neighborhood: "",
  photos: [],
};

const STEPS = ["Qué es", "Destino", "Fotos y ubicación"] as const;

export function ObjectForm({ categories, destinations }: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [data, setData] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [serverState, setServerState] = useState<CreateObjectState>({});
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key as string]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  }

  function validateStep(current: 0 | 1 | 2): boolean {
    if (current === 0) {
      const r = stepWhatSchema.safeParse({
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        condition: data.condition,
      });
      if (!r.success) {
        setFieldErrors(flatten(r.error.flatten().fieldErrors));
        return false;
      }
    } else if (current === 1) {
      const r = stepDestinationSchema.safeParse({
        destinationId: data.destinationId,
      });
      if (!r.success) {
        setFieldErrors(flatten(r.error.flatten().fieldErrors));
        return false;
      }
    } else {
      const r = stepLocationSchema.safeParse({
        neighborhood: data.neighborhood,
      });
      if (!r.success) {
        setFieldErrors(flatten(r.error.flatten().fieldErrors));
        return false;
      }
      if (data.photos.length < PHOTO_MIN) {
        setPhotoError(`Sube al menos ${PHOTO_MIN} foto`);
        return false;
      }
    }
    setFieldErrors({});
    setPhotoError(null);
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s));
  }

  function goBack() {
    setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : s));
  }

  function submit() {
    if (!validateStep(2)) return;

    const fd = new FormData();
    fd.set("title", data.title);
    fd.set("description", data.description);
    fd.set("categoryId", data.categoryId);
    fd.set("condition", data.condition);
    fd.set("destinationId", data.destinationId);
    fd.set("neighborhood", data.neighborhood);
    for (const f of data.photos) fd.append("photos", f);

    startTransition(async () => {
      const result = await createObjectAction({}, fd);
      // En caso de éxito, la action hace redirect y no se llega aquí.
      setServerState(result);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        // Vuelve al primer paso con errores
        const firstStep = stepOfFirstError(result.fieldErrors);
        if (firstStep !== null) setStep(firstStep);
      }
    });
  }

  return (
    <div className="space-y-8">
      <Progress current={step} />

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 2) goNext();
          else submit();
        }}
        className="space-y-6"
        noValidate
      >
        {step === 0 && (
          <StepWhat
            data={data}
            update={update}
            categories={categories}
            errors={fieldErrors}
          />
        )}
        {step === 1 && (
          <StepDestination
            data={data}
            update={update}
            destinations={destinations}
            errors={fieldErrors}
          />
        )}
        {step === 2 && (
          <StepLocation
            data={data}
            update={update}
            errors={fieldErrors}
            photoError={photoError}
            onPhotosChange={(files) => {
              setData((prev) => ({ ...prev, photos: files }));
              setPhotoError(null);
            }}
          />
        )}

        {serverState.error && (
          <p
            role="alert"
            className="text-sm px-3 py-2 rounded-md"
            style={{ color: "#B91C1C", backgroundColor: "#FEE2E2" }}
          >
            {serverState.error}
          </p>
        )}
        {serverState.photoErrors && serverState.photoErrors.length > 0 && (
          <ul
            role="alert"
            className="text-sm px-3 py-2 rounded-md space-y-1"
            style={{ color: "#B91C1C", backgroundColor: "#FEE2E2" }}
          >
            {serverState.photoErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors disabled:opacity-40"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              cursor: step === 0 || isPending ? "not-allowed" : "pointer",
            }}
          >
            Atrás
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-lg text-base font-medium text-white transition-colors disabled:opacity-60"
            style={{
              backgroundColor: "var(--color-accent)",
              cursor: isPending ? "wait" : "pointer",
            }}
          >
            {isPending
              ? "Publicando…"
              : step < 2
                ? "Continuar"
                : "Publicar objeto"}
          </button>
        </div>
      </form>
    </div>
  );
}

function flatten(errors: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(errors)) {
    if (v && v[0]) out[k] = v[0];
  }
  return out;
}

function stepOfFirstError(
  errors: Record<string, string>,
): 0 | 1 | 2 | null {
  const keys = Object.keys(errors);
  if (keys.some((k) => ["title", "description", "categoryId", "condition"].includes(k)))
    return 0;
  if (keys.includes("destinationId")) return 1;
  if (keys.includes("neighborhood")) return 2;
  return null;
}

// --- Subcomponentes de cada paso ---

function Progress({ current }: { current: 0 | 1 | 2 }) {
  const pct = ((current + 1) / STEPS.length) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm">
        <span style={{ color: "var(--color-muted)" }}>
          Paso {current + 1} de {STEPS.length}
        </span>
        <span className="font-medium" style={{ color: "var(--color-text)" }}>
          {STEPS[current]}
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-bg-alt)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--color-accent)",
          }}
        />
      </div>
    </div>
  );
}

type StepProps = {
  data: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  errors: Record<string, string>;
};

function StepWhat({
  data,
  update,
  categories,
  errors,
}: StepProps & { categories: Props["categories"] }) {
  return (
    <div className="space-y-5">
      <Field id="title" label="Título" error={errors.title}>
        <input
          id="title"
          type="text"
          maxLength={80}
          value={data.title}
          onChange={(e) => update("title", e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={inputStyle}
          placeholder="Ej. Silla de comedor de madera"
        />
        <Counter value={data.title.length} max={80} />
      </Field>

      <Field id="description" label="Descripción" error={errors.description}>
        <textarea
          id="description"
          rows={4}
          maxLength={500}
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2 resize-y"
          style={inputStyle}
          placeholder="Cuenta brevemente qué es, en qué condiciones está y cualquier detalle relevante."
        />
        <Counter value={data.description.length} max={500} />
      </Field>

      <Field id="categoryId" label="Categoría" error={errors.categoryId}>
        <select
          id="categoryId"
          value={data.categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={inputStyle}
        >
          <option value="">Selecciona una categoría…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id="condition" label="Estado del objeto" error={errors.condition}>
        <div className="grid grid-cols-2 gap-2">
          {OBJECT_CONDITIONS.map((c) => {
            const selected = data.condition === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => update("condition", c.value)}
                className="px-4 py-3 rounded-lg text-sm font-medium border-2 transition-colors"
                style={{
                  borderColor: selected
                    ? "var(--color-accent)"
                    : "var(--color-border)",
                  backgroundColor: selected
                    ? "var(--color-accent)"
                    : "white",
                  color: selected ? "white" : "var(--color-text)",
                }}
                aria-pressed={selected}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function StepDestination({
  data,
  update,
  destinations,
  errors,
}: StepProps & { destinations: Props["destinations"] }) {
  return (
    <div className="space-y-4">
      <p style={{ color: "var(--color-muted)" }}>
        ¿Qué destino prefieres para este objeto?
      </p>
      <div className="grid gap-3">
        {destinations.map((d) => {
          const selected = data.destinationId === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => update("destinationId", d.id)}
              className="text-left px-5 py-4 rounded-lg border-2 transition-colors"
              style={{
                borderColor: selected
                  ? "var(--color-accent)"
                  : "var(--color-border)",
                backgroundColor: selected
                  ? "var(--color-bg-alt)"
                  : "white",
              }}
              aria-pressed={selected}
            >
              <div
                className="font-semibold"
                style={{
                  color: selected
                    ? "var(--color-accent)"
                    : "var(--color-text)",
                }}
              >
                {d.name}
              </div>
              {d.description && (
                <div
                  className="text-sm mt-1"
                  style={{ color: "var(--color-muted)" }}
                >
                  {d.description}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {errors.destinationId && (
        <p role="alert" className="text-sm" style={{ color: "#B91C1C" }}>
          {errors.destinationId}
        </p>
      )}
    </div>
  );
}

function StepLocation({
  data,
  update,
  errors,
  photoError,
  onPhotosChange,
}: StepProps & {
  photoError: string | null;
  onPhotosChange: (files: File[]) => void;
}) {
  return (
    <div className="space-y-5">
      <PhotoUpload
        files={data.photos}
        onChange={onPhotosChange}
        error={photoError}
      />

      <Field
        id="neighborhood"
        label="Ubicación (barrio o ciudad)"
        error={errors.neighborhood}
      >
        <input
          id="neighborhood"
          type="text"
          maxLength={80}
          value={data.neighborhood}
          onChange={(e) => update("neighborhood", e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-base border outline-none focus:ring-2"
          style={inputStyle}
          placeholder="Ej. Gràcia, Barcelona"
        />
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-muted)" }}
        >
          Solo barrio o ciudad — nunca dirección exacta.
        </p>
      </Field>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium"
        style={{ color: "var(--color-text)" }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          role="alert"
          className="text-sm"
          style={{ color: "#B91C1C" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <div
      className="text-xs text-right"
      style={{ color: "var(--color-muted)" }}
    >
      {value} / {max}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "white",
  color: "var(--color-text)",
};

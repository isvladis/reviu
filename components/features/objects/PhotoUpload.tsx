"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  PHOTO_ALLOWED_MIME,
  PHOTO_MAX,
  PHOTO_MAX_BYTES,
  PHOTO_MIN,
} from "@/types/objects";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string | null;
};

type Preview = { file: File; url: string };

const ACCEPT = PHOTO_ALLOWED_MIME.join(",");

export function PhotoUpload({ files, onChange, error }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const next = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(next);
    return () => {
      next.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [files]);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length === 0) return;

    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of incoming) {
      if (!PHOTO_ALLOWED_MIME.includes(f.type as (typeof PHOTO_ALLOWED_MIME)[number])) {
        errors.push(`Formato no soportado: ${f.name}`);
        continue;
      }
      if (f.size > PHOTO_MAX_BYTES) {
        errors.push(`"${f.name}" supera 5 MB`);
        continue;
      }
      valid.push(f);
    }

    const combined = [...files, ...valid].slice(0, PHOTO_MAX);
    if (files.length + valid.length > PHOTO_MAX) {
      errors.push(`Máximo ${PHOTO_MAX} fotos`);
    }

    setLocalError(errors.length > 0 ? errors.join(". ") : null);
    onChange(combined);

    // Resetear input para permitir re-elegir el mismo archivo si se borra.
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
    setLocalError(null);
  }

  const shownError = error ?? localError;

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium"
        style={{ color: "var(--color-text)" }}
      >
        Fotos del objeto (mín. {PHOTO_MIN}, máx. {PHOTO_MAX})
      </label>

      <div
        className="rounded-lg border-2 border-dashed p-6 text-center"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleSelect}
          className="hidden"
          disabled={files.length >= PHOTO_MAX}
        />
        <label
          htmlFor={inputId}
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          style={{
            backgroundColor:
              files.length >= PHOTO_MAX
                ? "var(--color-bg-alt)"
                : "var(--color-accent)",
            color: files.length >= PHOTO_MAX ? "var(--color-muted)" : "white",
            cursor: files.length >= PHOTO_MAX ? "not-allowed" : "pointer",
          }}
        >
          {files.length === 0 ? "Elegir fotos" : "Añadir más"}
        </label>
        <p
          className="mt-2 text-xs"
          style={{ color: "var(--color-muted)" }}
        >
          JPG, PNG o WebP. Máx. 5 MB cada una.
        </p>
      </div>

      {previews.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((p, i) => (
            <li
              key={p.url}
              className="relative rounded-lg overflow-hidden border"
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={`Foto ${i + 1}: ${p.file.name}`}
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                aria-label={`Quitar foto ${i + 1}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {shownError && (
        <p role="alert" className="text-sm" style={{ color: "#B91C1C" }}>
          {shownError}
        </p>
      )}
    </div>
  );
}

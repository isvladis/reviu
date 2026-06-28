"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { PublicCategory } from "@/lib/supabase/objects";

type Props = {
  categories: PublicCategory[];
};

type GeoMode = "text" | "browser";

export function FilterBar({ categories }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [category, setCategory] = useState(params.get("cat") ?? "");
  const [location, setLocation] = useState(params.get("q") ?? "");
  const [mode, setMode] = useState<GeoMode>("text");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  function applyParams(next: { cat?: string; q?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.cat !== undefined) {
      if (next.cat) sp.set("cat", next.cat);
      else sp.delete("cat");
    }
    if (next.q !== undefined) {
      if (next.q) sp.set("q", next.q);
      else sp.delete("q");
    }
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `/objetos?${qs}` : "/objetos");
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyParams({ cat: category, q: location });
  }

  function clearFilters() {
    setCategory("");
    setLocation("");
    setGeoError(null);
    startTransition(() => router.push("/objetos"));
  }

  async function useMyLocation() {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // La coordenada NUNCA se persiste; viaja al servidor solo para
          // resolverla a una ciudad/barrio vía Nominatim y se descarta.
          const res = await fetch(
            `/api/geo/reverse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`,
            { headers: { Accept: "application/json" } },
          );
          if (!res.ok) throw new Error("reverse failed");
          const json = (await res.json()) as {
            city?: string;
            neighborhood?: string;
          };
          const term = json.neighborhood || json.city || "";
          if (!term) {
            setGeoError("No hemos podido reconocer tu zona.");
          } else {
            setLocation(term);
            applyParams({ cat: category, q: term });
          }
        } catch {
          setGeoError("No hemos podido reconocer tu zona.");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Has denegado el permiso de ubicación.");
        } else {
          setGeoError("No hemos podido obtener tu ubicación.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  const hasActiveFilters = Boolean(params.get("cat") || params.get("q"));

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border-2 p-4 md:p-5 space-y-4"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="filter-cat"
            className="block text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Categoría
          </label>
          <select
            id="filter-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border-2 p-3 text-base"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="block text-sm font-medium"
              style={{ color: "var(--color-text)" }}
            >
              Ubicación
            </span>
            <div
              className="inline-flex rounded-lg overflow-hidden border-2"
              style={{ borderColor: "var(--color-border)" }}
            >
              <ModeButton
                active={mode === "text"}
                onClick={() => setMode("text")}
              >
                Texto
              </ModeButton>
              <ModeButton
                active={mode === "browser"}
                onClick={() => setMode("browser")}
              >
                Cerca de mí
              </ModeButton>
            </div>
          </div>

          {mode === "text" ? (
            <input
              id="filter-q"
              type="search"
              placeholder="Barrio o ciudad"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border-2 p-3 text-base"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading || pending}
                className="w-full px-4 py-3 rounded-lg text-base font-medium border-2 transition-colors disabled:opacity-60"
                style={{
                  borderColor: "var(--color-accent)",
                  color: "var(--color-accent)",
                }}
              >
                {geoLoading ? "Buscando tu zona…" : "Usar mi ubicación"}
              </button>
              {location ? (
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  Filtrando por <strong>{location}</strong>
                </p>
              ) : null}
              {geoError ? (
                <p className="text-xs" style={{ color: "#B91C1C" }}>
                  {geoError}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          {pending ? "Aplicando…" : "Aplicar filtros"}
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            disabled={pending}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Limpiar
          </button>
        ) : null}
      </div>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium transition-colors"
      style={
        active
          ? {
              backgroundColor: "var(--color-accent)",
              color: "white",
            }
          : { color: "var(--color-text)" }
      }
    >
      {children}
    </button>
  );
}

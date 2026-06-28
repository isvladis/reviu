// Route handler para geocodificación inversa vía Nominatim.
// La coordenada llega del cliente (geolocalización del navegador), se usa
// para resolver una etiqueta (ciudad/barrio) y NO se persiste ni se loguea.
// Nominatim exige User-Agent identificable; lo añadimos aquí (no se puede
// fijar desde el navegador).

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NominatimResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    quarter?: string;
  };
};

function parseCoord(value: string | null, min: number, max: number): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseCoord(url.searchParams.get("lat"), -90, 90);
  const lng = parseCoord(url.searchParams.get("lng"), -180, 180);

  if (lat === null || lng === null) {
    return NextResponse.json(
      { error: "Coordenadas no válidas" },
      { status: 400 },
    );
  }

  const nominatim = new URL("https://nominatim.openstreetmap.org/reverse");
  nominatim.searchParams.set("format", "jsonv2");
  nominatim.searchParams.set("lat", String(lat));
  nominatim.searchParams.set("lon", String(lng));
  nominatim.searchParams.set("zoom", "14");
  nominatim.searchParams.set("addressdetails", "1");
  nominatim.searchParams.set("accept-language", "es");

  try {
    const res = await fetch(nominatim.toString(), {
      headers: {
        // Política de uso de Nominatim: User-Agent identificable.
        "User-Agent": "Reviu/1.0",
        Accept: "application/json",
      },
      // No reenviamos cookies ni cabeceras del cliente.
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Servicio de geocodificación no disponible" },
        { status: 502 },
      );
    }

    const json = (await res.json()) as NominatimResponse;
    const addr = json.address ?? {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      null;
    const neighborhood =
      addr.suburb ||
      addr.neighbourhood ||
      addr.city_district ||
      addr.quarter ||
      null;

    return NextResponse.json({
      city,
      neighborhood,
    });
  } catch {
    return NextResponse.json(
      { error: "Servicio de geocodificación no disponible" },
      { status: 502 },
    );
  }
}

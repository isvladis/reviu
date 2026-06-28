// Función pura: distancia relativa al "ahora", en español, sin librerías.
// Pensada para tarjetas de listado ("hace 2 días", "hace 3 horas").

export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.round(diffMs / 1000);

  if (sec < 60) return "hace unos segundos";
  const min = Math.round(sec / 60);
  if (min < 60) return min === 1 ? "hace 1 minuto" : `hace ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "hace 1 hora" : `hace ${h} horas`;
  const d = Math.round(h / 24);
  if (d < 7) return d === 1 ? "hace 1 día" : `hace ${d} días`;
  const w = Math.round(d / 7);
  if (w < 5) return w === 1 ? "hace 1 semana" : `hace ${w} semanas`;
  const months = Math.round(d / 30);
  if (months < 12) {
    return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
  }
  const years = Math.round(d / 365);
  return years === 1 ? "hace 1 año" : `hace ${years} años`;
}

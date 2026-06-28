import Image from "next/image";

import type { MyObjectListItem } from "@/lib/supabase/my-objects";
import { formatRelativeDate } from "@/utils/dates";

type Props = {
  item: MyObjectListItem;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "En revisión", bg: "#FEF3C7", text: "#92400E" },
  published: { label: "Publicado", bg: "#D1FAE5", text: "#065F46" },
  withdrawn: { label: "Retirado", bg: "#FEE2E2", text: "#991B1B" },
  draft: { label: "Borrador", bg: "#F3F4F6", text: "#374151" },
  reserved: { label: "Reservado", bg: "#DBEAFE", text: "#1E40AF" },
  completed: { label: "Completado", bg: "#A7F3D0", text: "#064E3B" },
};

export function MyObjectCard({ item }: Props) {
  const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;

  return (
    <div
      className="rounded-xl border-2 overflow-hidden"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        className="relative w-full aspect-[4/3]"
        style={{ backgroundColor: "var(--color-bg-alt)" }}
      >
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            sin foto
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base md:text-lg font-semibold leading-snug truncate">
            {item.title}
          </h2>
          <span
            className="inline-flex items-center shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: config.bg, color: config.text }}
          >
            {config.label}
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: "var(--color-bg-alt)",
              color: "var(--color-text)",
            }}
          >
            {item.categoryName}
          </span>
          <span>{formatRelativeDate(item.createdAt)}</span>
        </div>

        {item.status === "withdrawn" && item.rejectionReason ? (
          <p
            className="text-sm rounded-lg px-3 py-2"
            style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}
          >
            Motivo: {item.rejectionReason}
          </p>
        ) : null}
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

import type { PendingObjectListItem } from "@/lib/supabase/moderation";

type Props = {
  item: PendingObjectListItem;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ObjectReviewCard({ item }: Props) {
  const location = [item.neighborhood, item.city].filter(Boolean).join(", ");

  return (
    <Link
      href={`/moderacion/${item.id}`}
      className="block rounded-xl border-2 p-4 md:p-5 transition-colors hover:bg-[var(--color-bg-alt)]"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex gap-4">
        <div
          className="relative shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-alt)" }}
        >
          {item.thumbnailUrl ? (
            <Image
              src={item.thumbnailUrl}
              alt=""
              fill
              sizes="(min-width: 768px) 112px, 96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xs"
              style={{ color: "var(--color-muted)" }}
            >
              sin foto
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg md:text-xl font-semibold truncate">
              {item.title}
            </h2>
            <span
              className="text-xs whitespace-nowrap"
              style={{ color: "var(--color-muted)" }}
            >
              {formatDate(item.createdAt)}
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            <span>{item.categoryName}</span>
            <span aria-hidden>·</span>
            <span>{item.destinationName}</span>
          </div>

          {location ? (
            <div className="text-sm" style={{ color: "var(--color-muted)" }}>
              {location}
            </div>
          ) : null}

          <div className="text-sm pt-1">
            <span style={{ color: "var(--color-muted)" }}>Cede: </span>
            <span style={{ color: "var(--color-text)" }}>{item.giverName}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";

import type { PublicObjectListItem } from "@/lib/supabase/objects";
import { formatRelativeDate } from "@/utils/dates";

type Props = {
  item: PublicObjectListItem;
};

export function ObjectCard({ item }: Props) {
  const location = [item.neighborhood, item.city].filter(Boolean).join(", ");

  return (
    <Link
      href={`/objetos/${item.id}`}
      className="block rounded-xl border-2 overflow-hidden transition-colors hover:bg-[var(--color-bg-alt)]"
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
          {location ? <span className="truncate">· {location}</span> : null}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>
            {formatRelativeDate(item.createdAt)}
          </span>
          <span
            className="inline-flex items-center gap-1 text-xs select-none"
            style={{ color: "var(--color-muted)" }}
            aria-label="Datos de contacto bloqueados; inicia sesión para verlos"
          >
            <LockIcon />
            <span className="blur-[2px]">contacto</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

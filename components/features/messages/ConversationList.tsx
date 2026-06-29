import Image from "next/image";
import Link from "next/link";

import type { ConversationListItem } from "@/lib/supabase/messages";
import { formatRelativeDate } from "@/utils/dates";

type Props = {
  items: ConversationListItem[];
};

export function ConversationList({ items }: Props) {
  return (
    <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/mensajes/${item.id}`}
            className="flex items-center gap-4 py-4 px-2 -mx-2 rounded-lg transition-colors hover:bg-[var(--color-bg-alt)]"
          >
            <div
              className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0"
              style={{ backgroundColor: "var(--color-bg-alt)" }}
            >
              {item.objectThumbnailUrl ? (
                <Image
                  src={item.objectThumbnailUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-xs"
                  style={{ color: "var(--color-muted)" }}
                >
                  sin foto
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold truncate">{item.objectTitle}</p>
                {item.lastMessageAt ? (
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {formatRelativeDate(item.lastMessageAt)}
                  </span>
                ) : null}
              </div>
              <p
                className="text-sm truncate"
                style={{ color: "var(--color-muted)" }}
              >
                {item.otherDisplayName}
              </p>
              <p
                className="text-sm truncate mt-0.5"
                style={{
                  color: item.hasUnread
                    ? "var(--color-text)"
                    : "var(--color-muted)",
                  fontWeight: item.hasUnread ? 600 : 400,
                }}
              >
                {item.lastMessagePreview ?? "Sin mensajes aún"}
              </p>
            </div>

            {item.hasUnread ? (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
                aria-label="Mensajes sin leer"
              />
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

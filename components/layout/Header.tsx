import Link from "next/link";

import { LogoutButton } from "@/components/features/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type Props = {
  session?: { displayName: string };
};

export async function Header({ session }: Props = {}) {
  let resolved = session;

  if (!resolved) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      resolved = { displayName: profile?.display_name ?? "Vecino/a" };
    }
  }

  return (
    <header className="w-full py-6 px-6 md:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-accent)" }}
        >
          Reviu
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/objetos"
            className="text-sm font-medium"
            style={{ color: "var(--color-text)" }}
          >
            Ver objetos
          </Link>

          {resolved ? (
            <>
              <Link
                href="/perfil"
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {resolved.displayName}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg border-2 transition-colors"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-accent)",
              }}
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

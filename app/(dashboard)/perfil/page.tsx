import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ContactPreferences } from "@/components/features/profile/ContactPreferences";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mi perfil — Reviu",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone, contact_email, contact_phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="text-sm font-medium"
          style={{ color: "var(--color-accent)" }}
        >
          ← Volver al inicio
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Mi perfil
        </h1>
        <p style={{ color: "var(--color-muted)" }}>
          Edita tu nombre y decide cómo quieres que otros vecinos puedan
          contactarte.
        </p>
      </div>

      <ContactPreferences
        initial={{
          displayName: profile?.display_name ?? "",
          email: user.email ?? "",
          phone: profile?.phone ?? null,
          contactEmail: profile?.contact_email ?? false,
          contactPhone: profile?.contact_phone ?? false,
        }}
      />
    </div>
  );
}

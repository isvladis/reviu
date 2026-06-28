import Link from "next/link";
import { redirect } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <header className="w-full py-6 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
            style={{ color: "var(--color-accent)" }}
          >
            Reviu
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full px-6 md:px-8 py-12 md:py-16">
        <div className="w-full max-w-[400px] mx-auto">{children}</div>
      </main>

      <Footer />
    </>
  );
}

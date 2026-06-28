import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function PublicObjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full px-6 md:px-8 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
      <Footer />
    </>
  );
}

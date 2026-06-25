import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reviu — Las cosas merecen una segunda vida",
  description:
    "Un movimiento ciudadano que nace en Barcelona para cambiar la forma en que nos relacionamos con los objetos y con el reciclaje real.",
  openGraph: {
    title: "Reviu — Las cosas merecen una segunda vida",
    description:
      "Un movimiento ciudadano que nace en Barcelona para cambiar la forma en que nos relacionamos con los objetos y con el reciclaje real.",
    locale: "es_ES",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

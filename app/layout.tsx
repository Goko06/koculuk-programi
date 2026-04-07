import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Koçluk Programı",
  description: "YKS, LGS ve Ara Sınıflar İçin Online Koçluk Sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-slate-50">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
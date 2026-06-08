import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

import { BRAND } from "@/lib/landing/content";

export const metadata: Metadata = {
  title: `${BRAND.name} — Portal do Colaborador / Employee Portal`,
  description:
    "Portal interno Armazém Coral Achaqui para admissão, documentos, solicitações ao RH e espelho de ponto. Internal employee portal for onboarding, documents, and HR requests.",
  icons: {
    icon: "/brand/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { InstallPrompt } from "@/components/shared/install-prompt";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";

const primaryFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-primary",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Crew — Gestion d'équipe",
    template: "%s · Crew",
  },
  description:
    "PWA pour coordonner l'équipe média d'une église : services, planning, validation mensuelle, contenu spirituel.",
  applicationName: "Crew",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crew",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F2" },
    { media: "(prefers-color-scheme: dark)", color: "#16161B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${primaryFont.variable} antialiased`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)]">
        {children}
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

export const metadata: Metadata = {
  title: {
    default: "ObraControl",
    template: "%s · ObraControl",
  },
  description: "Control de presupuesto, incidencias, contratos y subcontratistas para constructoras.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "ObraControl",
    description: "Coordine presupuestos, incidencias y contratos desde un solo lugar.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ObraControl",
    description: "Control de presupuesto, incidencias y subcontratistas para constructoras.",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  themeColor: "#f5f4ef",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

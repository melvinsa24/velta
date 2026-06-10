import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velta",
  description: "Dashboard financier personnel",
};

// Mobile-first : largeur device, pas de zoom auto, couleur de thème claire.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f5f7",
  // viewport-fit=cover : requis pour que env(safe-area-inset-*) renvoie
  // une valeur non nulle sur iOS (tab bar sous la barre Safari).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

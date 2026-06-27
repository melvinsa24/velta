import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velta",
  description: "Dashboard financier personnel",
  // PWA : manifest + comportement « app » au lancement depuis l'écran d'accueil.
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Velta",
    // black-translucent : la barre d'état iOS recouvre le haut → géré par les
    // safe areas (env(safe-area-inset-top)) sur le header.
    statusBarStyle: "black-translucent",
  },
  // Next 16 émet `mobile-web-app-capable` via appleWebApp ; on ajoute le legacy
  // `apple-mobile-web-app-capable` pour les anciennes versions d'iOS Safari.
  other: { "apple-mobile-web-app-capable": "yes" },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
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

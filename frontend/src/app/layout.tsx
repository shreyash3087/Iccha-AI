import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICCHA AI — अपनी दुकान, ऑनलाइन",
  description:
    "बस बोलिए — ICCHA AI आपकी दुकान के लिए एक खूबसूरत वेबसाइट बना देगा। " +
    "Hindi-first voice AI for Indian retail shop owners.",
  keywords: [
    "shop website",
    "dukan website",
    "hindi voice AI",
    "Indian retail",
    "website builder",
    "ICCHA AI",
  ],
  authors: [{ name: "ICCHA AI" }],
  robots: "index, follow",
  openGraph: {
    title: "ICCHA AI — अपनी दुकान, ऑनलाइन",
    description: "बस बोलिए — ICCHA AI आपकी दुकान के लिए एक खूबसूरत वेबसाइट बना देगा।",
    type: "website",
    locale: "hi_IN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Prevent zoom on input focus on iOS — important for a voice-first app
  userScalable: false,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" dir="ltr">
      <head>
        {/* Preconnect to Google Fonts for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

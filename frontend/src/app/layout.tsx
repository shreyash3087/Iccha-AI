import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "ICCHA AI — Multilingual Voice Website Generator for Bharat | अपनी दुकान, ऑनलाइन",
  description:
    "Speak in your own language — Hindi, Hinglish, Tamil, Telugu, Marathi, Kannada, Gujarati, Bengali, Punjabi, Malayalam, or English. " +
    "ICCHA AI automatically creates a stunning, Google-verified digital storefront with WhatsApp ordering and printable QR standees.",
  keywords: [
    "voice website builder",
    "AI website generator",
    "Bharat retail",
    "dukan website",
    "multilingual voice AI",
    "Indian merchant store",
    "vernacular voice AI",
    "ICCHA AI",
    "Google Maps storefront",
    "WhatsApp ordering",
    "digital dukaan",
  ],
  authors: [{ name: "ICCHA AI" }],
  creator: "ICCHA AI",
  publisher: "ICCHA AI",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "ICCHA AI — Multilingual Voice Website Generator for Bharat",
    description:
      "Speak in any Indian language. ICCHA AI builds a live digital storefront with Google Places verification, WhatsApp ordering, and printable counter QR standees in seconds.",
    type: "website",
    locale: "en_IN",
    siteName: "ICCHA AI",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "ICCHA AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "ICCHA AI — Multilingual Voice Website Generator for Bharat",
    description:
      "Speak in any Indian language to launch your live store website with WhatsApp catalog and QR standee in seconds.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        {/* AuthProvider wraps the entire app — one source of truth for auth state */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

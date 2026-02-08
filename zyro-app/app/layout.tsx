import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import CartSync from "@/components/CartSync";
import "./globals.css";

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "Zyro Online | Gafas de Calidad Premium",
    template: "%s | Zyro Online",
  },
  description: "Cero intermediarios, cero límites. Gafas de sol y lentes con receta de calidad premium. Más de 25 años de experiencia en la industria óptica.",
  keywords: ["gafas", "lentes", "óptica", "gafas de sol", "lentes con receta", "anteojos", "Latinoamérica"],
  authors: [{ name: "Zyro Online" }],
  openGraph: {
    title: "Zyro Online | Gafas de Calidad Premium",
    description: "Cero intermediarios, cero límites. Gafas de sol y lentes con receta de calidad premium.",
    url: defaultUrl,
    siteName: "Zyro Online",
    locale: "es_LA",
    type: "website",
    images: [
      {
        url: "/images/hero/hero-2.jpg",
        width: 1200,
        height: 630,
        alt: "Zyro Online - Gafas de Calidad Premium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zyro Online | Gafas de Calidad Premium",
    description: "Cero intermediarios, cero límites. Gafas de sol y lentes con receta de calidad premium.",
    images: ["/images/hero/hero-2.jpg"],
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S717CTXZYZ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S717CTXZYZ');
          `}
        </Script>
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <CartSync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

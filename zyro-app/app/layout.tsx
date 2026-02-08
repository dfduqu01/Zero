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
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:6641761,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
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

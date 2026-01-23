import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CartSync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

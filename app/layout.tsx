import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { site } from "@/data/site";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/effects/CustomCursor";
import { PageTransition } from "@/components/effects/PageTransition";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";

/**
 * Fonts are self-hosted variable woff2 (DESIGN_SYSTEM.md §3): two files, all
 * weights, no third-party request at runtime and no network fetch at build.
 * Source files come from @fontsource-variable/* — re-copy from node_modules
 * to update them.
 */
const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  preload: true,
});

const jetbrains = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains",
  display: "swap",
  weight: "100 800",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.author }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#070809",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <PersonJsonLd />
        <SkipLink />
        <CustomCursor />
        <Header />
        <main id="main">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        {/* The tracking script only actually exists once deployed on Vercel — anywhere
            else (local `next start`, CI, this repo's own e2e/verify) "auto" mode still
            tries to fetch it and 404s, which the smoke suite correctly treats as a real
            console error. `VERCEL` is set automatically only on Vercel's own builds. */}
        <Analytics mode={process.env.VERCEL ? "production" : "development"} />
      </body>
    </html>
  );
}

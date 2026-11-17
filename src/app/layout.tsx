import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  // Needed so the social-preview image gets a full web address. Vercel sets this automatically.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000",
  ),
  title: "Pickleball Slots HK | by HKPPT",
  description: "Discounted last-minute pickleball court slots across Hong Kong, from the Hong Kong Premier Pickleball Tournament team.",
  openGraph: {
    title: "Pickleball Slots HK | by HKPPT",
    description: "Play more, pay less: discounted pickleball court slots across Hong Kong.",
    images: [{ url: "/brand/hkppt-logo.png", width: 1000, height: 1000, alt: "HKPPT: Hong Kong Premier Pickleball Tournament" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#001f3d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-HK">
      <body className={`${geistMono.variable} font-sans antialiased`}>
        <header className="on-dark sticky top-0 z-20 bg-navy-950 text-white shadow-[0_1px_0_0_rgba(182,255,5,0.35)]">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
            <Link href="/" className="flex items-center gap-3" aria-label="Pickleball Slots HK by HKPPT, home">
              <span className="leading-tight">
                <span className="block text-[11px] font-semibold tracking-[0.18em] text-ball-400">PICKLEBALL SLOTS HK</span>
                <span className="block text-sm font-semibold text-white">折扣場地 Discounted Courts</span>
              </span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 pb-32 pt-5">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}

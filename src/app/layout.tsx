import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Saira } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Display face for headlines, times and prices. Close to the HKPPT wordmark.
const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
});

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${saira.variable} font-sans antialiased`}>
        <header className="sticky top-0 z-20 border-t-[3px] border-t-ball-400 border-b border-b-navy-900/10 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Pickleball Slots HK by HKPPT, home">
              <Image src="/brand/hkppt-mark.png" alt="" width={58} height={22} priority className="h-[22px] w-auto" />
              <span className="leading-none">
                <span className="block font-display text-[15px] font-extrabold uppercase italic tracking-wide text-navy-900">
                  Pickleball Slots HK
                </span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.32em] text-navy-900/50">
                  by HKPPT
                </span>
              </span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-md px-4 pb-28 pt-5">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}

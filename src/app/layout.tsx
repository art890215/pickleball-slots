import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pickleball Slots HK",
  description: "Discounted pickleball court slots across Hong Kong",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-emerald-700">
              <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-sm text-white">P</span>
              Pickleball Slots HK
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-md px-4 pb-28 pt-5">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}

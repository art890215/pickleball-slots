"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/slots", label: "Slots", icon: "M4 6h16M4 12h16M4 18h10", match: ["/slots"] },
  { href: "/courts", label: "Courts", icon: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z", match: ["/courts"] },
  { href: "/bookings", label: "Bookings", icon: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z", match: ["/bookings"] },
  { href: "/owner", label: "Owners", icon: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6", match: ["/owner", "/claim", "/admin"] },
];

// Phone-style tab bar at the bottom of the screen.
export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => {
          const active = t.match.some((m) => path === m || path.startsWith(`${m}/`));
          return (
            <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-emerald-700" : "text-black/50"}`}>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={t.icon} />
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

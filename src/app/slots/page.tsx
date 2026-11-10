import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { addDays, dayParts, formatDay, hkDate, hkTime, hoursBetween, isDateString, todayHK } from "@/lib/hk-time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Discounted pickleball slots | Pickleball Slots HK" };

const REGIONS = ["Hong Kong Island", "Kowloon", "New Territories"] as const;
const TIMES = [
  { key: "morning", label: "Morning", from: "06:00", to: "12:00" },
  { key: "afternoon", label: "Afternoon", from: "12:00", to: "18:00" },
  { key: "evening", label: "Evening", from: "18:00", to: "23:59" },
  { key: "late", label: "Late night", from: "00:00", to: "06:00" },
] as const;
const DAYS_SHOWN = 14;

type Slot = {
  slot_id: string;
  starts_at: string;
  ends_at: string;
  normal_price: number;
  discounted_price: number;
  discount_rate: number | null;
  discount_pct: number;
  court_name: string;
  venue_name: string;
  district: string;
  region: string;
};

type Params = { date?: string; region?: string; time?: string };

export default async function SlotsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const today = todayHK();
  const lastDay = addDays(today, DAYS_SHOWN - 1);
  const date = isDateString(sp.date) && sp.date >= today && sp.date <= lastDay ? sp.date : null;
  const region = REGIONS.find((r) => r === sp.region) ?? null;
  const time = TIMES.find((t) => t.key === sp.time) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_available_slots", {
    p_region: region,
    p_from_date: date ?? today,
    p_to_date: date ?? lastDay,
    p_from_time: time?.from ?? null,
    p_to_time: time?.to ?? null,
  });
  const slots = (data ?? []) as Slot[];

  const href = (patch: Partial<Params>) => {
    const q = new URLSearchParams();
    const merged = { date: date ?? undefined, region: region ?? undefined, time: time?.key, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `/slots?${s}` : "/slots";
  };
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/15 bg-white"}`;

  const byDay = new Map<string, Slot[]>();
  for (const s of slots) {
    const d = hkDate(s.starts_at);
    byDay.set(d, [...(byDay.get(d) ?? []), s]);
  }

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Discounted slots</h1>
        <p className="mt-0.5 text-sm text-black/60">
          {slots.length} slot{slots.length === 1 ? "" : "s"} at 20–40% off · pay the venue by FPS or PayMe
        </p>
      </div>

      {/* Day */}
      <nav aria-label="Day" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={href({ date: undefined })} scroll={false} className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border py-2 text-sm font-medium ${!date ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white"}`}>
          All
        </Link>
        {Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i)).map((d) => {
          const p = dayParts(d);
          const active = d === date;
          return (
            <Link key={d} href={href({ date: d })} scroll={false} className={`flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white"}`}>
              <span className={`text-[11px] ${active ? "text-white/80" : "text-black/50"}`}>{d === today ? "Today" : p.weekday}</span>
              <span className="text-lg font-semibold leading-tight">{p.day}</span>
            </Link>
          );
        })}
      </nav>

      {/* Region + time */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <Link href={href({ region: undefined })} scroll={false} className={chip(!region)}>All areas</Link>
        {REGIONS.map((r) => (
          <Link key={r} href={href({ region: r })} scroll={false} className={chip(region === r)}>{r}</Link>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
        <Link href={href({ time: undefined })} scroll={false} className={chip(!time)}>Any time</Link>
        {TIMES.map((t) => (
          <Link key={t.key} href={href({ time: t.key })} scroll={false} className={chip(time?.key === t.key)}>{t.label}</Link>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">Couldn&apos;t load slots: {error.message}</p>}

      {slots.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-black/15 p-6 text-center">
          <p className="font-medium">No slots match</p>
          <p className="mt-1 text-sm text-black/60">Try another day or area. Venues post new slots all the time.</p>
          <Link href="/courts" className="mt-3 inline-block text-sm text-emerald-700 underline">Browse all courts</Link>
        </div>
      )}

      {[...byDay.entries()].map(([d, list]) => (
        <section key={d} className="space-y-2">
          {!date && <h2 className="pt-1 text-sm font-semibold text-black/60">{d === today ? "Today" : formatDay(d)}</h2>}
          {list.map((s) => {
            const rate = s.discount_rate ?? Math.round(Number(s.discount_pct));
            const hours = hoursBetween(s.starts_at, s.ends_at);
            return (
              <Link key={s.slot_id} href={`/slots/${s.slot_id}`} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition active:scale-[0.99]">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-lg font-semibold tabular-nums leading-tight">{hkTime(s.starts_at)}</p>
                  <p className="text-xs text-black/50">{hours % 1 ? hours.toFixed(1) : hours} hr</p>
                </div>
                <VenueBadge name={s.venue_name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-snug">{s.venue_name}</p>
                  <p className="truncate text-xs text-black/60">{s.court_name} · {s.district}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-emerald-800">HK${Number(s.discounted_price)}</p>
                  <p className="text-xs">
                    <span className="text-black/40 line-through">${Number(s.normal_price)}</span>{" "}
                    <span className="rounded bg-emerald-100 px-1 font-semibold text-emerald-900">−{rate}%</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      ))}
    </main>
  );
}

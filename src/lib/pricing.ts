// Venue price lists: "Mon–Fri 09:00–12:00 HK$250/hr", "Sat & Sun 23:00–05:00 HK$200/hr".
// A slot's original price is the sum of its 30-minute blocks, each priced from the list.

import { addDays } from "./hk-time";

export type PriceRule = {
  id?: string;
  days: number[]; // 0 = Sunday … 6 = Saturday
  start_time: string; // "HH:MM" (or "HH:MM:SS" from the database)
  end_time: string; // earlier than start = runs past midnight
  price_per_hour: number;
};

export const DISCOUNT_RATES = [20, 25, 30, 35, 40] as const;
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

// Does this rule cover the 30-minute block starting at `minute` on `date`?
function covers(rule: PriceRule, date: string, minute: number): boolean {
  const s = toMinutes(rule.start_time);
  const e = toMinutes(rule.end_time);
  const today = weekday(date);
  if (s < e) return rule.days.includes(today) && minute >= s && minute < e;
  // Overnight rule, e.g. Sat 23:00 – Sun 05:00 belongs to Saturday.
  const yesterday = weekday(addDays(date, -1));
  return (rule.days.includes(today) && minute >= s) || (rule.days.includes(yesterday) && minute < e);
}

export function hourlyPriceAt(rules: PriceRule[], date: string, minute: number): number | null {
  const r = rules.find((x) => covers(x, date, minute));
  return r ? Number(r.price_per_hour) : null;
}

// Original price for a slot starting at `start` on `date`, lasting `minutes`.
// Returns null if any part of the slot isn't covered by the price list.
export function slotPrice(rules: PriceRule[], date: string, start: string, minutes: number): number | null {
  let total = 0;
  let d = date;
  let m = toMinutes(start);
  for (let done = 0; done < minutes; done += 30) {
    if (m >= 24 * 60) {
      m -= 24 * 60;
      d = addDays(d, 1);
    }
    const hourly = hourlyPriceAt(rules, d, m);
    if (hourly === null) return null;
    total += hourly / 2;
    m += 30;
  }
  return Math.round(total * 100) / 100;
}

export function discountedPrice(normal: number, rate: number): number {
  return Math.round((normal * (100 - rate)) / 100);
}

// "Mon–Fri", "Sat & Sun", "Every day", "Mon, Wed, Fri"
export function describeDays(days: number[]): string {
  const set = new Set(days);
  if (set.size === 7) return "Every day";
  const order = [1, 2, 3, 4, 5, 6, 0];
  const sorted = order.filter((d) => set.has(d));
  if (sorted.length === 2 && set.has(6) && set.has(0)) return "Sat & Sun";
  // Find a single consecutive run Mon..Sun
  const idx = sorted.map((d) => order.indexOf(d));
  const consecutive = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (consecutive && sorted.length > 2) return `${DAY_SHORT[sorted[0]]}–${DAY_SHORT[sorted.at(-1)!]}`;
  return sorted.map((d) => DAY_SHORT[d]).join(", ");
}

// Two rules overlap if any 30-minute block of the week is covered by both.
export function findOverlap(rules: PriceRule[]): [number, number] | null {
  const monday = "2026-11-09"; // any Monday; we check one whole week
  for (let day = 0; day < 7; day++) {
    const date = addDays(monday, day);
    for (let m = 0; m < 24 * 60; m += 30) {
      const hits = rules.map((r, i) => (covers(r, date, m) ? i : -1)).filter((i) => i >= 0);
      if (hits.length > 1) return [hits[0], hits[1]];
    }
  }
  return null;
}

// For the weekly preview: per weekday (Mon..Sun), 48 half-hour blocks with price or null.
export function weekGrid(rules: PriceRule[]): { day: number; blocks: (number | null)[] }[] {
  const monday = "2026-11-09";
  return [1, 2, 3, 4, 5, 6, 0].map((day, i) => {
    const date = addDays(monday, i);
    return { day, blocks: Array.from({ length: 48 }, (_, b) => hourlyPriceAt(rules, date, b * 30)) };
  });
}

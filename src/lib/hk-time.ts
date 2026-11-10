// All slot times are Hong Kong time (UTC+8, no daylight saving).

const HK_OFFSET_MS = 8 * 60 * 60 * 1000;

// "2026-11-10" for today in Hong Kong.
export function todayHK(): string {
  return new Date(Date.now() + HK_OFFSET_MS).toISOString().slice(0, 10);
}

export function isDateString(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// "2026-11-10" + "19:30" -> "2026-11-10T19:30:00+08:00"
export function hkDateTime(date: string, time: string): string {
  return `${date}T${time}:00+08:00`;
}

// Start of a Hong Kong day as an ISO timestamp, for database range filters.
export function hkDayStart(date: string): string {
  return hkDateTime(date, "00:00");
}

// "19:30" in Hong Kong time.
export function hkTime(iso: string): string {
  return new Date(new Date(iso).getTime() + HK_OFFSET_MS).toISOString().slice(11, 16);
}

// "2026-11-10" (Hong Kong date) of a timestamp.
export function hkDate(iso: string): string {
  return new Date(new Date(iso).getTime() + HK_OFFSET_MS).toISOString().slice(0, 10);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayParts(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return {
    weekday: WEEKDAYS[d.getUTCDay()],
    day: d.getUTCDate(),
    month: MONTHS[d.getUTCMonth()],
  };
}

// "Tue 10 Nov"
export function formatDay(date: string): string {
  const p = dayParts(date);
  return `${p.weekday} ${p.day} ${p.month}`;
}

export function hoursBetween(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000;
}

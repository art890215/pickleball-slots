"use client";

import { useMemo, useState, useTransition } from "react";
import { savePriceRules } from "./actions";
import { DAY_SHORT, describeDays, findOverlap, weekGrid, type PriceRule } from "@/lib/pricing";
import { ErrorBox, NoticeBox, buttonClass } from "@/components/ui";

const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const PRESETS: { label: string; days: number[] }[] = [
  { label: "Mon–Fri", days: [1, 2, 3, 4, 5] },
  { label: "Sat & Sun", days: [0, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
];
// Colours for different price levels in the weekly preview.
const TIER_COLORS = ["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d"];

type Row = PriceRule & { key: number };

const selectClass =
  "w-full rounded-lg border border-black/20 bg-white px-2 py-2 text-base outline-none focus:border-emerald-700";

export function PriceListEditor({ venueId, initial }: { venueId: string; initial: PriceRule[] }) {
  const [rows, setRows] = useState<Row[]>(
    initial.length
      ? initial.map((r, i) => ({ ...r, start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5), key: i }))
      : [{ key: 0, days: [1, 2, 3, 4, 5], start_time: "09:00", end_time: "18:00", price_per_hour: 0 }],
  );
  const [result, setResult] = useState<{ error?: string; ok?: string }>();
  const [saving, startSaving] = useTransition();

  const valid = rows.filter((r) => r.days.length && r.start_time !== r.end_time && Number(r.price_per_hour) > 0);
  const overlap = useMemo(() => findOverlap(valid), [valid]);
  const grid = useMemo(() => weekGrid(valid), [valid]);
  const prices = [...new Set(valid.map((r) => Number(r.price_per_hour)))].sort((a, b) => a - b);
  const colorFor = (p: number | null) =>
    p === null ? "transparent" : TIER_COLORS[Math.min(prices.indexOf(p), TIER_COLORS.length - 1)];

  const update = (key: number, patch: Partial<Row>) => {
    setResult(undefined);
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-4">
      {rows.map((r, i) => {
        const overnight = r.end_time < r.start_time;
        return (
          <div key={r.key} className="space-y-3 rounded-xl border border-black/10 bg-black/[0.015] p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Price {i + 1}
                {r.days.length > 0 && <span className="font-normal text-black/50"> · {describeDays(r.days)}</span>}
              </span>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                  className="text-sm text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex gap-1">
              {WEEK.map((d) => {
                const on = r.days.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    aria-pressed={on}
                    onClick={() => update(r.key, { days: on ? r.days.filter((x) => x !== d) : [...r.days, d] })}
                    className={`h-9 flex-1 rounded-lg border text-xs font-medium ${
                      on ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/15 bg-white"
                    }`}
                  >
                    {DAY_SHORT[d]}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => update(r.key, { days: p.days })}
                  className="rounded-full border border-black/15 bg-white px-2.5 py-1 text-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <label className="block">
                <span className="text-xs text-black/60">From</span>
                <select value={r.start_time} onChange={(e) => update(r.key, { start_time: e.target.value })} className={selectClass}>
                  {TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <span className="pb-2.5 text-black/40">–</span>
              <label className="block">
                <span className="text-xs text-black/60">To {overnight && <em className="not-italic text-amber-700">(next day)</em>}</span>
                <select value={r.end_time} onChange={(e) => update(r.key, { end_time: e.target.value })} className={selectClass}>
                  {TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs text-black/60">Original price per hour</span>
              <div className="relative mt-0.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50">HK$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={r.price_per_hour || ""}
                  onChange={(e) => update(r.key, { price_per_hour: Number(e.target.value) })}
                  placeholder="250"
                  className={`${selectClass} pl-12`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-black/40">/ hour</span>
              </div>
            </label>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() =>
          setRows((rs) => [
            ...rs,
            { key: Math.max(0, ...rs.map((x) => x.key)) + 1, days: [0, 6], start_time: "09:00", end_time: "18:00", price_per_hour: 0 },
          ])
        }
        className="w-full rounded-lg border border-dashed border-black/25 py-2.5 text-sm font-medium"
      >
        + Add another price
      </button>

      {/* Weekly preview */}
      <div className="rounded-xl border border-black/10 bg-white p-3">
        <p className="mb-2 text-sm font-semibold">Your week at a glance</p>
        <div className="space-y-1">
          {grid.map(({ day, blocks }) => (
            <div key={day} className="flex items-center gap-2">
              <span className="w-8 text-xs text-black/60">{DAY_SHORT[day]}</span>
              <div className="flex h-4 flex-1 overflow-hidden rounded bg-black/[0.06]">
                {blocks.map((p, b) => (
                  <div key={b} className="h-full flex-1" style={{ background: colorFor(p) }} title={p ? `HK$${p}/hr` : "No price"} />
                ))}
              </div>
            </div>
          ))}
          <div className="ml-10 flex justify-between text-[10px] text-black/40">
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
        </div>
        {prices.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {prices.map((p) => (
              <span key={p} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorFor(p) }} /> HK${p}/hr
              </span>
            ))}
            <span className="flex items-center gap-1 text-black/50">
              <span className="h-2.5 w-2.5 rounded-sm bg-black/[0.06]" /> no price (can&apos;t post)
            </span>
          </div>
        )}
      </div>

      {overlap && (
        <ErrorBox message={`Price ${overlap[0] + 1} and Price ${overlap[1] + 1} overlap. Each time can only have one price.`} />
      )}
      <ErrorBox message={result?.error} />
      <NoticeBox message={result?.ok} />
      <button
        type="button"
        disabled={saving || !!overlap}
        onClick={() =>
          startSaving(async () => {
            const res = await savePriceRules(
              venueId,
              rows.map(({ days, start_time, end_time, price_per_hour }) => ({ days, start_time, end_time, price_per_hour })),
            );
            setResult(res ?? undefined);
          })
        }
        className={buttonClass}
      >
        {saving ? "Saving…" : "Save price list"}
      </button>
    </div>
  );
}

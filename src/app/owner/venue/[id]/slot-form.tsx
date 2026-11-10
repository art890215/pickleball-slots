"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addSlot } from "./actions";
import { ErrorBox, NoticeBox, buttonClass, inputClass } from "@/components/ui";

type Court = { id: string; name: string };

const DURATIONS = [
  { label: "1 hr", minutes: 60 },
  { label: "1.5 hr", minutes: 90 },
  { label: "2 hr", minutes: 120 },
];

const START_TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 ? "30" : "00"}`;
});

function endTime(start: string, minutes: number) {
  const [h, m] = start.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// Price for a given % off, rounded to whole dollars but kept inside the 20–30% band.
function priceFor(normal: number, pct: number) {
  const exact = normal * (1 - pct / 100);
  if (pct === 20) return Math.floor(exact);
  if (pct === 30) return Math.ceil(exact);
  return Math.round(exact);
}

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-2 text-sm font-medium ${
    active ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/15 bg-white"
  }`;

export function SlotForm({
  venueId,
  date,
  dateLabel,
  courts,
  lastNormalPrice,
  suggestedStart,
}: {
  venueId: string;
  date: string;
  dateLabel: string;
  courts: Court[];
  lastNormalPrice: number | null;
  suggestedStart: string;
}) {
  const [state, action, pending] = useActionState(addSlot, undefined);
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [start, setStart] = useState(suggestedStart);
  const [duration, setDuration] = useState(60);
  const [normal, setNormal] = useState(lastNormalPrice ? String(lastNormalPrice) : "");
  const [discounted, setDiscounted] = useState(
    lastNormalPrice ? String(priceFor(lastNormalPrice, 25)) : "",
  );
  const formRef = useRef<HTMLFormElement>(null);

  // After a successful add, move the start time on so the next slot is one tap away.
  useEffect(() => {
    if (state?.ok) setStart((s) => endTime(s, duration));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const n = Number(normal);
  const d = Number(discounted);
  const pct = n > 0 && d > 0 ? (1 - d / n) * 100 : null;
  const inBand = pct !== null && pct >= 20 - 1e-9 && pct <= 30 + 1e-9;

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="venue_id" value={venueId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="court_id" value={courtId} />
      <input type="hidden" name="duration_minutes" value={duration} />

      <p className="text-sm text-black/60">
        Adding to <strong className="text-black">{dateLabel}</strong>
      </p>

      {courts.length > 1 && (
        <div>
          <p className="mb-1.5 text-sm font-medium">Court</p>
          <div className="flex flex-wrap gap-2">
            {courts.map((c) => (
              <button type="button" key={c.id} onClick={() => setCourtId(c.id)} className={chip(courtId === c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Start</span>
          <select name="start" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputClass} mt-1`}>
            {START_TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="text-sm font-medium">Ends</span>
          <p className="mt-1 rounded-lg bg-black/[0.04] px-3 py-2.5 text-base">
            {endTime(start, duration)}
            {endTime(start, duration) <= start && <span className="ml-1 text-xs text-black/50">next day</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {DURATIONS.map((x) => (
          <button type="button" key={x.minutes} onClick={() => setDuration(x.minutes)} className={chip(duration === x.minutes)}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Normal price</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50">HK$</span>
            <input
              name="normal_price"
              type="number"
              inputMode="numeric"
              min={1}
              value={normal}
              onChange={(e) => {
                setNormal(e.target.value);
                const v = Number(e.target.value);
                if (v > 0) setDiscounted(String(priceFor(v, 25)));
              }}
              className={`${inputClass} pl-12`}
              required
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Discounted price</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50">HK$</span>
            <input
              name="discounted_price"
              type="number"
              inputMode="numeric"
              min={1}
              value={discounted}
              onChange={(e) => setDiscounted(e.target.value)}
              className={`${inputClass} pl-12 ${pct !== null && !inBand ? "border-red-500" : ""}`}
              required
            />
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {[20, 25, 30].map((p) => (
            <button
              type="button"
              key={p}
              disabled={!(n > 0)}
              onClick={() => setDiscounted(String(priceFor(n, p)))}
              className="whitespace-nowrap rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              −{p}%
            </button>
          ))}
        </div>
        {pct !== null && (
          <span
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold ${
              inBand ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-800"
            }`}
          >
            {Number.isInteger(Math.round(pct * 10) / 10) ? pct.toFixed(0) : pct.toFixed(1)}% off{inBand ? " ✓" : ""}
          </span>
        )}
      </div>
      {pct !== null && !inBand && (
        <p className="text-sm text-red-700">The discount must be between 20% and 30%.</p>
      )}

      <ErrorBox message={state?.error} />
      <NoticeBox message={state?.ok} />
      <button disabled={pending || !inBand || !courtId} className={buttonClass}>
        {pending ? "Adding…" : "Add slot"}
      </button>
    </form>
  );
}

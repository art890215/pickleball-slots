"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { addSlot } from "./actions";
import { ErrorBox, NoticeBox, buttonClass, inputClass } from "@/components/ui";
import { DISCOUNT_RATES, discountedPrice, slotPrice, type PriceRule } from "@/lib/pricing";

type Court = { id: string; name: string };

const DURATIONS = [
  { label: "1 hr", minutes: 60 },
  { label: "1.5 hr", minutes: 90 },
  { label: "2 hr", minutes: 120 },
];

const START_TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);

function endTime(start: string, minutes: number) {
  const [h, m] = start.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-2 text-sm font-medium ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/15 bg-white"}`;

export function SlotForm({
  venueId,
  date,
  dateLabel,
  courts,
  rules,
  suggestedStart,
}: {
  venueId: string;
  date: string;
  dateLabel: string;
  courts: Court[];
  rules: PriceRule[];
  suggestedStart: string;
}) {
  const [state, action, pending] = useActionState(addSlot, undefined);
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [start, setStart] = useState(suggestedStart);
  const [duration, setDuration] = useState(60);
  const [rate, setRate] = useState<number | null>(null);
  const [override, setOverride] = useState<string | null>(null);

  // After a successful add, move the start time on so the next slot is one tap away.
  useEffect(() => {
    if (state?.ok) {
      setStart((s) => endTime(s, duration));
      setOverride(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const listPrice = slotPrice(rules, date, start, duration);
  const normal = override !== null ? Number(override) : listPrice;
  const discounted = normal && rate ? discountedPrice(normal, rate) : null;
  const ready = !!courtId && !!normal && normal > 0 && rate !== null;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="venue_id" value={venueId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="court_id" value={courtId} />
      <input type="hidden" name="duration_minutes" value={duration} />
      <input type="hidden" name="normal_price" value={normal ?? ""} />
      <input type="hidden" name="discount_rate" value={rate ?? ""} />

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
          <select value={start} onChange={(e) => { setStart(e.target.value); setOverride(null); }} name="start" className={`${inputClass} mt-1`}>
            {START_TIMES.map((t) => <option key={t}>{t}</option>)}
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
          <button type="button" key={x.minutes} onClick={() => { setDuration(x.minutes); setOverride(null); }} className={chip(duration === x.minutes)}>
            {x.label}
          </button>
        ))}
      </div>

      {/* Original price */}
      <div className="rounded-xl bg-black/[0.03] p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">Original price</span>
          {override === null ? (
            <span className="text-lg font-semibold">{listPrice !== null ? `HK$${listPrice}` : "—"}</span>
          ) : (
            <div className="relative w-32">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-black/50">HK$</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                autoFocus
                value={override}
                onChange={(e) => setOverride(e.target.value)}
                className="w-full rounded-lg border border-black/20 bg-white py-1.5 pl-10 pr-2 text-right text-base"
              />
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-black/60">
          {override !== null ? (
            <>Custom price for this slot only (e.g. a public holiday). </>
          ) : listPrice !== null ? (
            <>From your price list. </>
          ) : rules.length ? (
            <>This time isn&apos;t in your price list. </>
          ) : (
            <>You haven&apos;t set a price list yet. </>
          )}
          {override === null ? (
            <button type="button" onClick={() => setOverride(listPrice ? String(listPrice) : "")} className="text-emerald-700 underline">
              {listPrice !== null ? "Change for this slot" : "Enter a price"}
            </button>
          ) : (
            <button type="button" onClick={() => setOverride(null)} className="text-emerald-700 underline">
              Use price list
            </button>
          )}
          {!rules.length && (
            <>
              {" · "}
              <Link href={`/owner/venue/${venueId}/setup`} className="text-emerald-700 underline">Set up price list</Link>
            </>
          )}
        </p>
      </div>

      {/* Discount */}
      <div>
        <p className="mb-1.5 text-sm font-medium">Discount</p>
        <div className="grid grid-cols-5 gap-1.5">
          {DISCOUNT_RATES.map((r) => (
            <button type="button" key={r} onClick={() => setRate(r)} className={`${chip(rate === r)} px-0`} aria-pressed={rate === r}>
              {r}%
            </button>
          ))}
        </div>
      </div>

      {discounted !== null && normal && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <span className="text-sm text-emerald-900">Players pay</span>
          <span>
            <span className="text-xl font-bold text-emerald-900">HK${discounted}</span>{" "}
            <span className="text-sm text-black/40 line-through">HK${normal}</span>
          </span>
        </div>
      )}

      <ErrorBox message={state?.error} />
      <NoticeBox message={state?.ok} />
      <button disabled={pending || !ready} className={buttonClass}>
        {pending ? "Posting…" : !normal ? "Enter the original price" : rate === null ? "Choose a discount" : "Post slot"}
      </button>
    </form>
  );
}

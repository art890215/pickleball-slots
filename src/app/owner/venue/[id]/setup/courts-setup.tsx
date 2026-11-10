"use client";

import { useActionState, useState } from "react";
import { renameCourt, setCourtCount } from "./actions";
import { ErrorBox, NoticeBox, inputClass } from "@/components/ui";

function CourtName({ venueId, court }: { venueId: string; court: { id: string; name: string } }) {
  const [state, action, pending] = useActionState(renameCourt, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="venue_id" value={venueId} />
      <input type="hidden" name="court_id" value={court.id} />
      <div className="flex gap-2">
        <input name="name" defaultValue={court.name} aria-label="Court name" className={inputClass} />
        <button disabled={pending} className="shrink-0 rounded-lg border border-black/15 bg-white px-3 text-sm">
          {pending ? "…" : state?.ok ? "Saved ✓" : "Rename"}
        </button>
      </div>
      <ErrorBox message={state?.error} />
    </form>
  );
}

export function CourtsSetup({ venueId, courts }: { venueId: string; courts: { id: string; name: string }[] }) {
  const [count, setCount] = useState(Math.max(courts.length, 1));
  const [state, action, pending] = useActionState(setCourtCount, undefined);
  const changed = count !== courts.length;
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-2">
        <input type="hidden" name="venue_id" value={venueId} />
        <input type="hidden" name="count" value={count} />
        <p className="text-sm font-medium">How many courts does your venue have?</p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} className="h-11 w-11 rounded-lg border border-black/15 bg-white text-xl" aria-label="Fewer courts">−</button>
          <span className="w-10 text-center text-2xl font-semibold tabular-nums">{count}</span>
          <button type="button" onClick={() => setCount((c) => Math.min(30, c + 1))} className="h-11 w-11 rounded-lg border border-black/15 bg-white text-xl" aria-label="More courts">+</button>
          {changed && (
            <button disabled={pending} className="ml-auto rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white">
              {pending ? "Saving…" : "Save"}
            </button>
          )}
        </div>
        <ErrorBox message={state?.error} />
        {!changed && <NoticeBox message={state?.ok} />}
      </form>
      <div className="space-y-2">
        <p className="text-sm text-black/60">Court names (as players will see them):</p>
        {courts.map((c) => <CourtName key={c.id} venueId={venueId} court={c} />)}
      </div>
    </div>
  );
}

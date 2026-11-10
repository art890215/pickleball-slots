"use client";

import { useActionState } from "react";
import { addCourt, renameCourt } from "./actions";
import { ErrorBox, NoticeBox, inputClass } from "@/components/ui";

function RenameRow({ venueId, court }: { venueId: string; court: { id: string; name: string } }) {
  const [state, action, pending] = useActionState(renameCourt, undefined);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="venue_id" value={venueId} />
      <input type="hidden" name="court_id" value={court.id} />
      <div className="flex gap-2">
        <input name="name" defaultValue={court.name} className={inputClass} aria-label="Court name" />
        <button disabled={pending} className="shrink-0 rounded-lg border border-black/15 px-3 text-sm">
          {pending ? "…" : "Save"}
        </button>
      </div>
      <ErrorBox message={state?.error} />
    </form>
  );
}

export function CourtsPanel({ venueId, courts }: { venueId: string; courts: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addCourt, undefined);
  return (
    <div className="space-y-3">
      {courts.map((c) => (
        <RenameRow key={c.id} venueId={venueId} court={c} />
      ))}
      <form action={action} className="space-y-1 border-t border-black/10 pt-3">
        <input type="hidden" name="venue_id" value={venueId} />
        <div className="flex gap-2">
          <input name="name" placeholder={`Court ${courts.length + 1}`} className={inputClass} aria-label="New court name" />
          <button disabled={pending} className="shrink-0 rounded-lg bg-emerald-700 px-3 text-sm font-medium text-white">
            {pending ? "…" : "Add court"}
          </button>
        </div>
        <ErrorBox message={state?.error} />
        <NoticeBox message={state?.ok} />
      </form>
    </div>
  );
}

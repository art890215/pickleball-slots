"use client";

import { useFormStatus } from "react-dom";

export function CancelSlotButton({ booked }: { booked: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || booked}
      onClick={(e) => {
        if (!window.confirm("Cancel this slot? Players will no longer see it.")) e.preventDefault();
      }}
      className="rounded-lg border border-black/15 px-2.5 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
    >
      {pending ? "Cancelling…" : "Cancel slot"}
    </button>
  );
}

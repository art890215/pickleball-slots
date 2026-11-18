// Small shared building blocks so every form looks the same.

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-navy-900">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-navy-950/60">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-navy-900/20 bg-white px-3.5 py-3 text-base outline-none placeholder:text-navy-900/35 focus:border-navy-900 focus:ring-4 focus:ring-ball-400/50";

// Main action button: navy with a lime edge, like the ball on the logo.
export const buttonClass =
  "w-full rounded-xl bg-navy-900 px-4 py-3.5 font-display text-base font-bold text-ball-400 shadow-sm transition active:scale-[0.99] disabled:opacity-60";

export function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function NoticeBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>;
}

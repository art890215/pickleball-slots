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
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-black/60">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-black/20 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20";

export const buttonClass =
  "w-full rounded-lg bg-emerald-700 px-4 py-3 font-medium text-white disabled:opacity-60";

export function ErrorBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function NoticeBox({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>;
}

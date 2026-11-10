import Link from "next/link";

const STEPS = [
  { n: "1", title: "Pick a slot", text: "Spare court time at 20–40% off, all over Hong Kong." },
  { n: "2", title: "Pay the venue", text: "By FPS or PayMe within 1 hour, with your booking code." },
  { n: "3", title: "Play", text: "Show your booking code at the venue." },
];

export default function Home() {
  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 text-white">
        <p className="text-sm font-medium text-emerald-200">Hong Kong pickleball</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight">Play more for less.</h1>
        <p className="mt-2 text-emerald-50/90">Book empty court slots at private venues for 20–40% off.</p>
        <Link href="/slots" className="mt-5 block rounded-xl bg-white px-4 py-3 text-center font-semibold text-emerald-800">
          Find a discounted slot
        </Link>
        <Link href="/courts" className="mt-2 block text-center text-sm text-emerald-100 underline">
          or browse all courts
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-black/60">How it works</h2>
        {STEPS.map((s) => (
          <div key={s.n} className="flex gap-3 rounded-2xl border border-black/10 bg-white p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">{s.n}</span>
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-black/60">{s.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4">
        <h2 className="font-semibold">Own a court?</h2>
        <p className="mt-1 text-sm text-black/70">Fill empty court time. Post a slot in seconds; players pay you directly.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/owner/signup" className="rounded-lg bg-emerald-700 px-4 py-2.5 text-center text-sm font-medium text-white">List your venue</Link>
          <Link href="/owner/login" className="rounded-lg border border-black/15 px-4 py-2.5 text-center text-sm font-medium">Owner log in</Link>
        </div>
      </section>
    </main>
  );
}

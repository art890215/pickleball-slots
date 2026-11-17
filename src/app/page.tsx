import Image from "next/image";
import Link from "next/link";

const STEPS = [
  { n: "1", title: "Pick a slot", text: "Spare court time at 20–40% off, all over Hong Kong." },
  { n: "2", title: "Pay the venue", text: "By FPS or PayMe within 1 hour, with your booking code." },
  { n: "3", title: "Play", text: "Show your booking code at the venue." },
];

const FACTS = ["20–40% off", "FPS / PayMe", "Next 14 days"];

export default function Home() {
  return (
    <main className="space-y-7">
      <section className="on-dark relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 p-6 pb-7 text-white shadow-[0_18px_40px_-20px_rgba(0,19,42,0.7)]">
        {/* lime glow behind the logo */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-ball-400/25 blur-3xl" />

        <Image
          src="/brand/hkppt-mark-light.png"
          alt="HKPPT"
          width={150}
          height={57}
          priority
          className="relative h-[46px] w-auto"
        />

        <p className="relative mt-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-ball-400">Hong Kong pickleball</p>
        <h1 className="relative mt-1.5 font-display text-[2.6rem] font-black italic leading-[0.95] text-white">
          Play more.
          <br />
          <span className="text-ball-400">Pay less.</span>
        </h1>
        <p className="relative mt-3 max-w-[17rem] text-[15px] leading-snug text-white/80">
          Book empty court slots at private venues for 20–40% off.
        </p>

        <Link
          href="/slots"
          className="relative mt-6 flex items-center justify-center gap-2 rounded-xl bg-ball-400 px-4 py-3.5 text-center font-display text-base font-extrabold uppercase italic tracking-wide text-navy-900 shadow-[0_4px_0_0_rgba(0,0,0,0.35)] transition active:translate-y-[2px] active:shadow-none"
        >
          Find a discounted slot
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <Link href="/courts" className="relative mt-3 block text-center text-sm text-white/75 underline underline-offset-4">
          or browse all courts
        </Link>

        <ul className="relative mt-5 flex justify-center gap-1.5">
          {FACTS.map((f) => (
            <li key={f} className="whitespace-nowrap rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/85">
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2.5">
        <h2 className="section-label">
          How it works
        </h2>
        {STEPS.map((s) => (
          <div key={s.n} className="flex items-center gap-3.5 rounded-2xl border border-navy-900/10 bg-white p-3.5 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 font-display text-lg font-black italic text-ball-400">
              {s.n}
            </span>
            <div>
              <p className="font-semibold text-navy-900">{s.title}</p>
              <p className="text-sm text-navy-950/65">{s.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-navy-900/10 border-l-4 border-l-ball-400 bg-white p-4 shadow-sm">
        <h2 className="font-display text-lg font-extrabold uppercase italic text-navy-900">Own a court?</h2>
        <p className="mt-1 text-sm text-navy-950/70">Fill empty court time. Post a slot in seconds; players pay you directly.</p>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Link href="/owner/signup" className="rounded-xl bg-navy-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_3px_0_0_var(--color-ball-400)] transition active:translate-y-[2px] active:shadow-none">List your venue</Link>
          <Link href="/owner/login" className="rounded-xl border border-navy-900/25 px-4 py-3 text-center text-sm font-semibold text-navy-900">Owner log in</Link>
        </div>
      </section>
    </main>
  );
}

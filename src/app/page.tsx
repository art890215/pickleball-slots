import Link from "next/link";

const STEPS = [
  { n: "1", zh: "揀場", en: "Pick a slot", text: "Spare court time at 20–40% off, all over Hong Kong." },
  { n: "2", zh: "俾錢場地", en: "Pay the venue", text: "By FPS or PayMe within 1 hour, with your booking code." },
  { n: "3", zh: "開波", en: "Play", text: "Show your booking code at the venue." },
];

const FACTS = ["20–40% off 折", "FPS / PayMe", "14 日 Next 14 days"];

export default function Home() {
  return (
    <main className="space-y-5">
      {/* Full-width navy band, like the HKPPT site header */}
      <section className="on-dark -mx-4 -mt-5 bg-navy-950 px-4 pb-8 pt-8 text-center text-white">
        <p className="text-sm font-semibold tracking-[0.2em] text-ball-400">PICKLEBALL SLOTS HK</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-tight text-white">玩多啲，慳多啲</h1>
        <p className="mt-1 text-[15px] text-white/65">Play more. Pay less.</p>
      </section>

      {/* Lime banner, the main call to action */}
      <Link
        href="/slots"
        className="block rounded-2xl bg-ball-300 px-4 py-4 text-center text-navy-900 shadow-sm transition active:scale-[0.99]"
      >
        <span className="block text-lg font-bold">⚡ 搵折扣場 Find a discounted slot</span>
        <span className="mt-1 block text-sm font-medium">空置場地 20–40% 折</span>
        <span className="mt-1 block text-sm font-semibold">睇所有時段 See all slots →</span>
      </Link>

      <ul className="flex flex-wrap justify-center gap-2">
        {FACTS.map((f) => (
          <li key={f} className="whitespace-nowrap rounded-full border border-navy-900/15 bg-white px-3 py-1 text-xs font-semibold text-navy-900">
            {f}
          </li>
        ))}
      </ul>

      <section className="space-y-2.5">
        <h2 className="section-label">📋 使用方法 HOW IT WORKS</h2>
        {STEPS.map((s) => (
          <div key={s.n} className="flex items-center gap-3.5 rounded-2xl border border-navy-900/10 bg-white p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-base font-bold text-ball-400">{s.n}</span>
            <div>
              <p className="font-semibold text-navy-900">
                {s.zh} <span className="font-medium text-navy-900/70">{s.en}</span>
              </p>
              <p className="text-sm text-navy-950/65">{s.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Cream notice card with an orange edge, like the HKPPT deadline notice */}
      <section className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
        <h2 className="text-base font-bold text-amber-900">🏟️ 你係場主？ Own a court?</h2>
        <p className="mt-1 text-sm text-navy-950/75">
          將空置時段放上嚟，球友直接俾錢你。
          <span className="block text-navy-950/55">Fill empty court time. Post a slot in seconds; players pay you directly.</span>
        </p>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Link href="/owner/signup" className="rounded-xl bg-navy-900 px-3 py-3 text-center text-sm font-semibold text-ball-400 transition active:scale-[0.99]">
            <span className="block">＋ 登記場地</span><span className="block text-xs font-medium text-white/70">List your venue</span>
          </Link>
          <Link href="/owner/login" className="rounded-xl border border-navy-900/25 bg-white px-3 py-3 text-center text-sm font-semibold text-navy-900">
            <span className="block">場主登入</span><span className="block text-xs font-normal text-navy-900/55">Owner log in</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

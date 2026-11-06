import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight">
          Discounted pickleball courts across Hong Kong
        </h1>
        <p className="text-black/70">
          Venues post spare court time at 20–30% off. Book a slot in a few taps.
        </p>
      </section>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h2 className="font-medium">For players</h2>
        <p className="mt-1 text-sm text-black/70">Browsing and booking slots is coming soon.</p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h2 className="font-medium">For court owners</h2>
        <p className="mt-1 text-sm text-black/70">
          List your spare court time and fill empty slots.
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href="/owner/signup"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
          >
            Sign up
          </Link>
          <Link
            href="/owner/login"
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}

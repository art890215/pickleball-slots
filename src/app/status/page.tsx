import { createClient } from "@supabase/supabase-js";

// Always check live, never serve a cached result.
export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string };

async function runChecks(): Promise<Check[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const checks: Check[] = [];

  const urlOk = !!url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url.trim());
  checks.push({
    label: "Supabase URL is set in Vercel",
    ok: urlOk,
    detail: !url
      ? "NEXT_PUBLIC_SUPABASE_URL is missing."
      : urlOk
        ? url.trim()
        : "It is set, but doesn't look like https://xxxx.supabase.co",
  });

  const isSecret = !!key && (key.startsWith("sb_secret_") || key.includes("service_role"));
  const keyOk = !!key && !isSecret;
  checks.push({
    label: "Supabase public key is set in Vercel",
    ok: keyOk,
    detail: !key
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
      : isSecret
        ? "WARNING: this looks like the SECRET key. Replace it with the anon / publishable key."
        : `Set (starts with ${key.slice(0, 12)}…)`,
  });

  if (!urlOk || !keyOk) return checks;

  try {
    const supabase = createClient(url!.trim(), key!.trim());
    const { count, error } = await supabase
      .from("districts")
      .select("name", { count: "exact", head: true });
    if (error) {
      checks.push({
        label: "Website can reach the database",
        ok: false,
        detail: /does not exist|schema cache/i.test(error.message)
          ? "Connected, but the tables aren't installed yet. Run the SQL file in Supabase's SQL Editor."
          : `Error: ${error.message}`,
      });
    } else {
      checks.push({ label: "Website can reach the database", ok: true, detail: "Connected" });
      checks.push({
        label: "Database tables are installed",
        ok: count === 18,
        detail: `${count} of 18 Hong Kong districts found`,
      });
    }
  } catch (e) {
    checks.push({
      label: "Website can reach the database",
      ok: false,
      detail: `Error: ${(e as Error).message}`,
    });
  }
  return checks;
}

export default async function StatusPage() {
  const checks = await runChecks();
  const allOk = checks.every((c) => c.ok);
  return (
    <main className="mx-auto max-w-md p-4 font-sans">
      <h1 className="mb-1 text-xl font-semibold">Setup check</h1>
      <p className="mb-4 text-sm opacity-70">
        {allOk ? "Everything is connected." : "Something needs fixing; see the items below."}
      </p>
      <ul className="space-y-3">
        {checks.map((c) => (
          <li key={c.label} className="rounded-lg border p-3">
            <div className="font-medium">
              {c.ok ? "✅" : "❌"} {c.label}
            </div>
            <div className="mt-1 break-words text-sm opacity-80">{c.detail}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}

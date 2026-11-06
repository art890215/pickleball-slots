import { createClient } from "@supabase/supabase-js";

// Always check live, never serve a cached result.
export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string };

// Turn a low-level network error into a plain-language explanation.
function explainNetworkError(e: unknown): string {
  const err = e as Error & { cause?: { code?: string; message?: string } };
  const code = err.cause?.code ?? "";
  const raw = `${err.message}${err.cause?.message ? ` (${err.cause.message})` : ""}`;
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return `This Supabase address doesn't exist. The URL probably has a typo: compare it letter by letter with the Project URL in Supabase. [${raw}]`;
  }
  if (err.name === "TimeoutError") {
    return `The address exists but didn't answer within 10 seconds. Check whether the Supabase project is paused or still starting up.`;
  }
  if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "UND_ERR_CONNECT_TIMEOUT") {
    return `The address exists but didn't answer. Check whether the Supabase project is paused or still starting up. [${raw}]`;
  }
  return `Error: ${raw}`;
}

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

  // Plain connection test first, so we can say why it fails.
  try {
    await fetch(`${url!.trim().replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: key!.trim() },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    checks.push({ label: "Website can reach the database", ok: false, detail: explainNetworkError(e) });
    return checks;
  }

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
      detail: explainNetworkError(e),
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

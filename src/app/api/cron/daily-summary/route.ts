import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dailySummaryEmail, sendEmail, type SummaryRow } from "@/lib/email";
import { todayHK } from "@/lib/hk-time";

export const dynamic = "force-dynamic";

type Row = SummaryRow & { venue_id: string; venue_name: string; contact_email: string };

// Runs every morning (see vercel.json): emails each venue its slots for today.
// Vercel calls it with "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });

  const date = todayHK();
  const { data, error } = await supabase.rpc("daily_venue_summaries", { p_date: date });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byVenue = new Map<string, Row[]>();
  for (const r of (data ?? []) as Row[]) byVenue.set(r.venue_id, [...(byVenue.get(r.venue_id) ?? []), r]);

  const site = new URL(request.url).origin;
  for (const [venueId, rows] of byVenue) {
    const mail = dailySummaryEmail(rows[0].venue_name, date, rows, `${site}/owner/venue/${venueId}?date=${date}`);
    await sendEmail({ to: rows[0].contact_email, ...mail });
  }
  return NextResponse.json({ date, venues: byVenue.size });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// People land here after tapping the confirmation link in their email.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/owner";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/owner";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  // The email is confirmed even if the link was opened on another device,
  // so just ask them to log in.
  return NextResponse.redirect(`${origin}/owner/login?confirmed=1`);
}

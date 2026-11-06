import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase connection for pages and form actions that run on the server.
// It reads the visitor's login from cookies, so the database permissions apply.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a page render; the middleware refreshes cookies instead.
          }
        },
      },
    },
  );
}

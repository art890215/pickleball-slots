"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { logIn, signUp } from "@/app/owner/actions";
import { ErrorBox, Field, NoticeBox, buttonClass, inputClass } from "@/components/ui";

type Audience = "player" | "owner";

function withNext(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

function LoginInner({ audience }: { audience: Audience }) {
  const [state, action, pending] = useActionState(logIn, undefined);
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const signupPath = audience === "owner" ? "/owner/signup" : "/signup";
  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{audience === "owner" ? "Court owner log in" : "Log in"}</h1>
        {audience === "player" && next.startsWith("/slots/") && (
          <p className="mt-1 text-sm text-black/70">Log in to book this slot.</p>
        )}
      </div>
      <form action={action} className="space-y-4">
        {params.get("confirmed") && <NoticeBox message="Your email is confirmed. Please log in." />}
        <input type="hidden" name="next" value={next || (audience === "owner" ? "/owner" : "/bookings")} />
        <Field label="Email">
          <input name="email" type="email" autoComplete="email" required className={inputClass} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </Field>
        <ErrorBox message={state?.error} />
        <button disabled={pending} className={buttonClass}>{pending ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="text-center text-sm">
        New here?{" "}
        <Link href={withNext(signupPath, next || null)} className="font-medium text-emerald-700 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}

function SignUpInner({ audience }: { audience: Audience }) {
  const [state, action, pending] = useActionState(signUp, undefined);
  const next = useSearchParams().get("next") ?? "";
  const claiming = next.startsWith("/claim/");
  const loginPath = audience === "owner" ? "/owner/login" : "/login";
  const title = audience === "player" ? "Create your account" : claiming ? "Create your account" : "Court owner sign-up";
  const intro =
    audience === "player"
      ? "Book discounted court slots across Hong Kong."
      : claiming
        ? "Create an account, then confirm your venue's details to claim it."
        : "Create an account, then tell us about your venue. We'll review it before it goes live.";
  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-black/70">{intro}</p>
      </div>
      {state?.notice ? (
        <NoticeBox message={state.notice} />
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next || (audience === "owner" ? "/owner" : "/slots")} />
          <input type="hidden" name="ask_phone" value={audience === "player" ? "1" : "0"} />
          <Field label="Your name">
            <input name="full_name" autoComplete="name" required className={inputClass} />
          </Field>
          {audience === "player" && (
            <Field label="Mobile number" hint="Venues use this to contact you about your booking">
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="9123 4567" required className={inputClass} />
            </Field>
          )}
          <Field label="Email" hint={audience === "player" ? "Booking codes are sent here" : undefined}>
            <input name="email" type="email" autoComplete="email" required className={inputClass} />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
          </Field>
          <ErrorBox message={state?.error} />
          <button disabled={pending} className={buttonClass}>{pending ? "Creating account…" : "Create account"}</button>
        </form>
      )}
      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href={withNext(loginPath, next || null)} className="font-medium text-emerald-700 underline">Log in</Link>
      </p>
    </main>
  );
}

export function LoginForm({ audience }: { audience: Audience }) {
  return <Suspense><LoginInner audience={audience} /></Suspense>;
}
export function SignUpForm({ audience }: { audience: Audience }) {
  return <Suspense><SignUpInner audience={audience} /></Suspense>;
}

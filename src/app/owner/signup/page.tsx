"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { signUp } from "../actions";
import { ErrorBox, Field, NoticeBox, buttonClass, inputClass } from "@/components/ui";

function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  const next = useSearchParams().get("next") ?? "";
  const claiming = next.startsWith("/claim/");
  const loginHref = next ? `/owner/login?next=${encodeURIComponent(next)}` : "/owner/login";

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">
          {claiming ? "Create your account" : "Court owner sign-up"}
        </h1>
        <p className="mt-1 text-sm text-black/70">
          {claiming
            ? "Create an account, then confirm your venue's details to claim it."
            : "Create an account, then tell us about your venue. We'll review it before it goes live."}
        </p>
      </div>

      {state?.notice ? (
        <NoticeBox message={state.notice} />
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Your name">
            <input name="full_name" autoComplete="name" required className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" autoComplete="email" required className={inputClass} />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
            />
          </Field>
          <ErrorBox message={state?.error} />
          <button disabled={pending} className={buttonClass}>
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-emerald-700 underline">
          Log in
        </Link>
      </p>
    </>
  );
}

export default function OwnerSignUpPage() {
  return (
    <main className="space-y-5">
      <Suspense>
        <SignUpForm />
      </Suspense>
    </main>
  );
}

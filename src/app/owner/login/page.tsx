"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { logIn } from "../actions";
import { ErrorBox, Field, NoticeBox, buttonClass, inputClass } from "@/components/ui";

function LoginForm() {
  const [state, action, pending] = useActionState(logIn, undefined);
  const params = useSearchParams();
  const confirmed = params.get("confirmed");
  const next = params.get("next") ?? "";

  return (
    <form action={action} className="space-y-4">
      {confirmed && <NoticeBox message="Your email is confirmed. Please log in." />}
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      <Field label="Password">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <ErrorBox message={state?.error} />
      <button disabled={pending} className={buttonClass}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

function SignUpLink() {
  const next = useSearchParams().get("next");
  const href = next ? `/owner/signup?next=${encodeURIComponent(next)}` : "/owner/signup";
  return (
    <p className="text-center text-sm">
      New here?{" "}
      <Link href={href} className="font-medium text-emerald-700 underline">
        Create an account
      </Link>
    </p>
  );
}

export default function OwnerLoginPage() {
  return (
    <main className="space-y-5">
      <h1 className="text-xl font-semibold">Court owner log in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <Suspense>
        <SignUpLink />
      </Suspense>
    </main>
  );
}

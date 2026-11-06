"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../actions";
import { ErrorBox, Field, NoticeBox, buttonClass, inputClass } from "@/components/ui";

export default function OwnerSignUpPage() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Court owner sign-up</h1>
        <p className="mt-1 text-sm text-black/70">
          Create an account, then tell us about your venue. We&apos;ll review it before it goes live.
        </p>
      </div>

      {state?.notice ? (
        <NoticeBox message={state.notice} />
      ) : (
        <form action={action} className="space-y-4">
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
        <Link href="/owner/login" className="font-medium text-emerald-700 underline">
          Log in
        </Link>
      </p>
    </main>
  );
}

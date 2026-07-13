"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  async function continueWithGoogle() {
    setOauthBusy(true);
    setOauthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/closet`,
      },
    });
    if (error) {
      setOauthBusy(false);
      setOauthError(error.message);
    }
    // On success the browser redirects to Google.
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "sign-in" ? "Welcome back" : "Create your closet"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "sign-in"
            ? "Sign in to your Capsule wardrobe."
            : "Start cataloging your wardrobe in minutes."}
        </p>
      </div>

      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={oauthBusy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
          />
        </svg>
        {oauthBusy ? "Redirecting…" : "Continue with Google"}
      </button>

      {oauthError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {oauthError}
        </p>
      )}

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
        {mode === "sign-up" && (
          <Field
            label="Name"
            name="display_name"
            type="text"
            placeholder="Alex"
            autoComplete="name"
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
        />

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? "Please wait…"
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <Link href="/sign-up" className="font-medium text-foreground underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-foreground underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent"
      />
    </label>
  );
}

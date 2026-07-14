import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { signPaths } from "@/lib/images";
import { signOut } from "@/app/actions/auth";
import type { StyleProfile } from "@/lib/fit";
import { StyleProfileForm } from "@/components/StyleProfileForm";
import { CompressImages } from "@/components/CompressImages";

export default async function ProfilePage() {
  const supabase = await createClient();
  const [user, { data }] = await Promise.all([
    getCurrentUser(),
    supabase.from("style_profiles").select("*").maybeSingle(),
  ]);

  const profile = (data as StyleProfile | null) ?? null;
  const photoUrl = profile?.photo_path
    ? (await signPaths(supabase, [profile.photo_path]))[profile.photo_path]
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your fit profile
          </h1>
          <p className="text-sm text-muted">
            Tell the stylist about your body and preferences, so suggestions
            flatter you. Everything here is private to your account.
          </p>
        </div>
        <Link
          href="/tryons"
          className="shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-black/5"
        >
          🪞 My try-ons
        </Link>
      </div>

      <StyleProfileForm initialProfile={profile} initialPhotoUrl={photoUrl} />

      <section className="border-t border-border pt-6">
        <CompressImages />
      </section>

      <section className="border-t border-border pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.email}</p>
            <p className="text-xs text-muted">Signed in</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

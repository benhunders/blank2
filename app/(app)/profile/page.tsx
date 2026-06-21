import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import type { StyleProfile } from "@/lib/fit";
import { StyleProfileForm } from "@/components/StyleProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("style_profiles")
    .select("*")
    .maybeSingle();

  const profile = (data as StyleProfile | null) ?? null;
  const photoUrl = profile?.photo_path
    ? (await signPaths(supabase, [profile.photo_path]))[profile.photo_path]
    : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your fit profile</h1>
        <p className="text-sm text-muted">
          Tell the stylist about your body and preferences, so suggestions
          flatter you. Everything here is private to your account.
        </p>
      </div>
      <StyleProfileForm initialProfile={profile} initialPhotoUrl={photoUrl} />
    </div>
  );
}

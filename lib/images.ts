import type { SupabaseClient } from "@supabase/supabase-js";

export const WARDROBE_BUCKET = "wardrobe";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

/**
 * Batch-generate signed URLs for private storage paths. Returns a map of
 * path -> signed URL. Empty/null paths are skipped.
 */
export async function signPaths(
  supabase: SupabaseClient,
  paths: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const clean = [...new Set(paths.filter((p): p is string => !!p))];
  if (clean.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .createSignedUrls(clean, SIGNED_URL_TTL);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const entry of data) {
    if (entry.signedUrl && entry.path) map[entry.path] = entry.signedUrl;
  }
  return map;
}

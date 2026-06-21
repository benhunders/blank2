import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { signPaths } from "@/lib/images";
import { categoryLabel } from "@/lib/constants";
import type { BoardItem } from "@/lib/outfits";

// Loads all of the current user's closet items as BoardItems (with signed
// image URLs) for the outfit builder and AI stylist.
export async function loadBoardItems(
  supabase: SupabaseClient,
): Promise<BoardItem[]> {
  const { data } = await supabase
    .from("items")
    .select("id,image_url,brand,subcategory,category")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const urls = await signPaths(
    supabase,
    rows.map((r) => r.image_url),
  );

  return rows.map((r) => ({
    id: r.id,
    imageUrl: r.image_url ? urls[r.image_url] : undefined,
    label: r.brand || r.subcategory || categoryLabel(r.category),
    category: r.category,
  }));
}

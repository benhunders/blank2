import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isBoardLayout, type BoardPlacement } from "./outfits";

export interface OutfitSummary {
  id: string;
  name: string;
  tags: string[];
  placements: BoardPlacement[];
}

// Loads the user's outfits with their board placements. Item images are
// resolved separately from a shared closet item map (board_layout already
// references item ids), so no per-outfit image join is needed.
export async function loadOutfits(
  supabase: SupabaseClient,
): Promise<OutfitSummary[]> {
  const { data } = await supabase
    .from("outfits")
    .select("id,name,tags,board_layout")
    .order("created_at", { ascending: false });

  return (data ?? []).map((o) => ({
    id: o.id as string,
    name: o.name as string,
    tags: (o.tags as string[]) ?? [],
    placements: isBoardLayout(o.board_layout) ? o.board_layout.items : [],
  }));
}

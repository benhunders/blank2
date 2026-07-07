import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { loadBoardItems } from "@/lib/board-items";
import { loadOutfits } from "@/lib/load-outfits";
import { isBoardLayout, type BoardPlacement } from "@/lib/outfits";
import { CalendarView, type WearEntry } from "@/components/CalendarView";
import { Segments } from "@/components/Segments";

type WearRow = {
  id: string;
  worn_on: string;
  notes: string | null;
  item_id: string | null;
  outfit_id: string | null;
  items: { image_url: string | null } | null;
  outfits: { name: string; board_layout: unknown } | null;
};

export default async function CalendarPage() {
  const supabase = await createClient();

  const [{ data: wearData }, items, outfits] = await Promise.all([
    supabase
      .from("wears")
      .select(
        "id,worn_on,notes,item_id,outfit_id, items(image_url), outfits(name,board_layout)",
      )
      .order("worn_on", { ascending: false }),
    loadBoardItems(supabase),
    loadOutfits(supabase),
  ]);

  const rows = (wearData ?? []) as unknown as WearRow[];
  const urls = await signPaths(
    supabase,
    rows.map((r) => r.items?.image_url),
  );

  const wears: WearEntry[] = rows.map((r) => ({
    id: r.id,
    wornOn: r.worn_on,
    notes: r.notes,
    itemId: r.item_id,
    outfitId: r.outfit_id,
    itemImageUrl: r.items?.image_url ? urls[r.items.image_url] : undefined,
    outfitName: r.outfits?.name,
    outfitPlacements:
      r.outfits && isBoardLayout(r.outfits.board_layout)
        ? r.outfits.board_layout.items
        : ([] as BoardPlacement[]),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Segments
          items={[
            { href: "/calendar", label: "Calendar" },
            { href: "/insights", label: "Insights" },
          ]}
        />
        <p className="mt-2 text-sm text-muted">
          Log what you wear to track your real rotation.
        </p>
      </div>
      <CalendarView wears={wears} allItems={items} allOutfits={outfits} />
    </div>
  );
}

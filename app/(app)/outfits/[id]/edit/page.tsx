import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadBoardItems } from "@/lib/board-items";
import { isBoardLayout, type BoardPlacement } from "@/lib/outfits";
import { OutfitBuilder } from "@/components/OutfitBuilder";

export default async function EditOutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: outfit } = await supabase
    .from("outfits")
    .select("id,name,tags,board_layout")
    .eq("id", id)
    .maybeSingle();

  if (!outfit) notFound();

  const items = await loadBoardItems(supabase);
  const layout = isBoardLayout(outfit.board_layout)
    ? outfit.board_layout
    : { items: [] as BoardPlacement[] };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/outfits/${id}`}
          className="text-sm text-muted hover:text-foreground"
        >
          ← Back to outfit
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Edit outfit
        </h1>
      </div>
      <OutfitBuilder
        items={items}
        existing={{
          id: outfit.id,
          name: outfit.name,
          tags: outfit.tags,
          placements: layout.items,
        }}
      />
    </div>
  );
}

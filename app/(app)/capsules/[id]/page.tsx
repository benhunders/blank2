import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadBoardItems } from "@/lib/board-items";
import { loadOutfits } from "@/lib/load-outfits";
import { CapsuleDetail } from "@/components/CapsuleDetail";

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("id,name,type,start_date,end_date")
    .eq("id", id)
    .maybeSingle();

  if (!collection) notFound();

  const [{ data: ci }, { data: co }, items, outfits] = await Promise.all([
    supabase.from("collection_items").select("item_id").eq("collection_id", id),
    supabase
      .from("collection_outfits")
      .select("outfit_id")
      .eq("collection_id", id),
    loadBoardItems(supabase),
    loadOutfits(supabase),
  ]);

  return (
    <CapsuleDetail
      collection={collection}
      allItems={items}
      allOutfits={outfits}
      initialItemIds={(ci ?? []).map((r) => r.item_id as string)}
      initialOutfitIds={(co ?? []).map((r) => r.outfit_id as string)}
    />
  );
}

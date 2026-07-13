import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { categoryLabel } from "@/lib/constants";
import { isBoardLayout, type BoardItem, type BoardPlacement } from "@/lib/outfits";
import { OutfitBoard } from "@/components/OutfitBoard";
import { OutfitActions } from "@/components/OutfitActions";

type ItemRow = {
  id: string;
  image_url: string | null;
  brand: string | null;
  subcategory: string | null;
  category: string;
};

export default async function OutfitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("outfits")
    .select(
      "id,name,tags,board_layout, outfit_items(items(id,image_url,brand,subcategory,category))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const items = (data.outfit_items as unknown as { items: ItemRow | null }[])
    .map((oi) => oi.items)
    .filter((i): i is ItemRow => !!i);

  const urls = await signPaths(
    supabase,
    items.map((i) => i.image_url),
  );

  const map = new Map<string, BoardItem>(
    items.map((i) => [
      i.id,
      {
        id: i.id,
        imageUrl: i.image_url ? urls[i.image_url] : undefined,
        label: i.brand || i.subcategory || categoryLabel(i.category),
        category: i.category,
      },
    ]),
  );

  const layout = isBoardLayout(data.board_layout)
    ? data.board_layout
    : { items: [] as BoardPlacement[] };

  return (
    <div className="space-y-6">
      <Link href="/outfits" className="text-sm text-muted hover:text-foreground">
        ← Back to outfits
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <OutfitBoard placements={layout.items} itemsById={map} />

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
            {data.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.tags.map((t: string) => (
                  <span
                    key={t}
                    className="rounded-full bg-black/5 px-2.5 py-1 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              {items.length} {items.length === 1 ? "piece" : "pieces"}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {items.map((i) => (
                <Link
                  key={i.id}
                  href={`/closet/${i.id}`}
                  className="bg-checker aspect-square overflow-hidden rounded-xl border border-border"
                >
                  {i.image_url && urls[i.image_url] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[i.image_url]}
                      alt={i.brand ?? categoryLabel(i.category)}
                      className="h-full w-full object-contain p-1"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <OutfitActions outfitId={data.id} />
        </div>
      </div>
    </div>
  );
}

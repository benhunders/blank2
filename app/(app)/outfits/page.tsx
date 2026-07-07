import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { categoryLabel } from "@/lib/constants";
import { isBoardLayout, type BoardItem, type BoardPlacement } from "@/lib/outfits";
import { OutfitBoard } from "@/components/OutfitBoard";
import { Segments } from "@/components/Segments";

type ItemRow = {
  id: string;
  image_url: string | null;
  brand: string | null;
  subcategory: string | null;
  category: string;
};
type OutfitRow = {
  id: string;
  name: string;
  tags: string[];
  board_layout: unknown;
  outfit_items: { items: ItemRow | null }[];
};

function toBoardItem(row: ItemRow, url?: string): BoardItem {
  return {
    id: row.id,
    imageUrl: url,
    label: row.brand || row.subcategory || categoryLabel(row.category),
    category: row.category,
  };
}

export default async function OutfitsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("outfits")
    .select(
      "id,name,tags,board_layout, outfit_items(items(id,image_url,brand,subcategory,category))",
    )
    .order("created_at", { ascending: false });

  const outfits = (data ?? []) as unknown as OutfitRow[];

  const allPaths = outfits.flatMap((o) =>
    o.outfit_items.map((oi) => oi.items?.image_url),
  );
  const urls = await signPaths(supabase, allPaths);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Segments
            items={[
              { href: "/outfits", label: "Outfits" },
              { href: "/capsules", label: "Capsules" },
            ]}
          />
          <p className="mt-2 text-sm text-muted">
            {outfits.length} {outfits.length === 1 ? "outfit" : "outfits"}
          </p>
        </div>
        <Link
          href="/outfits/new"
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New outfit
        </Link>
      </div>

      {outfits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-4xl">👗</p>
          <h2 className="mt-3 font-medium">No outfits yet</h2>
          <p className="mt-1 text-sm text-muted">
            Combine pieces from your closet into looks.
          </p>
          <Link
            href="/outfits/new"
            className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            + New outfit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {outfits.map((o) => {
            const layout = isBoardLayout(o.board_layout)
              ? o.board_layout
              : { items: [] as BoardPlacement[] };
            const map = new Map<string, BoardItem>();
            for (const oi of o.outfit_items) {
              if (oi.items)
                map.set(
                  oi.items.id,
                  toBoardItem(oi.items, urls[oi.items.image_url ?? ""]),
                );
            }
            return (
              <Link key={o.id} href={`/outfits/${o.id}`} className="group block">
                <OutfitBoard
                  placements={layout.items}
                  itemsById={map}
                  className="transition group-hover:shadow-md"
                />
                <p className="mt-2 truncate text-sm font-medium">{o.name}</p>
                {o.tags.length > 0 && (
                  <p className="truncate text-xs text-muted">
                    {o.tags.join(" · ")}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

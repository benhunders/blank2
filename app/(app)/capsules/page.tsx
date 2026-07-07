import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { collectionTypeEmoji, collectionTypeLabel } from "@/lib/collections";
import { formatDay } from "@/lib/dates";
import { Segments } from "@/components/Segments";

type Row = {
  id: string;
  name: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  collection_items: { items: { image_url: string | null } | null }[];
  collection_outfits: { outfit_id: string }[];
};

function dateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${formatDay(start)} – ${formatDay(end)}`;
  return formatDay((start ?? end)!);
}

export default async function CapsulesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select(
      "id,name,type,start_date,end_date, collection_items(items(image_url)), collection_outfits(outfit_id)",
    )
    .order("created_at", { ascending: false });

  const collections = (data ?? []) as unknown as Row[];
  const allPaths = collections.flatMap((c) =>
    c.collection_items.map((ci) => ci.items?.image_url),
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
            Curated mini-wardrobes and trip packing lists
          </p>
        </div>
        <Link
          href="/capsules/new"
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + New
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-4xl">🧳</p>
          <h2 className="mt-3 font-medium">No capsules yet</h2>
          <p className="mt-1 text-sm text-muted">
            Group pieces into a capsule wardrobe or a packing list for a trip.
          </p>
          <Link
            href="/capsules/new"
            className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            + New capsule
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => {
            const covers = c.collection_items
              .map((ci) => ci.items?.image_url)
              .filter((p): p is string => !!p && !!urls[p])
              .slice(0, 4);
            const range = dateRange(c.start_date, c.end_date);
            return (
              <Link
                key={c.id}
                href={`/capsules/${c.id}`}
                className="group block rounded-2xl border border-border bg-card p-3 transition hover:shadow-md"
              >
                <div className="bg-checker grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
                  {covers.length > 0 ? (
                    covers.map((p, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={urls[p]}
                        alt=""
                        className="aspect-square w-full object-contain p-1"
                      />
                    ))
                  ) : (
                    <div className="col-span-2 flex aspect-[2/1] items-center justify-center text-3xl">
                      {collectionTypeEmoji(c.type)}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="truncate font-medium">{c.name}</p>
                  <span className="shrink-0 rounded-full bg-border/60 px-2 py-0.5 text-[11px] text-muted">
                    {collectionTypeLabel(c.type)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {c.collection_items.length} pieces
                  {c.collection_outfits.length > 0 &&
                    ` · ${c.collection_outfits.length} outfits`}
                  {range && ` · ${range}`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

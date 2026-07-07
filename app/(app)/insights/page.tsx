import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { Segments } from "@/components/Segments";

type ItemRow = {
  id: string;
  image_url: string | null;
  category: string;
  brand: string | null;
  subcategory: string | null;
  price: number | null;
  wear_count: number;
};

function num(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function itemLabel(i: ItemRow): string {
  return i.brand || i.subcategory || categoryLabel(i.category);
}

export default async function InsightsPage() {
  const supabase = await createClient();

  const [{ data: itemData }, { count: wearCount }, { count: outfitCount }] =
    await Promise.all([
      supabase
        .from("items")
        .select("id,image_url,category,brand,subcategory,price,wear_count"),
      supabase.from("wears").select("id", { count: "exact", head: true }),
      supabase.from("outfits").select("id", { count: "exact", head: true }),
    ]);

  const items = (itemData ?? []) as ItemRow[];
  const urls = await signPaths(
    supabase,
    items.map((i) => i.image_url),
  );

  const totalValue = items.reduce((s, i) => s + (i.price ?? 0), 0);
  const totalWears = items.reduce((s, i) => s + i.wear_count, 0);

  const priced = items.filter((i) => (i.price ?? 0) > 0);
  const cpw = (i: ItemRow) =>
    i.wear_count > 0 ? (i.price as number) / i.wear_count : null;

  const bestValue = priced
    .filter((i) => i.wear_count > 0)
    .sort((a, b) => (cpw(a)! - cpw(b)!))
    .slice(0, 5);

  const orphans = items
    .filter((i) => i.wear_count === 0)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, 5);

  const mostWorn = [...items]
    .filter((i) => i.wear_count > 0)
    .sort((a, b) => b.wear_count - a.wear_count)
    .slice(0, 5);

  const byCategory = CATEGORIES.map((c) => ({
    label: c.label,
    count: items.filter((i) => i.category === c.value).length,
  })).filter((c) => c.count > 0);
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  function Thumb({ i }: { i: ItemRow }) {
    return (
      <div className="bg-checker h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
        {i.image_url && urls[i.image_url] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urls[i.image_url]}
            alt=""
            className="h-full w-full object-contain p-0.5"
          />
        )}
      </div>
    );
  }

  function ItemRowLine({ i, right }: { i: ItemRow; right: string }) {
    return (
      <Link
        href={`/closet/${i.id}`}
        className="flex items-center gap-3 rounded-xl p-2 hover:bg-border/30"
      >
        <Thumb i={i} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{itemLabel(i)}</p>
          <p className="text-xs text-muted">{categoryLabel(i.category)}</p>
        </div>
        <span className="shrink-0 text-sm font-medium">{right}</span>
      </Link>
    );
  }

  const segments = (
    <Segments
      items={[
        { href: "/calendar", label: "Calendar" },
        { href: "/insights", label: "Insights" },
      ]}
    />
  );

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        {segments}
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-4xl">📊</p>
          <h2 className="mt-3 font-medium">Nothing to measure yet</h2>
          <p className="mt-1 text-sm text-muted">
            Add pieces and log wears to see cost-per-wear and more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        {segments}
        <p className="mt-2 text-sm text-muted">
          How your wardrobe actually gets used
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pieces" value={num(items.length)} />
        <Stat label="Outfits" value={num(outfitCount ?? 0)} />
        <Stat label="Total wears" value={num(wearCount ?? totalWears)} />
        <Stat label="Wardrobe value" value={num(totalValue)} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {mostWorn.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 font-medium">Most worn</h2>
            <div className="space-y-1">
              {mostWorn.map((i) => (
                <ItemRowLine
                  key={i.id}
                  i={i}
                  right={`${i.wear_count}×`}
                />
              ))}
            </div>
          </section>
        )}

        {bestValue.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-1 font-medium">Best value</h2>
            <p className="mb-2 text-xs text-muted">Lowest cost per wear</p>
            <div className="space-y-1">
              {bestValue.map((i) => (
                <ItemRowLine
                  key={i.id}
                  i={i}
                  right={`${num(cpw(i)!)}/wear`}
                />
              ))}
            </div>
          </section>
        )}

        {orphans.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-1 font-medium">Needs love</h2>
            <p className="mb-2 text-xs text-muted">Owned but never worn</p>
            <div className="space-y-1">
              {orphans.map((i) => (
                <ItemRowLine
                  key={i.id}
                  i={i}
                  right={i.price ? num(i.price) : "—"}
                />
              ))}
            </div>
          </section>
        )}

        {byCategory.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 font-medium">By category</h2>
            <div className="space-y-2">
              {byCategory.map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm text-muted">
                    {c.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/50">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(c.count / maxCat) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-sm">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

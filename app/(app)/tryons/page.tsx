import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { categoryLabel } from "@/lib/constants";
import { PROVIDERS, type TryOnProviderId } from "@/lib/tryon/types";
import { DeleteTryOnButton } from "@/components/DeleteTryOnButton";

type Row = {
  id: string;
  provider: string;
  created_at: string;
  result_path: string;
  item_id: string | null;
  outfit_id: string | null;
  items: { brand: string | null; subcategory: string | null; category: string } | null;
  outfits: { name: string } | null;
};

function providerLabel(id: string): string {
  return PROVIDERS[id as TryOnProviderId]?.label ?? id;
}

export default async function TryOnsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tryon_results")
    .select(
      "id,provider,created_at,result_path,item_id,outfit_id, items(brand,subcategory,category), outfits(name)",
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const urls = await signPaths(
    supabase,
    rows.map((r) => r.result_path),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/profile" className="text-sm text-muted hover:text-foreground">
          ← Back to profile
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">My try-ons</h1>
        <p className="text-sm text-muted">
          Every look you&apos;ve rendered on your photo. Illustrative styling —
          not a guarantee of size or exact fit.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-4xl">🪞</p>
          <h2 className="mt-3 font-medium">No try-ons yet</h2>
          <p className="mt-1 text-sm text-muted">
            Open a top, bottom, dress, or outfit and tap &ldquo;Try it on
            me&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((r) => {
            const sourceHref = r.outfit_id
              ? `/outfits/${r.outfit_id}`
              : r.item_id
                ? `/closet/${r.item_id}`
                : null;
            const sourceLabel = r.outfits?.name
              ? r.outfits.name
              : r.items
                ? r.items.brand ||
                  r.items.subcategory ||
                  categoryLabel(r.items.category)
                : "Deleted piece";
            return (
              <div key={r.id} className="group relative">
                <div className="bg-checker overflow-hidden rounded-2xl border border-border">
                  {urls[r.result_path] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={urls[r.result_path]}
                      alt={`Try-on: ${sourceLabel}`}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  )}
                </div>
                <DeleteTryOnButton id={r.id} resultPath={r.result_path} />
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {sourceHref ? (
                      <Link
                        href={sourceHref}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {sourceLabel}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">{sourceLabel}</p>
                    )}
                    <p className="text-xs text-muted">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {providerLabel(r.provider)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

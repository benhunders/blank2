import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { ClosetFilters } from "@/components/ClosetFilters";
import { ItemCard } from "@/components/ItemCard";
import type { Item } from "@/lib/types";

type SearchParams = {
  category?: string;
  q?: string;
  sort?: string;
};

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { category, q, sort } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("items").select("*");
  if (category) query = query.eq("category", category);
  if (q) {
    // Strip characters that are syntax in a PostgREST .or() filter string
    // (comma, parens, dots) so free-text search can't corrupt the query.
    const safe = q.replace(/[,().]/g, " ").trim();
    if (safe) {
      query = query.or(
        `brand.ilike.%${safe}%,subcategory.ilike.%${safe}%,color.ilike.%${safe}%,notes.ilike.%${safe}%`,
      );
    }
  }

  if (sort === "wears") query = query.order("wear_count", { ascending: false });
  else if (sort === "price")
    query = query.order("price", { ascending: false, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  const { data: items } = await query;
  const list = (items ?? []) as Item[];

  const urls = await signPaths(
    supabase,
    list.map((i) => i.image_url),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Closet</h1>
          <p className="text-sm text-muted">
            {list.length} {list.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <Link
          href="/closet/new"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Add item
        </Link>
      </div>

      <ClosetFilters />

      {list.length === 0 ? (
        <EmptyState hasFilters={!!(category || q)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {list.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              imageUrl={item.image_url ? urls[item.image_url] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
      <p className="text-4xl">🧺</p>
      <h2 className="mt-3 font-medium">
        {hasFilters ? "No matching pieces" : "Your closet is empty"}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {hasFilters
          ? "Try clearing your filters."
          : "Add your first piece to get started."}
      </p>
      {!hasFilters && (
        <Link
          href="/closet/new"
          className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Add item
        </Link>
      )}
    </div>
  );
}

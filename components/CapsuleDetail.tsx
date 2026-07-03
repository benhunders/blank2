"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel } from "@/lib/constants";
import { collectionTypeLabel } from "@/lib/collections";
import { formatDay } from "@/lib/dates";
import { OutfitBoard } from "@/components/OutfitBoard";
import type { BoardItem } from "@/lib/outfits";
import type { OutfitSummary } from "@/lib/load-outfits";

interface CollectionMeta {
  id: string;
  name: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
}

export function CapsuleDetail({
  collection,
  allItems,
  allOutfits,
  initialItemIds,
  initialOutfitIds,
}: {
  collection: CollectionMeta;
  allItems: BoardItem[];
  allOutfits: OutfitSummary[];
  initialItemIds: string[];
  initialOutfitIds: string[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const isPacking = collection.type === "packing_list";

  const itemsById = useMemo(
    () => new Map(allItems.map((i) => [i.id, i])),
    [allItems],
  );

  const [itemIds, setItemIds] = useState<string[]>(initialItemIds);
  const [outfitIds, setOutfitIds] = useState<string[]>(initialOutfitIds);
  const [pickItems, setPickItems] = useState(false);
  const [pickOutfits, setPickOutfits] = useState(false);
  const [packed, setPacked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const packedKey = `capsule-packed-${collection.id}`;

  useEffect(() => {
    if (!isPacking) return;
    try {
      const raw = localStorage.getItem(packedKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPacked(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, [isPacking, packedKey]);

  function persistPacked(next: Set<string>) {
    setPacked(next);
    try {
      localStorage.setItem(packedKey, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  }

  function togglePacked(itemId: string) {
    const next = new Set(packed);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    persistPacked(next);
  }

  async function addItem(itemId: string) {
    setItemIds((prev) => [...prev, itemId]);
    const { error: e } = await supabase
      .from("collection_items")
      .insert({ collection_id: collection.id, item_id: itemId });
    if (e) {
      setItemIds((prev) => prev.filter((id) => id !== itemId));
      setError(e.message);
    }
  }

  async function removeItem(itemId: string) {
    setItemIds((prev) => prev.filter((id) => id !== itemId));
    await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collection.id)
      .eq("item_id", itemId);
  }

  async function addOutfit(outfitId: string) {
    setOutfitIds((prev) => [...prev, outfitId]);
    const { error: e } = await supabase
      .from("collection_outfits")
      .insert({ collection_id: collection.id, outfit_id: outfitId });
    if (e) {
      setOutfitIds((prev) => prev.filter((id) => id !== outfitId));
      setError(e.message);
    }
  }

  async function removeOutfit(outfitId: string) {
    setOutfitIds((prev) => prev.filter((id) => id !== outfitId));
    await supabase
      .from("collection_outfits")
      .delete()
      .eq("collection_id", collection.id)
      .eq("outfit_id", outfitId);
  }

  async function handleDelete() {
    if (!confirm("Delete this capsule? Your pieces and outfits are kept.")) return;
    await supabase.from("collections").delete().eq("id", collection.id);
    router.push("/capsules");
    router.refresh();
  }

  const memberItems = itemIds
    .map((id) => itemsById.get(id))
    .filter((i): i is BoardItem => !!i);
  const memberOutfits = outfitIds
    .map((id) => allOutfits.find((o) => o.id === id))
    .filter((o): o is OutfitSummary => !!o);

  const candidateItems = allItems.filter((i) => !itemIds.includes(i.id));
  const candidateOutfits = allOutfits.filter((o) => !outfitIds.includes(o.id));

  const packedCount = memberItems.filter((i) => packed.has(i.id)).length;
  const range = [collection.start_date, collection.end_date]
    .filter((d): d is string => !!d)
    .map((d) => formatDay(d))
    .join(" – ");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/capsules" className="text-sm text-muted hover:text-foreground">
          ← Back to capsules
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {collection.name}
            </h1>
            <p className="text-sm text-muted">
              {collectionTypeLabel(collection.type)}
              {range && ` · ${range}`}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="rounded-xl border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {isPacking && memberItems.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Packed</span>
            <span className="text-muted">
              {packedCount} / {memberItems.length}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${memberItems.length ? (packedCount / memberItems.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Pieces ({memberItems.length})</h2>
          <button
            onClick={() => setPickItems((v) => !v)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-border/40"
          >
            {pickItems ? "Done" : "+ Add pieces"}
          </button>
        </div>

        {pickItems && (
          <div className="rounded-xl border border-border bg-card/50 p-3">
            {candidateItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                Everything in your closet is already here.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {candidateItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item.id)}
                    title={item.label}
                    className="bg-checker aspect-square overflow-hidden rounded-lg border border-border hover:border-accent"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.label}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[10px] text-muted">
                        {categoryLabel(item.category)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {memberItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted">
            No pieces yet — add some from your closet.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {memberItems.map((item) => {
              const isPacked = packed.has(item.id);
              return (
                <div key={item.id} className="group relative">
                  <div
                    className={`bg-checker aspect-square overflow-hidden rounded-xl border border-border ${
                      isPacking && isPacked ? "opacity-50" : ""
                    }`}
                  >
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.label}
                        className="h-full w-full object-contain p-1"
                      />
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs text-background opacity-0 transition group-hover:opacity-100"
                  >
                    ✕
                  </button>
                  {isPacking && (
                    <button
                      onClick={() => togglePacked(item.id)}
                      className={`mt-1 w-full rounded-lg px-2 py-1 text-xs font-medium ${
                        isPacked
                          ? "bg-accent text-white"
                          : "border border-border bg-card text-muted"
                      }`}
                    >
                      {isPacked ? "Packed ✓" : "Pack"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Outfits */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Outfits ({memberOutfits.length})</h2>
          <button
            onClick={() => setPickOutfits((v) => !v)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-border/40"
          >
            {pickOutfits ? "Done" : "+ Add outfits"}
          </button>
        </div>

        {pickOutfits && (
          <div className="rounded-xl border border-border bg-card/50 p-3">
            {candidateOutfits.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                No more outfits to add.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {candidateOutfits.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => addOutfit(o.id)}
                    title={o.name}
                    className="overflow-hidden rounded-lg border border-border hover:border-accent"
                  >
                    <OutfitBoard placements={o.placements} itemsById={itemsById} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {memberOutfits.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {memberOutfits.map((o) => (
              <div key={o.id} className="group relative">
                <Link href={`/outfits/${o.id}`}>
                  <OutfitBoard placements={o.placements} itemsById={itemsById} />
                </Link>
                <p className="mt-1 truncate text-sm font-medium">{o.name}</p>
                <button
                  onClick={() => removeOutfit(o.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs text-background opacity-0 transition group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

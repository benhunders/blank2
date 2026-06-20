"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WARDROBE_BUCKET } from "@/lib/images";
import { CATEGORIES, SUBCATEGORIES, SEASONS, categoryLabel } from "@/lib/constants";
import type { Item, ItemCategory } from "@/lib/types";

export function ItemDetail({
  item,
  imageUrl,
}: {
  item: Item;
  imageUrl?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [subcategory, setSubcategory] = useState(item.subcategory ?? "");
  const [brand, setBrand] = useState(item.brand ?? "");
  const [color, setColor] = useState(item.color ?? "");
  const [price, setPrice] = useState(item.price?.toString() ?? "");
  const [seasons, setSeasons] = useState<string[]>(item.season ?? []);
  const [notes, setNotes] = useState(item.notes ?? "");

  function toggleSeason(value: string) {
    setSeasons((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("items")
      .update({
        category,
        subcategory: subcategory || null,
        brand: brand || null,
        color: color || null,
        price: price ? Number(price) : null,
        season: seasons,
        notes: notes || null,
      })
      .eq("id", item.id);

    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this item? This can't be undone.")) return;
    setBusy(true);
    setError(null);

    const paths = [item.image_url, item.original_image_url].filter(
      (p): p is string => !!p,
    );
    if (paths.length) {
      await supabase.storage.from(WARDROBE_BUCKET).remove(paths);
    }
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setBusy(false);
      setError(deleteError.message);
      return;
    }
    router.push("/closet");
    router.refresh();
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="bg-checker flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={item.subcategory ?? categoryLabel(item.category)}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <span className="text-sm text-muted">No image</span>
        )}
      </div>

      <div className="space-y-4">
        {!editing ? (
          <>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {item.brand || item.subcategory || categoryLabel(item.category)}
              </h1>
              <p className="text-sm text-muted">{categoryLabel(item.category)}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <Row label="Subcategory" value={item.subcategory} />
              <Row label="Color" value={item.color} />
              <Row
                label="Price"
                value={item.price != null ? `$${item.price}` : null}
              />
              <Row
                label="Season"
                value={
                  item.season.length
                    ? item.season
                        .map((s) => s[0].toUpperCase() + s.slice(1))
                        .join(", ")
                    : null
                }
              />
              <Row label="Worn" value={`${item.wear_count} times`} />
              <Row label="Notes" value={item.notes} />
            </dl>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditing(true)}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.value}
                    label={c.label}
                    active={category === c.value}
                    onClick={() => setCategory(c.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Subcategory</Label>
              <input
                list="subcat-edit"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className={inputClass}
              />
              <datalist id="subcat-edit">
                {SUBCATEGORIES[category].map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brand</Label>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label>Color</Label>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <Label>Price</Label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label>Season</Label>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map((s) => (
                  <Chip
                    key={s.value}
                    label={s.label}
                    active={seasons.includes(s.value)}
                    onClick={() => toggleSeason(s.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={busy}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-border/40"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium">{children}</span>;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between border-b border-border py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-accent text-white"
          : "border border-border bg-card text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

import Link from "next/link";
import { categoryLabel } from "@/lib/constants";
import type { Item } from "@/lib/types";

export function ItemCard({
  item,
  imageUrl,
}: {
  item: Item;
  imageUrl?: string;
}) {
  return (
    <Link
      href={`/closet/${item.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md"
    >
      <div className="bg-checker relative aspect-square">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={item.subcategory ?? categoryLabel(item.category)}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">
          {item.brand || item.subcategory || categoryLabel(item.category)}
        </p>
        <p className="truncate text-xs text-muted">
          {categoryLabel(item.category)}
          {item.color ? ` · ${item.color}` : ""}
        </p>
      </div>
    </Link>
  );
}

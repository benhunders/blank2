/* eslint-disable @next/next/no-img-element */
import type { BoardItem, BoardPlacement } from "@/lib/outfits";

// Read-only render of an outfit board, used in the gallery and detail view.
export function OutfitBoard({
  placements,
  itemsById,
  className = "",
}: {
  placements: BoardPlacement[];
  itemsById: Map<string, BoardItem>;
  className?: string;
}) {
  return (
    <div
      className={`bg-checker relative aspect-square w-full overflow-hidden rounded-2xl border border-border ${className}`}
    >
      {placements.map((p, i) => {
        const item = itemsById.get(p.itemId);
        if (!item?.imageUrl) return null;
        return (
          <img
            key={p.itemId}
            src={item.imageUrl}
            alt={item.label}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.width}%`,
              transform: "translate(-50%, -50%)",
              zIndex: i + 1,
            }}
            className="object-contain"
          />
        );
      })}
    </div>
  );
}

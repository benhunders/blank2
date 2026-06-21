import type { BoardPlacement } from "./outfits";

// Arrange a set of items into a simple centered grid on the board.
// Used to render and persist AI-suggested outfits (which have no manual layout).
export function autoLayout(itemIds: string[]): BoardPlacement[] {
  const n = itemIds.length;
  if (n === 0) return [];
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const width = Math.min(34, Math.floor(76 / cols));

  return itemIds.map((itemId, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      itemId,
      x: ((col + 0.5) / cols) * 100,
      y: ((row + 0.5) / rows) * 100,
      width,
    };
  });
}

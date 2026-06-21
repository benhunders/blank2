// Board layout stored in outfits.board_layout.
// Positions are percentages (0-100) of the board so they stay responsive.
export interface BoardPlacement {
  itemId: string;
  x: number; // % from left (center of item)
  y: number; // % from top (center of item)
  width: number; // % of board width
}

export interface BoardLayout {
  items: BoardPlacement[];
}

export function isBoardLayout(value: unknown): value is BoardLayout {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as BoardLayout).items)
  );
}

// Lightweight item shape the builder/board needs (with a resolved image URL).
export interface BoardItem {
  id: string;
  imageUrl?: string;
  label: string;
  category: string;
}

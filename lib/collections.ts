export type CollectionType = "capsule" | "packing_list";

export const COLLECTION_TYPES: {
  value: CollectionType;
  label: string;
  emoji: string;
  blurb: string;
}[] = [
  {
    value: "capsule",
    label: "Capsule",
    emoji: "🧩",
    blurb: "A curated mini-wardrobe of pieces that mix and match",
  },
  {
    value: "packing_list",
    label: "Packing list",
    emoji: "🧳",
    blurb: "Everything to bring for a trip — check items off as you pack",
  },
];

export function collectionTypeLabel(value: string): string {
  return COLLECTION_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function collectionTypeEmoji(value: string): string {
  return COLLECTION_TYPES.find((t) => t.value === value)?.emoji ?? "🧩";
}

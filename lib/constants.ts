import type { ItemCategory, Season } from "./types";

export const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "dresses", label: "Dresses" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "bags", label: "Bags" },
  { value: "accessories", label: "Accessories" },
];

// Suggested subcategories per category (free-text is also allowed).
export const SUBCATEGORIES: Record<ItemCategory, string[]> = {
  tops: ["T-shirt", "Blouse", "Shirt", "Sweater", "Tank", "Hoodie"],
  bottoms: ["Jeans", "Trousers", "Shorts", "Skirt", "Leggings"],
  dresses: ["Mini", "Midi", "Maxi", "Jumpsuit"],
  outerwear: ["Jacket", "Coat", "Blazer", "Cardigan", "Vest"],
  shoes: ["Sneakers", "Boots", "Heels", "Flats", "Sandals"],
  bags: ["Tote", "Crossbody", "Clutch", "Backpack"],
  accessories: ["Hat", "Scarf", "Belt", "Jewelry", "Sunglasses"],
};

export const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "fall", label: "Fall" },
  { value: "winter", label: "Winter" },
];

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export type ItemCategory =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "bags"
  | "accessories";

export type Season = "spring" | "summer" | "fall" | "winter";

export interface Item {
  id: string;
  user_id: string;
  image_url: string | null;
  original_image_url: string | null;
  category: ItemCategory;
  subcategory: string | null;
  brand: string | null;
  color: string | null;
  season: string[];
  location: string | null;
  price: number | null;
  notes: string | null;
  wear_count: number;
  created_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  name: string;
  cover_image_url: string | null;
  tags: string[];
  board_layout: Record<string, unknown>;
  created_at: string;
}

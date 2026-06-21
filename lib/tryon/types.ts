// Shared types + metadata for the try-on providers. No secrets here, so this
// module is safe to import from anywhere (server or client).

export type TryOnProviderId = "fashn" | "fal";
export type TryOnCategory = "auto" | "tops" | "bottoms" | "one-pieces";

export interface ProviderMeta {
  id: TryOnProviderId;
  label: string;
  pricePerImage: number; // approximate USD, for UI hints only
  envKey: string;
}

export const PROVIDERS: Record<TryOnProviderId, ProviderMeta> = {
  fashn: {
    id: "fashn",
    label: "FASHN",
    pricePerImage: 0.075,
    envKey: "FASHN_API_KEY",
  },
  fal: {
    id: "fal",
    label: "Kling (fal.ai)",
    pricePerImage: 0.07,
    envKey: "FAL_KEY",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as TryOnProviderId[];

export interface TryOnProvider {
  id: TryOnProviderId;
  // Returns the URL of the generated try-on image.
  runTryOn(
    modelImageUrl: string,
    garmentImageUrl: string,
    category: TryOnCategory,
  ): Promise<string>;
}

// Map our wardrobe categories to neutral try-on categories. Returns null for
// items virtual try-on can't place (shoes, bags, accessories).
export function tryOnCategory(category: string): TryOnCategory | null {
  switch (category) {
    case "tops":
    case "outerwear":
      return "tops";
    case "bottoms":
      return "bottoms";
    case "dresses":
      return "one-pieces";
    default:
      return null;
  }
}

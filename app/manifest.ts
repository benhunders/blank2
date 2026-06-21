import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Capsule — Your Digital Wardrobe",
    short_name: "Capsule",
    description:
      "Catalog your wardrobe, build outfits, track wears, and get AI styling.",
    start_url: "/closet",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#faf9f7",
    orientation: "portrait",
    categories: ["lifestyle", "shopping", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

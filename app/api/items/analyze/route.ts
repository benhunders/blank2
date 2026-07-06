import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, SUBCATEGORIES, SEASONS } from "@/lib/constants";
import type { ItemCategory } from "@/lib/types";

// Auto-tagging: classify a garment photo (category/subcategory/color/season/
// brand) so the add-item form is pre-filled. Fields remain user-editable;
// failures here must never block the manual flow.

export const maxDuration = 30;

// Client downscales to ~768px JPEG; anything bigger is misuse.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.value));
const VALID_SEASONS = new Set(SEASONS.map((s) => s.value));

interface Tags {
  category: ItemCategory | null;
  subcategory: string | null;
  color: string | null;
  season: string[];
  brand: string | null;
}

function cleanString(v: unknown, maxLen = 60): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= maxLen ? t : t ? t.slice(0, maxLen) : null;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await request.formData();
  const image = form.get("image");
  if (!(image instanceof Blob) || image.size === 0) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large." }, { status: 400 });
  }

  const subcatHints = CATEGORIES.map(
    (c) => `${c.value}: ${SUBCATEGORIES[c.value].join(", ")}`,
  ).join("\n");

  const system = `You are a fashion cataloging assistant. Classify the single garment/accessory in the photo.

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{"category":"string","subcategory":"string","color":"string","season":["string"],"brand":"string or null"}

Rules:
- category: exactly one of: ${CATEGORIES.map((c) => c.value).join(", ")}
- subcategory: a short noun; prefer one from this list for the chosen category, else your own:
${subcatHints}
- color: the dominant color in 1-3 plain words (e.g. "navy", "cream with black stripes")
- season: which of spring, summer, fall, winter the piece is typically worn in; use all four for year-round staples
- brand: ONLY if a logo or wordmark clearly identifies it, otherwise null. Never guess.`;

  const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const mediaType = image.type === "image/png" ? "image/png" : "image/jpeg";

  let text = "";
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: "Classify this piece and return the JSON." },
          ],
        },
      ],
    });
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }
  } catch (err) {
    console.error("Item analyze error", err);
    return NextResponse.json({ error: "Analysis failed." }, { status: 502 });
  }

  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(text);
  } catch {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s !== -1 && e > s) {
      try {
        raw = JSON.parse(text.slice(s, e + 1));
      } catch {
        /* leave empty */
      }
    }
  }

  const category = cleanString(raw.category)?.toLowerCase() ?? null;
  const tags: Tags = {
    category: VALID_CATEGORIES.has(category as ItemCategory)
      ? (category as ItemCategory)
      : null,
    subcategory: cleanString(raw.subcategory),
    color: cleanString(raw.color),
    season: Array.isArray(raw.season)
      ? raw.season
          .map((s) => (typeof s === "string" ? s.toLowerCase().trim() : ""))
          .filter((s) => VALID_SEASONS.has(s as never))
      : [],
    brand: cleanString(raw.brand),
  };

  return NextResponse.json({ tags });
}

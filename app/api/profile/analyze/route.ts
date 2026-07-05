import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { WARDROBE_BUCKET } from "@/lib/images";
import type { PhotoAnalysis } from "@/lib/fit";

export const maxDuration = 60;

const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type Media = (typeof ALLOWED)[number];

// The Anthropic API rejects images larger than ~5MB.
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Photo analysis isn't configured yet — add ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: profile } = await supabase
    .from("style_profiles")
    .select("photo_path")
    .maybeSingle();
  if (!profile?.photo_path) {
    return NextResponse.json({ error: "No photo to analyze." }, { status: 400 });
  }

  // Download the user's own photo (RLS allows owner access).
  const { data: blob, error: dlErr } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .download(profile.photo_path);
  if (dlErr || !blob) {
    return NextResponse.json({ error: "Couldn't read the photo." }, { status: 500 });
  }
  if (blob.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "That photo is too large to analyze — try one under 4MB." },
      { status: 400 },
    );
  }

  const mediaType: Media = (ALLOWED as readonly string[]).includes(blob.type)
    ? (blob.type as Media)
    : "image/jpeg";
  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

  const system = `You are a kind, body-positive personal stylist. The user has shared a full-body photo so you can give practical styling guidance. Analyze it ONLY for styling purposes: overall silhouette/proportions, vertical balance (torso vs. legs), and coloring (skin/hair tone) for palette suggestions.

Be respectful and non-judgmental. Do NOT comment on weight, health, attractiveness, or anything medical. Frame everything as suggestions, not verdicts. Focus on what cuts, silhouettes, and colors tend to flatter and create balance.

Respond with ONLY a JSON object, no markdown, in exactly this shape:
{"body_shape":"string","proportions":"string","coloring":"string","palette":["string"],"silhouettes":["string"],"summary":"one or two friendly sentences"}`;

  let text = "";
  try {
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "Analyze my photo for styling guidance and return the JSON.",
            },
          ],
        },
      ],
    });
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
    }
  } catch (err) {
    console.error("Analyze error", err);
    return NextResponse.json(
      { error: "The analyzer couldn't be reached. Please try again." },
      { status: 502 },
    );
  }

  let analysis: PhotoAnalysis = {};
  try {
    analysis = JSON.parse(text);
  } catch {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s !== -1 && e > s) {
      try {
        analysis = JSON.parse(text.slice(s, e + 1));
      } catch {
        /* leave empty */
      }
    }
  }

  await supabase
    .from("style_profiles")
    .upsert({ user_id: user.id, photo_analysis: analysis });

  return NextResponse.json({ analysis });
}

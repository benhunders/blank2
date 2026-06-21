import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/constants";

// AI Stylist: builds outfits from the user's actual closet, grounded in current
// trends via Claude's web search tool. Returns validated, structured outfits.

interface SuggestedOutfit {
  name: string;
  rationale: string;
  item_ids: string[];
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI Stylist isn't configured yet — add ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Tell the stylist what you need." }, { status: 400 });
  }

  // Load the user's closet as a compact catalog.
  const { data: items } = await supabase
    .from("items")
    .select("id,category,subcategory,brand,color,season");
  const closet = items ?? [];
  if (closet.length === 0) {
    return NextResponse.json(
      { error: "Add some pieces to your closet first." },
      { status: 400 },
    );
  }

  const validIds = new Set(closet.map((i) => i.id));
  const catalog = closet
    .map((i) => {
      const parts = [
        categoryLabel(i.category),
        i.subcategory,
        i.color,
        i.brand,
        i.season?.length ? `(${i.season.join("/")})` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `- ${i.id}: ${parts}`;
    })
    .join("\n");

  const system = `You are an expert personal stylist. Build outfits using ONLY the user's existing wardrobe items listed below. Use the web_search tool to ground your suggestions in current fashion trends relevant to the user's request (occasion, season, style).

Rules:
- Only use item ids that appear in the WARDROBE list. Never invent ids.
- Each outfit must be a coherent, wearable combination — generally a top + bottom (or a dress), plus optional shoes, outerwear, bag, or accessories from the wardrobe.
- Produce the number of distinct outfits the user asks for (default 5 if unspecified).
- Keep each rationale to one or two sentences, and reference the current trend it draws on.

Respond with ONLY a JSON object, no markdown fences and no extra prose, in exactly this shape:
{"outfits":[{"name":"string","rationale":"string","item_ids":["string"]}],"trend_note":"string"}

WARDROBE:
${catalog}`;

  const anthropic = new Anthropic();
  const sources: { title: string; url: string }[] = [];
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt.trim() },
  ];

  let finalText = "";
  try {
    // Server tools (web search) run a loop server-side; handle pause_turn.
    for (let i = 0; i < 4; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        thinking: { type: "adaptive" },
        system,
        tools: [{ type: "web_search_20260209", name: "web_search" }],
        messages,
      });

      for (const block of response.content) {
        if (block.type === "text") finalText += block.text;
        if (block.type === "web_search_tool_result") {
          const content = block.content;
          if (Array.isArray(content)) {
            for (const r of content) {
              if (r.type === "web_search_result") {
                sources.push({ title: r.title, url: r.url });
              }
            }
          }
        }
      }

      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }
      break;
    }
  } catch (err) {
    console.error("Stylist error", err);
    return NextResponse.json(
      { error: "The stylist couldn't be reached. Please try again." },
      { status: 502 },
    );
  }

  // Parse the JSON the model returned (tolerate stray text around it).
  let parsed: { outfits?: SuggestedOutfit[]; trend_note?: string } = {};
  try {
    parsed = JSON.parse(finalText);
  } catch {
    const start = finalText.indexOf("{");
    const end = finalText.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        parsed = JSON.parse(finalText.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
  }

  // Validate item ids server-side — drop hallucinated ones, then empty outfits.
  const outfits = (parsed.outfits ?? [])
    .map((o) => ({
      name: typeof o.name === "string" ? o.name : "Outfit",
      rationale: typeof o.rationale === "string" ? o.rationale : "",
      item_ids: Array.isArray(o.item_ids)
        ? o.item_ids.filter((id) => validIds.has(id))
        : [],
    }))
    .filter((o) => o.item_ids.length > 0);

  if (outfits.length === 0) {
    return NextResponse.json(
      { error: "The stylist couldn't build outfits from your closet. Try rephrasing." },
      { status: 422 },
    );
  }

  // Dedupe sources by URL.
  const seen = new Set<string>();
  const uniqueSources = sources.filter((s) =>
    seen.has(s.url) ? false : (seen.add(s.url), true),
  );

  // Persist the exchange.
  await supabase.from("stylist_sessions").insert({
    prompt: prompt.trim(),
    response: { outfits, trend_note: parsed.trend_note ?? null, sources: uniqueSources },
  });

  return NextResponse.json({
    outfits,
    trend_note: parsed.trend_note ?? null,
    sources: uniqueSources,
  });
}

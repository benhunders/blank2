import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signPaths, WARDROBE_BUCKET } from "@/lib/images";
import { runTryOn, tryOnCategory, type TryOnCategory } from "@/lib/fashn";

export const maxDuration = 60;

interface Garment {
  path: string;
  category: TryOnCategory;
}
type ItemLite = { id: string; image_url: string | null; category: string };

export async function POST(request: Request) {
  if (!process.env.FASHN_API_KEY) {
    return NextResponse.json(
      { error: "Try-on isn't configured yet — add FASHN_API_KEY." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { itemId, outfitId } = (await request.json()) as {
    itemId?: string;
    outfitId?: string;
  };

  // Person image comes from the fit profile.
  const { data: profile } = await supabase
    .from("style_profiles")
    .select("photo_path")
    .maybeSingle();
  if (!profile?.photo_path) {
    return NextResponse.json(
      { error: "Add a full-body photo on your profile first." },
      { status: 400 },
    );
  }

  // Resolve the garment(s) to layer on.
  const garments: Garment[] = [];
  if (itemId) {
    const { data: item } = await supabase
      .from("items")
      .select("image_url,category")
      .eq("id", itemId)
      .maybeSingle();
    const cat = item ? tryOnCategory(item.category) : null;
    if (!item?.image_url || !cat) {
      return NextResponse.json(
        { error: "Try-on works on tops, bottoms, dresses, and outerwear." },
        { status: 400 },
      );
    }
    garments.push({ path: item.image_url, category: cat });
  } else if (outfitId) {
    const { data: oi } = await supabase
      .from("outfit_items")
      .select("items(id,image_url,category)")
      .eq("outfit_id", outfitId);
    const items = ((oi ?? []) as unknown as { items: ItemLite | null }[])
      .map((r) => r.items)
      .filter((i): i is ItemLite => !!i?.image_url);

    const dress = items.find((i) => i.category === "dresses");
    if (dress) {
      garments.push({ path: dress.image_url!, category: "one-pieces" });
    } else {
      const top = items.find(
        (i) => i.category === "tops" || i.category === "outerwear",
      );
      const bottom = items.find((i) => i.category === "bottoms");
      if (top) garments.push({ path: top.image_url!, category: "tops" });
      if (bottom) garments.push({ path: bottom.image_url!, category: "bottoms" });
    }
    if (garments.length === 0) {
      return NextResponse.json(
        { error: "This outfit has no top, bottom, or dress to try on." },
        { status: 400 },
      );
    }
  } else {
    return NextResponse.json({ error: "Nothing to try on." }, { status: 400 });
  }

  // Sign the private images so FASHN can fetch them.
  const urls = await signPaths(supabase, [
    profile.photo_path,
    ...garments.map((g) => g.path),
  ]);

  let resultUrl: string;
  try {
    let personUrl = urls[profile.photo_path];
    // Layer garments sequentially (e.g. top, then bottom on the result).
    for (const g of garments) {
      personUrl = await runTryOn(personUrl, urls[g.path], g.category);
    }
    resultUrl = personUrl;
  } catch (err) {
    console.error("Try-on error", err);
    return NextResponse.json(
      { error: "The try-on couldn't be generated. Please try again." },
      { status: 502 },
    );
  }

  // Persist the result image into our private storage.
  const imgRes = await fetch(resultUrl);
  const contentType = imgRes.headers.get("content-type") ?? "image/png";
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const resultPath = `${user.id}/tryon/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(WARDROBE_BUCKET)
    .upload(resultPath, buffer, { contentType, upsert: true });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  await supabase.from("tryon_results").insert({
    user_id: user.id,
    item_id: itemId ?? null,
    outfit_id: outfitId ?? null,
    person_photo_path: profile.photo_path,
    result_path: resultPath,
  });

  const signed = await signPaths(supabase, [resultPath]);
  return NextResponse.json({ url: signed[resultPath] });
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WARDROBE_BUCKET } from "@/lib/images";
import { downscaleCutout } from "@/lib/downscale";

// One-time maintenance: items added before upload-time downscaling shipped
// carry camera-resolution cut-outs (many MB each). This re-encodes them at
// 1024px in the browser and swaps the stored file, keeping alpha intact.

const SKIP_UNDER_BYTES = 300 * 1024;

export function CompressImages() {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    setProgress("Checking your wardrobe…");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data: items } = await supabase
        .from("items")
        .select("id,image_url")
        .not("image_url", "is", null);

      let compressed = 0;
      let savedBytes = 0;
      const list = items ?? [];

      for (let i = 0; i < list.length; i++) {
        setProgress(`Optimizing ${i + 1} of ${list.length}…`);
        const path = list[i].image_url as string;
        try {
          const { data: blob } = await supabase.storage
            .from(WARDROBE_BUCKET)
            .download(path);
          if (!blob || blob.size < SKIP_UNDER_BYTES) continue;

          const encoded = await downscaleCutout(blob, 1024);
          if (encoded.blob.size >= blob.size) continue; // no gain

          // Upload to a fresh path, repoint the item, then delete the old
          // file — never a moment where the item points at a missing image.
          const newPath = `${user.id}/${crypto.randomUUID()}.${encoded.ext}`;
          const { error: upErr } = await supabase.storage
            .from(WARDROBE_BUCKET)
            .upload(newPath, encoded.blob, { contentType: encoded.contentType });
          if (upErr) continue;
          const { error: dbErr } = await supabase
            .from("items")
            .update({ image_url: newPath })
            .eq("id", list[i].id);
          if (dbErr) {
            await supabase.storage.from(WARDROBE_BUCKET).remove([newPath]);
            continue;
          }
          await supabase.storage.from(WARDROBE_BUCKET).remove([path]);
          compressed++;
          savedBytes += blob.size - encoded.blob.size;
        } catch {
          /* skip this item, keep going */
        }
      }

      setResult(
        compressed === 0
          ? "Everything is already optimized. ✓"
          : `Compressed ${compressed} ${compressed === 1 ? "image" : "images"} — saved ${(savedBytes / (1024 * 1024)).toFixed(1)} MB. ✓`,
      );
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">Speed up your closet</p>
        <p className="text-xs text-muted">
          {busy
            ? progress
            : (result ??
              "One-time compression of images added before optimization shipped.")}
        </p>
      </div>
      <button
        onClick={run}
        disabled={busy}
        className="shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-50"
      >
        {busy ? "Working…" : "⚡ Compress images"}
      </button>
    </div>
  );
}

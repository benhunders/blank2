"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { removeImageBackground } from "@/lib/background-removal";
import { WARDROBE_BUCKET } from "@/lib/images";
import { CATEGORIES, SUBCATEGORIES, SEASONS } from "@/lib/constants";
import type { ItemCategory } from "@/lib/types";

type Stage = "pick" | "processing" | "review" | "saving";

export function AddItemForm() {
  const router = useRouter();
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("pick");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cutoutBlob, setCutoutBlob] = useState<Blob | null>(null);
  const [cutoutPreview, setCutoutPreview] = useState<string | null>(null);

  const [category, setCategory] = useState<ItemCategory>("tops");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [seasons, setSeasons] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setOriginalFile(file);
    setStage("processing");
    setProgress(0);

    try {
      const blob = await removeImageBackground(file, setProgress);
      setCutoutBlob(blob);
      setCutoutPreview(URL.createObjectURL(blob));
      setStage("review");
    } catch (err) {
      console.error(err);
      setError(
        "Background removal failed. Check your connection and try again.",
      );
      setStage("pick");
    }
  }

  function toggleSeason(value: string) {
    setSeasons((prev) =>
      prev.includes(value)
        ? prev.filter((s) => s !== value)
        : [...prev, value],
    );
  }

  async function handleSave() {
    if (!cutoutBlob || !originalFile) return;
    setStage("saving");
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const key = crypto.randomUUID();
      const cutoutPath = `${user.id}/${key}.png`;
      const origExt = originalFile.name.split(".").pop() || "jpg";
      const origPath = `${user.id}/${key}-orig.${origExt}`;

      const [cutoutUp, origUp] = await Promise.all([
        supabase.storage
          .from(WARDROBE_BUCKET)
          .upload(cutoutPath, cutoutBlob, { contentType: "image/png" }),
        supabase.storage
          .from(WARDROBE_BUCKET)
          .upload(origPath, originalFile, { contentType: originalFile.type }),
      ]);
      if (cutoutUp.error) throw cutoutUp.error;
      if (origUp.error) throw origUp.error;

      const { error: insertError } = await supabase.from("items").insert({
        image_url: cutoutPath,
        original_image_url: origPath,
        category,
        subcategory: subcategory || null,
        brand: brand || null,
        color: color || null,
        price: price ? Number(price) : null,
        season: seasons,
        notes: notes || null,
      });
      if (insertError) throw insertError;

      router.push("/closet");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save item.");
      setStage("review");
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Image side */}
      <div>
        <div className="bg-checker flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border">
          {cutoutPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cutoutPreview}
              alt="Cut-out preview"
              className="h-full w-full object-contain p-4"
            />
          ) : stage === "processing" ? (
            <div className="px-6 text-center">
              <p className="text-sm font-medium">Removing background…</p>
              <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                First run downloads the model — this can take a moment.
              </p>
            </div>
          ) : (
            <div className="px-6 text-center text-sm text-muted">
              <p className="text-4xl">📸</p>
              <p className="mt-2">Take or upload a photo of your piece.</p>
            </div>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={stage === "processing" || stage === "saving"}
          className="mt-3 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-border/40 disabled:opacity-50"
        >
          {cutoutPreview ? "Choose a different photo" : "Take / upload photo"}
        </button>
      </div>

      {/* Details side */}
      <div className="space-y-4">
        <div>
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  setSubcategory("");
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  category === c.value
                    ? "bg-accent text-white"
                    : "border border-border bg-card text-muted hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Subcategory</Label>
          <input
            list="subcat-options"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="e.g. Sweater"
            className={inputClass}
          />
          <datalist id="subcat-options">
            {SUBCATEGORIES[category].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Brand</Label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Everlane"
              className={inputClass}
            />
          </div>
          <div>
            <Label>Color</Label>
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Cream"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <Label>Price</Label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <Label>Season</Label>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleSeason(s.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  seasons.includes(s.value)
                    ? "bg-accent text-white"
                    : "border border-border bg-card text-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Anything to remember…"
            className={inputClass}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={stage !== "review"}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {stage === "saving"
            ? "Saving…"
            : stage === "review"
              ? "Save to closet"
              : "Add a photo first"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium">{children}</span>;
}

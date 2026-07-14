"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WARDROBE_BUCKET } from "@/lib/images";
import { downscaleImage } from "@/lib/downscale";
import {
  BODY_SHAPES,
  FIT_PREFERENCES,
  BODY_AREAS,
  type PhotoAnalysis,
  type StyleProfile,
} from "@/lib/fit";

export function StyleProfileForm({
  initialProfile,
  initialPhotoUrl,
}: {
  initialProfile: StyleProfile | null;
  initialPhotoUrl?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const p = initialProfile;

  const [height, setHeight] = useState(p?.height_cm?.toString() ?? "");
  const [bodyShape, setBodyShape] = useState(p?.body_shape ?? "");
  const [proportions, setProportions] = useState(p?.proportions ?? "");
  const [fitPref, setFitPref] = useState(p?.fit_preference ?? "");
  const [flatter, setFlatter] = useState<string[]>(p?.flatter ?? []);
  const [downplay, setDownplay] = useState<string[]>(p?.downplay ?? []);
  const [sizes, setSizes] = useState<Record<string, string>>(p?.sizes ?? {});
  const [avoidColors, setAvoidColors] = useState<string[]>(p?.avoid_colors ?? []);
  const [colorInput, setColorInput] = useState("");
  const [notes, setNotes] = useState(p?.notes ?? "");

  const [photoPath, setPhotoPath] = useState<string | null>(p?.photo_path ?? null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialPhotoUrl);
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(
    p?.photo_analysis ?? null,
  );
  const [consent, setConsent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, v: string) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Not signed in.");
      return;
    }
    const { error: e } = await supabase.from("style_profiles").upsert({
      user_id: user.id,
      height_cm: height ? Number(height) : null,
      body_shape: bodyShape || null,
      proportions: proportions.trim() || null,
      fit_preference: fitPref || null,
      flatter,
      downplay,
      sizes,
      avoid_colors: avoidColors,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      setError("Not signed in.");
      return;
    }
    // Downscale before upload — phone photos are many MB and slow to render;
    // 1600px is plenty for display, analysis, and try-on.
    let upload: Blob = file;
    let ext = file.name.split(".").pop() || "jpg";
    let type = file.type || "image/jpeg";
    try {
      upload = await downscaleImage(file, 1600, "#ffffff");
      ext = "jpg";
      type = "image/jpeg";
    } catch {
      /* unsupported format — keep the raw file */
    }
    const path = `${user.id}/me/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(WARDROBE_BUCKET)
      .upload(path, upload, { upsert: true, contentType: type });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      return;
    }
    // Remove a previously stored photo, if any.
    if (photoPath && photoPath !== path) {
      await supabase.storage.from(WARDROBE_BUCKET).remove([photoPath]);
    }
    await supabase
      .from("style_profiles")
      .upsert({ user_id: user.id, photo_path: path, photo_analysis: null });
    setPhotoPath(path);
    setPhotoUrl(URL.createObjectURL(file));
    setAnalysis(null);
    setUploading(false);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/analyze", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
      setAnalysis(data.analysis as PhotoAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDeletePhoto() {
    if (!photoPath) return;
    if (!confirm("Remove your photo and its analysis?")) return;
    await supabase.storage.from(WARDROBE_BUCKET).remove([photoPath]);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("style_profiles")
        .upsert({ user_id: user.id, photo_path: null, photo_analysis: null });
    }
    setPhotoPath(null);
    setPhotoUrl(undefined);
    setAnalysis(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Structured profile */}
      <section className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Height (cm)</Label>
            <input
              type="number"
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
              className={input}
            />
          </div>
          <div>
            <Label>Proportions</Label>
            <input
              value={proportions}
              onChange={(e) => setProportions(e.target.value)}
              placeholder="e.g. longer torso, shorter legs"
              className={input}
            />
          </div>
        </div>

        <div>
          <Label>Body shape</Label>
          <Chips
            options={[...BODY_SHAPES]}
            selected={bodyShape ? [bodyShape] : []}
            onToggle={(v) => setBodyShape(bodyShape === v ? "" : v)}
          />
        </div>

        <div>
          <Label>Preferred fit</Label>
          <Chips
            options={[...FIT_PREFERENCES]}
            selected={fitPref ? [fitPref] : []}
            onToggle={(v) => setFitPref(fitPref === v ? "" : v)}
          />
        </div>

        <div>
          <Label>Emphasize</Label>
          <Chips
            options={[...BODY_AREAS]}
            selected={flatter}
            onToggle={(v) => toggle(flatter, setFlatter, v)}
          />
        </div>

        <div>
          <Label>De-emphasize</Label>
          <Chips
            options={[...BODY_AREAS]}
            selected={downplay}
            onToggle={(v) => toggle(downplay, setDownplay, v)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(["tops", "bottoms", "shoes"] as const).map((k) => (
            <div key={k}>
              <Label>{k[0].toUpperCase() + k.slice(1)} size</Label>
              <input
                value={sizes[k] ?? ""}
                onChange={(e) => setSizes({ ...sizes, [k]: e.target.value })}
                className={input}
              />
            </div>
          ))}
        </div>

        <div>
          <Label>Colors to avoid</Label>
          <div className="flex gap-2">
            <input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const c = colorInput.trim();
                  if (c && !avoidColors.includes(c))
                    setAvoidColors([...avoidColors, c]);
                  setColorInput("");
                }
              }}
              placeholder="neon, beige…"
              className={input}
            />
          </div>
          {avoidColors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {avoidColors.map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    setAvoidColors(avoidColors.filter((x) => x !== c))
                  }
                  className="rounded-full bg-black/5 px-2.5 py-1 text-xs hover:bg-black/10"
                >
                  {c} ✕
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Anything else</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Style you love, things you never wear, lifestyle…"
            className={input}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
        </button>
      </section>

      {/* Photo + AI analysis */}
      <section className="space-y-3 border-t border-border pt-6">
        <div>
          <h2 className="font-medium">Full-body photo (optional)</h2>
          <p className="mt-1 text-sm text-muted">
            Add a head-to-toe photo and let the stylist analyze your proportions
            and coloring. Your photo is stored privately to your account and is
            only sent to the AI when you tap Analyze. You can delete it anytime.
          </p>
        </div>

        {photoUrl ? (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt="Your photo"
              className="h-40 w-32 rounded-xl border border-border object-cover"
            />
            <div className="space-y-2">
              <label className="block">
                <span className="inline-flex cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-black/5">
                  {uploading ? "Uploading…" : "Replace photo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleDeletePhoto}
                className="block rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Delete photo
              </button>
            </div>
          </div>
        ) : (
          <label className="block">
            <span className="inline-flex cursor-pointer rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 text-sm hover:bg-black/5">
              {uploading ? "Uploading…" : "+ Add a full-body photo"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </label>
        )}

        {photoPath && (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-muted">
                I consent to having my photo analyzed by AI (Claude) to generate
                respectful styling suggestions.
              </span>
            </label>
            <button
              onClick={handleAnalyze}
              disabled={!consent || analyzing}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {analyzing ? "Analyzing…" : "Analyze my photo"}
            </button>

            {analysis && (
              <div className="space-y-1.5 border-t border-border pt-3 text-sm">
                {analysis.summary && <p>{analysis.summary}</p>}
                {analysis.body_shape && (
                  <Detail label="Shape" value={analysis.body_shape} />
                )}
                {analysis.proportions && (
                  <Detail label="Proportions" value={analysis.proportions} />
                )}
                {analysis.coloring && (
                  <Detail label="Coloring" value={analysis.coloring} />
                )}
                {analysis.palette?.length ? (
                  <Detail label="Palette" value={analysis.palette.join(", ")} />
                ) : null}
                {analysis.silhouettes?.length ? (
                  <Detail
                    label="Flattering silhouettes"
                    value={analysis.silhouettes.join(", ")}
                  />
                ) : null}
                <p className="pt-1 text-xs text-muted">
                  These are AI suggestions, not facts — wear what makes you feel
                  good.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const input =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium">{children}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted">{label}:</span> {value}
    </p>
  );
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onToggle(o)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            selected.includes(o)
              ? "bg-accent text-white"
              : "border border-border bg-card text-muted hover:text-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

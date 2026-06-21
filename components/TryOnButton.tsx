"use client";

import { useState } from "react";

// Triggers a FASHN virtual try-on for an item or an outfit and shows the result.
export function TryOnButton({
  itemId,
  outfitId,
}: {
  itemId?: string;
  outfitId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function tryOn() {
    if (
      !confirm(
        "This sends your profile photo and this garment to FASHN (a third-party AI) to generate a try-on image. Continue?",
      )
    )
      return;
    setBusy(true);
    setError(null);
    setUrl(null);
    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, outfitId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Try-on failed.");
      setUrl(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={tryOn}
        disabled={busy}
        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-border/40 disabled:opacity-60"
      >
        {busy ? "Generating try-on… (~15s)" : "🪞 Try it on me"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {url && (
        <div className="space-y-1.5 rounded-xl border border-border bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Virtual try-on"
            className="bg-checker w-full rounded-lg object-contain"
          />
          <p className="text-xs text-muted">
            AI-generated preview — illustrative styling, not a guarantee of size
            or exact fit.
          </p>
        </div>
      )}
    </div>
  );
}

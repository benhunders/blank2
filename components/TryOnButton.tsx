"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DEBUG = process.env.NEXT_PUBLIC_TRYON_DEBUG === "1";

interface ProviderInfo {
  id: string;
  label: string;
  pricePerImage: number;
}
interface Result {
  label: string;
  url: string;
}

// Triggers a virtual try-on for an item or outfit and shows the result.
// In debug mode (NEXT_PUBLIC_TRYON_DEBUG=1) it exposes a provider picker and a
// "compare" mode to A/B engines on quality and price.
export function TryOnButton({
  itemId,
  outfitId,
}: {
  itemId?: string;
  outfitId?: string;
}) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!DEBUG) return;
    fetch("/api/tryon")
      .then((r) => r.json())
      .then((d: { providers?: ProviderInfo[]; default?: string }) => {
        setProviders(d.providers ?? []);
        setSelected(d.default ?? d.providers?.[0]?.id ?? "");
      })
      .catch(() => {});
  }, []);

  const showToggle = DEBUG && providers.length > 0;
  const priceOf = (id: string) =>
    providers.find((p) => p.id === id)?.pricePerImage;
  const labelOf = (id: string) =>
    providers.find((p) => p.id === id)?.label ?? id;

  async function run() {
    const targets =
      compare && providers.length
        ? providers.map((p) => p.id)
        : [selected || undefined];

    const note = compare
      ? `This runs ${targets.length} renders (one per provider) and sends your profile photo + garment to each. Continue?`
      : "This sends your profile photo and this garment to a third-party AI to generate a try-on image. Continue?";
    if (!confirm(note)) return;

    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const out: Result[] = [];
      for (const pid of targets) {
        const res = await fetch("/api/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, outfitId, provider: pid }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Try-on failed.");
        out.push({
          label: pid ? labelOf(pid) : labelOf(data.provider),
          url: data.url as string,
        });
        setResults([...out]); // progressive reveal
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try-on failed.");
    } finally {
      setBusy(false);
    }
  }

  const buttonLabel = busy
    ? "Generating try-on… (~15s)"
    : compare
      ? `🪞 Compare on me (${providers.length})`
      : "🪞 Try it on me";

  return (
    <div className="space-y-2">
      {showToggle && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={compare}
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-50"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} (~${p.pricePerImage.toFixed(3)})
              </option>
            ))}
          </select>
          {providers.length > 1 && (
            <label className="flex items-center gap-1.5 text-muted">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              Compare all
            </label>
          )}
        </div>
      )}

      <button
        onClick={run}
        disabled={busy}
        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
      >
        {buttonLabel}
        {showToggle && !compare && selected && priceOf(selected) != null && (
          <span className="text-muted"> · ~${priceOf(selected)!.toFixed(3)}</span>
        )}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div
          className={`grid gap-2 ${results.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {results.map((r, i) => (
            <div
              key={i}
              className="space-y-1 rounded-xl border border-border bg-card p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.url}
                alt={`Try-on (${r.label})`}
                className="bg-checker w-full rounded-lg object-contain"
              />
              {DEBUG && (
                <p className="text-center text-xs font-medium">{r.label}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <p className="text-xs text-muted">
          AI-generated preview — illustrative styling, not a guarantee of size or
          exact fit. Saved to{" "}
          <Link href="/tryons" className="underline hover:text-foreground">
            my try-ons
          </Link>
          .
        </p>
      )}
    </div>
  );
}

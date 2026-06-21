"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OutfitBoard } from "@/components/OutfitBoard";
import { autoLayout } from "@/lib/auto-layout";
import type { BoardItem } from "@/lib/outfits";

interface Suggestion {
  name: string;
  rationale: string;
  item_ids: string[];
}
interface StylistResult {
  outfits: Suggestion[];
  trend_note: string | null;
  sources: { title: string; url: string }[];
}

const EXAMPLES = [
  "Give me 5 office outfits based on current trends",
  "3 weekend brunch looks",
  "What should I wear to a fall wedding?",
];

export function StylistChat({
  items,
  hasCloset,
}: {
  items: BoardItem[];
  hasCloset: boolean;
}) {
  const supabase = createClient();
  const itemsById = new Map(items.map((i) => [i.id, i]));

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StylistResult | null>(null);
  const [saved, setSaved] = useState<Record<number, string>>({});
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved({});
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult(data as StylistResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function saveOutfit(outfit: Suggestion, idx: number) {
    setSavingIdx(idx);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data, error: insErr } = await supabase
        .from("outfits")
        .insert({
          name: outfit.name,
          tags: ["ai"],
          board_layout: { items: autoLayout(outfit.item_ids) },
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      const rows = outfit.item_ids.map((id) => ({
        outfit_id: data.id,
        item_id: id,
      }));
      const { error: itemsErr } = await supabase
        .from("outfit_items")
        .insert(rows);
      if (itemsErr) throw itemsErr;

      setSaved((s) => ({ ...s, [idx]: data.id as string }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save outfit.");
    } finally {
      setSavingIdx(null);
    }
  }

  if (!hasCloset) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
        <p className="text-4xl">🧺</p>
        <h2 className="mt-3 font-medium">Add pieces to your closet first</h2>
        <p className="mt-1 text-sm text-muted">
          The stylist builds looks from items you own.
        </p>
        <Link
          href="/closet/new"
          className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          + Add item
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(prompt);
        }}
        className="space-y-3"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          placeholder="e.g. Give me 5 office outfits based on current trends"
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Styling…" : "Ask the stylist"}
          </button>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setPrompt(ex);
                ask(ex);
              }}
              disabled={loading}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted hover:text-foreground disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted">
          Searching current trends and assembling looks from your closet…
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {result.trend_note && (
            <p className="rounded-xl border border-border bg-card p-4 text-sm">
              {result.trend_note}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {result.outfits.map((outfit, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-2xl border border-border bg-card p-4"
              >
                <OutfitBoard
                  placements={autoLayout(outfit.item_ids)}
                  itemsById={itemsById}
                />
                <div>
                  <h3 className="font-medium">{outfit.name}</h3>
                  <p className="mt-1 text-sm text-muted">{outfit.rationale}</p>
                </div>
                {saved[idx] ? (
                  <Link
                    href={`/outfits/${saved[idx]}`}
                    className="block rounded-xl border border-border px-4 py-2 text-center text-sm font-medium hover:bg-border/40"
                  >
                    Saved ✓ View outfit
                  </Link>
                ) : (
                  <button
                    onClick={() => saveOutfit(outfit, idx)}
                    disabled={savingIdx === idx}
                    className="w-full rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {savingIdx === idx ? "Saving…" : "Save to outfits"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {result.sources.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Trend sources
              </p>
              <ul className="space-y-1 text-sm">
                {result.sources.slice(0, 6).map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline underline-offset-2 hover:opacity-70"
                    >
                      {s.title || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

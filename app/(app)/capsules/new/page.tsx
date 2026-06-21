"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COLLECTION_TYPES, type CollectionType } from "@/lib/collections";

export default function NewCapsulePage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [type, setType] = useState<CollectionType>("capsule");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your capsule a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: insErr } = await supabase
      .from("collections")
      .insert({
        name: name.trim(),
        type,
        start_date: startDate || null,
        end_date: endDate || null,
      })
      .select("id")
      .single();
    if (insErr) {
      setSaving(false);
      setError(insErr.message);
      return;
    }
    router.push(`/capsules/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/capsules" className="text-sm text-muted hover:text-foreground">
          ← Back to capsules
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New capsule</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Italy trip, Fall workwear"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Type</label>
          <div className="grid grid-cols-2 gap-3">
            {COLLECTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  type === t.value
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                <span className="text-xl">{t.emoji}</span>
                <p className="mt-1 text-sm font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-muted">{t.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Start <span className="text-muted">(optional)</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              End <span className="text-muted">(optional)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create capsule"}
        </button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TryOnButton } from "@/components/TryOnButton";

export function OutfitActions({ outfitId }: { outfitId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  async function handleWoreToday() {
    setLogging(true);
    setError(null);
    const t = new Date();
    const worn_on = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    const { error: logErr } = await supabase
      .from("wears")
      .insert({ outfit_id: outfitId, worn_on });
    setLogging(false);
    if (logErr) {
      setError(logErr.message);
      return;
    }
    setLogged(true);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this outfit? Your individual pieces are kept.")) return;
    setBusy(true);
    setError(null);
    const { error: delErr } = await supabase
      .from("outfits")
      .delete()
      .eq("id", outfitId);
    if (delErr) {
      setBusy(false);
      setError(delErr.message);
      return;
    }
    router.push("/outfits");
    router.refresh();
  }

  return (
    <div className="space-y-2 pt-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        onClick={handleWoreToday}
        disabled={logging || logged}
        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-border/40 disabled:opacity-60"
      >
        {logged ? "Logged for today ✓" : logging ? "Logging…" : "👕 Wore today"}
      </button>
      <TryOnButton outfitId={outfitId} />
      <div className="flex gap-3">
        <Link
          href={`/outfits/${outfitId}/edit`}
          className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-90"
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

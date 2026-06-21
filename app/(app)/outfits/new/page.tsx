import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadBoardItems } from "@/lib/board-items";
import { OutfitBuilder } from "@/components/OutfitBuilder";

export default async function NewOutfitPage() {
  const supabase = await createClient();
  const items = await loadBoardItems(supabase);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/outfits" className="text-sm text-muted hover:text-foreground">
          ← Back to outfits
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">New outfit</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-4xl">🧺</p>
          <h2 className="mt-3 font-medium">Add pieces to your closet first</h2>
          <Link
            href="/closet/new"
            className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            + Add item
          </Link>
        </div>
      ) : (
        <OutfitBuilder items={items} />
      )}
    </div>
  );
}

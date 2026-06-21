import { createClient } from "@/lib/supabase/server";
import { loadBoardItems } from "@/lib/board-items";
import { StylistChat } from "@/components/StylistChat";

export default async function StylistPage() {
  const supabase = await createClient();
  const items = await loadBoardItems(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Stylist</h1>
        <p className="text-sm text-muted">
          Ask for outfit ideas from your own closet, grounded in current trends.
        </p>
      </div>
      <StylistChat items={items} hasCloset={items.length > 0} />
    </div>
  );
}

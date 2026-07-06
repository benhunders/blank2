"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WARDROBE_BUCKET } from "@/lib/images";

export function DeleteTryOnButton({
  id,
  resultPath,
}: {
  id: string;
  resultPath: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this try-on image?")) return;
    setBusy(true);
    await supabase.storage.from(WARDROBE_BUCKET).remove([resultPath]);
    await supabase.from("tryon_results").delete().eq("id", id);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs text-background opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
      aria-label="Delete try-on"
    >
      ✕
    </button>
  );
}

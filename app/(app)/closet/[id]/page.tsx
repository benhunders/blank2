import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signPaths } from "@/lib/images";
import { ItemDetail } from "@/components/ItemDetail";
import type { Item } from "@/lib/types";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();
  const typed = item as Item;

  const urls = await signPaths(supabase, [typed.image_url]);
  const imageUrl = typed.image_url ? urls[typed.image_url] : undefined;

  return (
    <div className="space-y-6">
      <Link href="/closet" className="text-sm text-muted hover:text-foreground">
        ← Back to closet
      </Link>
      <ItemDetail item={typed} imageUrl={imageUrl} />
    </div>
  );
}

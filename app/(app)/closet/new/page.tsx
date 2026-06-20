import Link from "next/link";
import { AddItemForm } from "@/components/AddItemForm";

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/closet" className="text-sm text-muted hover:text-foreground">
          ← Back to closet
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Add a piece</h1>
        <p className="text-sm text-muted">
          We&apos;ll remove the background automatically — just snap a photo.
        </p>
      </div>
      <AddItemForm />
    </div>
  );
}

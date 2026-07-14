// Shown instantly on every in-app navigation while the server renders the
// real page. The header and bottom nav (in the layout) stay put, so only this
// content area swaps — making transitions feel immediate.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-lg bg-black/10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl border border-border bg-black/[0.06]"
          />
        ))}
      </div>
    </div>
  );
}

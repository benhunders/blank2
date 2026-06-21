export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="mt-1 max-w-xs text-sm text-muted">
        Capsule needs a connection to load your wardrobe. Reconnect and try again.
      </p>
    </div>
  );
}

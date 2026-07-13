import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">Capsule</span>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/sign-in" className="rounded-lg px-3 py-2 hover:bg-black/5">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-accent px-3.5 py-2 font-medium text-white hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted">
          Your digital wardrobe
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Catalog your closet. Style it with AI.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted">
          Snap a photo of any piece — Capsule removes the background
          automatically, organizes it by category, and helps you build outfits
          and capsules. Then ask the AI stylist for fresh looks.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/sign-up"
            className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-white hover:opacity-90"
          >
            Build my closet
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-black/5"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["📸", "Snap & cut out", "Auto background removal, right in your browser."],
            ["🗂️", "Organize", "Filter by category, color, brand, and season."],
            ["✨", "AI stylist", "“Give me 5 office outfits for current trends.”"],
          ].map(([icon, title, body]) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 text-left"
            >
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

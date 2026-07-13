"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Pill-style switcher between the sibling pages that share a bottom-nav tab
// (Outfits | Capsules, Calendar | Insights).
export function Segments({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-full bg-white/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      {items.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              active
                ? "bg-white/90 font-semibold shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

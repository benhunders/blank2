"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";

const LINKS = [
  { href: "/closet", label: "Closet" },
  { href: "/outfits", label: "Outfits" },
  { href: "/capsules", label: "Capsules" },
  { href: "/calendar", label: "Calendar" },
  { href: "/stylist", label: "Stylist" },
  { href: "/insights", label: "Insights" },
];

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link href="/closet" className="text-lg font-semibold tracking-tight">
            Capsule
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-border/40"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="-mb-px flex items-center gap-1 overflow-x-auto pb-2">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-border/50 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

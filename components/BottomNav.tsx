"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Instagram-style bottom tab bar: five destinations, stylist raised in the
// center. Related pages share a tab (Outfits+Capsules, Calendar+Insights,
// Profile+Try-ons) and switch via in-page segments.

type IconProps = { className?: string };

const TABS: {
  href: string;
  label: string;
  match: string[];
  Icon: (p: IconProps) => React.ReactNode;
  center?: boolean;
}[] = [
  { href: "/closet", label: "Closet", match: ["/closet"], Icon: HangerIcon },
  {
    href: "/outfits",
    label: "Outfits",
    match: ["/outfits", "/capsules"],
    Icon: LayersIcon,
  },
  {
    href: "/stylist",
    label: "Stylist",
    match: ["/stylist"],
    Icon: SparklesIcon,
    center: true,
  },
  {
    href: "/calendar",
    label: "Calendar",
    match: ["/calendar", "/insights"],
    Icon: CalendarIcon,
  },
  { href: "/profile", label: "Me", match: ["/profile", "/tryons"], Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-3 z-30 mx-auto max-w-lg rounded-[28px]"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="grid h-16 grid-cols-5">
        {TABS.map(({ href, label, match, Icon, center }) => {
          const active = match.some((m) => pathname.startsWith(m));
          if (center) {
            return (
              <Link
                key={href}
                href={href}
                prefetch
                aria-label={label}
                className="flex flex-col items-center justify-start"
              >
                <span
                  className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white/60 transition ${
                    active ? "bg-accent" : "bg-accent/90 hover:bg-accent"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span
                  className={`mt-0.5 text-[11px] ${
                    active ? "font-semibold text-foreground" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-label={label}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] transition ${
                active ? "font-semibold text-foreground" : "text-muted"
              }`}
            >
              <Icon className={active ? "h-6 w-6" : "h-6 w-6 opacity-80"} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function base(className?: string) {
  return {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function HangerIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 9.2q0-2.4 2-2.4q1.3 0 1.3 1.5" />
      <path d="M12 9.2 L4.8 16 h14.4 Z" />
    </svg>
  );
}

function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="7.5" y="4" width="12" height="12" rx="2" />
      <path d="M16.5 20h-10a2 2 0 0 1-2-2V8" />
    </svg>
  );
}

function SparklesIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M11 5l1.5 3.8L16.3 10l-3.8 1.2L11 15l-1.5-3.8L5.7 10l3.8-1.2Z" />
      <path d="M17.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10.5h16M8 3.5v4M16 3.5v4" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20q0-4.5 7-4.5t7 4.5" />
    </svg>
  );
}

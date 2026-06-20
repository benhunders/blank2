"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { CATEGORIES } from "@/lib/constants";

export function ClosetFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const activeCategory = params.get("category") ?? "";
  const sort = params.get("sort") ?? "newest";

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/closet?${next.toString()}`);
    },
    [params, router],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Chip
          label="All"
          active={!activeCategory}
          onClick={() => setParam("category", "")}
        />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            active={activeCategory === c.value}
            onClick={() => setParam("category", c.value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search brand, color, notes…"
          onKeyDown={(e) => {
            if (e.key === "Enter")
              setParam("q", (e.target as HTMLInputElement).value.trim());
          }}
          className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3.5 py-2 text-sm outline-none focus:border-accent"
        />
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="newest">Newest</option>
          <option value="wears">Most worn</option>
          <option value="price">Highest price</option>
        </select>
      </div>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-accent text-white"
          : "border border-border bg-card text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

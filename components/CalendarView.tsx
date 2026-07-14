"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel } from "@/lib/constants";
import { OutfitBoard } from "@/components/OutfitBoard";
import type { BoardItem, BoardPlacement } from "@/lib/outfits";
import type { OutfitSummary } from "@/lib/load-outfits";

export interface WearEntry {
  id: string;
  wornOn: string; // YYYY-MM-DD
  notes: string | null;
  itemId: string | null;
  outfitId: string | null;
  itemImageUrl?: string;
  outfitName?: string;
  outfitPlacements?: BoardPlacement[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarView({
  wears,
  allItems,
  allOutfits,
}: {
  wears: WearEntry[];
  allItems: BoardItem[];
  allOutfits: OutfitSummary[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const today = new Date();

  const itemsById = useMemo(
    () => new Map(allItems.map((i) => [i.id, i])),
    [allItems],
  );

  const [entries, setEntries] = useState<WearEntry[]>(wears);
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [logDate, setLogDate] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, WearEntry[]>();
    for (const w of entries) {
      const list = m.get(w.wornOn) ?? [];
      list.push(w);
      m.set(w.wornOn, list);
    }
    return m;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  async function deleteWear(id: string) {
    setEntries((prev) => prev.filter((w) => w.id !== id));
    await supabase.from("wears").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-black/5"
          >
            ←
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-black/5"
          >
            →
          </button>
          <span className="ml-2 font-medium">{monthLabel}</span>
        </div>
        <button
          onClick={() => setLogDate(ymd(today))}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Log a wear
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-border bg-border text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-card py-2 text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null)
            return <div key={i} className="min-h-20 bg-background/40" />;
          const key = ymd(new Date(year, month, day));
          const dayWears = byDay.get(key) ?? [];
          const isToday = key === ymd(today);
          return (
            <button
              key={i}
              onClick={() => setLogDate(key)}
              className="min-h-20 bg-card p-1 text-left align-top transition hover:bg-black/5"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-accent text-white" : "text-muted"
                }`}
              >
                {day}
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {dayWears.slice(0, 4).map((w) => (
                  <div key={w.id} className="h-7 w-7 overflow-hidden rounded">
                    {w.outfitId ? (
                      <OutfitBoard
                        placements={w.outfitPlacements ?? []}
                        itemsById={itemsById}
                      />
                    ) : w.itemImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
            loading="lazy"
            decoding="async"
                        src={w.itemImageUrl}
                        alt=""
                        className="bg-checker h-full w-full object-contain"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {logDate && (
        <LogModal
          date={logDate}
          allItems={allItems}
          allOutfits={allOutfits}
          itemsById={itemsById}
          dayWears={byDay.get(logDate) ?? []}
          onClose={() => setLogDate(null)}
          onLogged={(entry) => setEntries((prev) => [entry, ...prev])}
          onDelete={deleteWear}
        />
      )}
    </div>
  );
}

function LogModal({
  date,
  allItems,
  allOutfits,
  itemsById,
  dayWears,
  onClose,
  onLogged,
  onDelete,
}: {
  date: string;
  allItems: BoardItem[];
  allOutfits: OutfitSummary[];
  itemsById: Map<string, BoardItem>;
  dayWears: WearEntry[];
  onClose: () => void;
  onLogged: (entry: WearEntry) => void;
  onDelete: (id: string) => void;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<"outfit" | "item">("outfit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pretty = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function logOutfit(outfit: OutfitSummary) {
    await save({ outfit_id: outfit.id }, (id) => ({
      id,
      wornOn: date,
      notes: null,
      itemId: null,
      outfitId: outfit.id,
      outfitName: outfit.name,
      outfitPlacements: outfit.placements,
    }));
  }

  async function logItem(item: BoardItem) {
    await save({ item_id: item.id }, (id) => ({
      id,
      wornOn: date,
      notes: null,
      itemId: item.id,
      outfitId: null,
      itemImageUrl: item.imageUrl,
    }));
  }

  async function save(
    ref: { item_id?: string; outfit_id?: string },
    build: (id: string) => WearEntry,
  ) {
    setSaving(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("wears")
      .insert({ ...ref, worn_on: date })
      .select("id")
      .single();
    setSaving(false);
    if (e) {
      setError(e.message);
      return;
    }
    onLogged(build(data.id as string));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-medium">{pretty}</h2>
          <button onClick={onClose} className="text-sm text-muted hover:text-foreground">
            Close
          </button>
        </div>

        {dayWears.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {dayWears.map((w) => (
              <div key={w.id} className="group relative">
                <div className="h-14 w-14 overflow-hidden rounded-lg border border-border">
                  {w.outfitId ? (
                    <OutfitBoard
                      placements={w.outfitPlacements ?? []}
                      itemsById={itemsById}
                    />
                  ) : w.itemImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
            loading="lazy"
            decoding="async"
                      src={w.itemImageUrl}
                      alt=""
                      className="bg-checker h-full w-full object-contain"
                    />
                  ) : null}
                </div>
                <button
                  onClick={() => onDelete(w.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] text-background"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-1 rounded-lg bg-white/35 p-1 text-sm">
          {(["outfit", "item"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-1.5 font-medium capitalize transition ${
                tab === t ? "bg-white/90 shadow-sm" : "text-muted"
              }`}
            >
              {t === "outfit" ? "Outfit" : "Single item"}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-3">
          {tab === "outfit" ? (
            allOutfits.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                No outfits yet — build one first.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {allOutfits.map((o) => (
                  <button
                    key={o.id}
                    disabled={saving}
                    onClick={() => logOutfit(o)}
                    className="overflow-hidden rounded-lg border border-border hover:border-accent disabled:opacity-50"
                  >
                    <OutfitBoard placements={o.placements} itemsById={itemsById} />
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {allItems.map((item) => (
                <button
                  key={item.id}
                  disabled={saving}
                  onClick={() => logItem(item)}
                  title={item.label}
                  className="bg-checker aspect-square overflow-hidden rounded-lg border border-border hover:border-accent disabled:opacity-50"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
            loading="lazy"
            decoding="async"
                      src={item.imageUrl}
                      alt={item.label}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-[10px] text-muted">
                      {categoryLabel(item.category)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

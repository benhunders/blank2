"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import type { BoardItem, BoardPlacement } from "@/lib/outfits";

export function OutfitBuilder({
  items,
  existing,
}: {
  items: BoardItem[];
  existing?: {
    id: string;
    name: string;
    tags: string[];
    placements: BoardPlacement[];
  };
}) {
  const router = useRouter();
  const supabase = createClient();
  const boardRef = useRef<HTMLDivElement>(null);

  const [placements, setPlacements] = useState<BoardPlacement[]>(
    existing?.placements ?? [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState(existing?.name ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [trayCategory, setTrayCategory] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const byId = new Map(items.map((i) => [i.id, i]));
  const placedIds = new Set(placements.map((p) => p.itemId));
  const tray = trayCategory
    ? items.filter((i) => i.category === trayCategory)
    : items;

  function addItem(itemId: string) {
    if (placedIds.has(itemId)) return;
    setPlacements((prev) => [
      ...prev,
      { itemId, x: 50, y: 50, width: 32 },
    ]);
    setSelectedId(itemId);
  }

  function removeItem(itemId: string) {
    setPlacements((prev) => prev.filter((p) => p.itemId !== itemId));
    if (selectedId === itemId) setSelectedId(null);
  }

  function resizeSelected(delta: number) {
    if (!selectedId) return;
    setPlacements((prev) =>
      prev.map((p) =>
        p.itemId === selectedId
          ? { ...p, width: Math.min(90, Math.max(10, p.width + delta)) }
          : p,
      ),
    );
  }

  function bringToFront(itemId: string) {
    setPlacements((prev) => {
      const target = prev.find((p) => p.itemId === itemId);
      if (!target) return prev;
      return [...prev.filter((p) => p.itemId !== itemId), target];
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const dxPct = (event.delta.x / rect.width) * 100;
    const dyPct = (event.delta.y / rect.height) * 100;
    const id = String(event.active.id);
    setPlacements((prev) =>
      prev.map((p) =>
        p.itemId === id
          ? {
              ...p,
              x: Math.min(100, Math.max(0, p.x + dxPct)),
              y: Math.min(100, Math.max(0, p.y + dyPct)),
            }
          : p,
      ),
    );
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function handleSave() {
    if (placements.length === 0) {
      setError("Add at least one item to your outfit.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const payload = {
        name: name.trim() || "Untitled outfit",
        tags,
        board_layout: { items: placements },
      };

      let outfitId = existing?.id;
      if (outfitId) {
        const { error: upErr } = await supabase
          .from("outfits")
          .update(payload)
          .eq("id", outfitId);
        if (upErr) throw upErr;
      } else {
        const { data, error: insErr } = await supabase
          .from("outfits")
          .insert(payload)
          .select("id")
          .single();
        if (insErr) throw insErr;
        outfitId = data.id as string;
      }

      // Upsert the new set first, then prune stale rows — never a moment
      // where the outfit has no items if a request fails mid-save.
      const rows = placements.map((p) => ({
        outfit_id: outfitId,
        item_id: p.itemId,
      }));
      const { error: itemsErr } = await supabase
        .from("outfit_items")
        .upsert(rows);
      if (itemsErr) throw itemsErr;

      if (existing?.id) {
        const keep = placements.map((p) => p.itemId).join(",");
        const { error: pruneErr } = await supabase
          .from("outfit_items")
          .delete()
          .eq("outfit_id", outfitId)
          .not("item_id", "in", `(${keep})`);
        if (pruneErr) throw pruneErr;
      }

      router.push(`/outfits/${outfitId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not save outfit.");
      setSaving(false);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Board */}
        <div>
          <div
            ref={boardRef}
            onClick={() => setSelectedId(null)}
            className="bg-checker relative aspect-square w-full overflow-hidden rounded-2xl border border-border"
          >
            {placements.map((p, i) => {
              const item = byId.get(p.itemId);
              if (!item) return null;
              return (
                <PlacedItem
                  key={p.itemId}
                  placement={p}
                  item={item}
                  z={i + 1}
                  selected={selectedId === p.itemId}
                  onSelect={() => {
                    setSelectedId(p.itemId);
                    bringToFront(p.itemId);
                  }}
                  onRemove={() => removeItem(p.itemId)}
                />
              );
            })}
            {placements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted">
                Tap pieces below to add them, then drag to arrange.
              </div>
            )}
          </div>

          {selectedId && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted">Selected:</span>
              <button
                onClick={() => resizeSelected(-6)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-border/40"
              >
                Smaller
              </button>
              <button
                onClick={() => resizeSelected(6)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-border/40"
              >
                Bigger
              </button>
              <button
                onClick={() => removeItem(selectedId)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Details + tray */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monday meeting"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="work, casual…"
                className={inputClass}
              />
              <button
                onClick={addTag}
                className="rounded-xl border border-border bg-card px-3 text-sm hover:bg-border/40"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="rounded-full bg-border/60 px-2.5 py-1 text-xs hover:bg-border"
                  >
                    {t} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : existing ? "Save changes" : "Save outfit"}
          </button>

          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium">Your pieces</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <TrayChip
                label="All"
                active={!trayCategory}
                onClick={() => setTrayCategory("")}
              />
              {CATEGORIES.map((c) => (
                <TrayChip
                  key={c.value}
                  label={c.label}
                  active={trayCategory === c.value}
                  onClick={() => setTrayCategory(c.value)}
                />
              ))}
            </div>
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto">
              {tray.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item.id)}
                  disabled={placedIds.has(item.id)}
                  title={item.label}
                  className="bg-checker aspect-square overflow-hidden rounded-xl border border-border disabled:opacity-30"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
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
              {tray.length === 0 && (
                <p className="col-span-3 py-6 text-center text-xs text-muted">
                  No pieces here yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}

function PlacedItem({
  placement,
  item,
  z,
  selected,
  onSelect,
  onRemove,
}: {
  placement: BoardPlacement;
  item: BoardItem;
  z: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: placement.itemId });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: "absolute",
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        transform: `translate(-50%, -50%) ${CSS.Translate.toString(transform) ?? ""}`,
        zIndex: isDragging ? 999 : z,
        touchAction: "none",
        cursor: "grab",
      }}
      className={selected ? "rounded-lg outline-2 outline-offset-2 outline-accent" : ""}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt={item.label}
          draggable={false}
          className="pointer-events-none w-full select-none object-contain"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center bg-card text-xs text-muted">
          {item.label}
        </div>
      )}
      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent";

function TrayChip({
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
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "bg-accent text-white"
          : "border border-border bg-card text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

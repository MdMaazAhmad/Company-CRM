"use client";

// src/components/crm/filter-chips.tsx
// The colored filter-chip row (used on Leads, reusable for any status set).

export function FilterChips({
  active,
  onChange,
  allCount,
  chips,
}: {
  active: string; // "ALL" or a status value
  onChange: (value: string) => void;
  allCount: number;
  chips: { value: string; label: string; count: number; color: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("ALL")}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
          active === "ALL"
            ? "border-ink bg-ink text-white"
            : "border-line bg-surface text-muted hover:border-ink/30"
        }`}
      >
        All {allCount}
      </button>
      {chips.map((c) => {
        if (c.count === 0) return null;
        const isActive = active === c.value;
        return (
          <button
            key={c.value}
            onClick={() => onChange(c.value)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition"
            style={
              isActive
                ? { background: c.color, borderColor: c.color, color: "#fff" }
                : {
                    borderColor: `color-mix(in srgb, ${c.color} 30%, transparent)`,
                    color: c.color,
                    background: `color-mix(in srgb, ${c.color} 8%, transparent)`,
                  }
            }
          >
            {c.label} {c.count}
          </button>
        );
      })}
    </div>
  );
}
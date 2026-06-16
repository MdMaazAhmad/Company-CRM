"use client";

// src/components/crm/status-select.tsx
// Generic inline status dropdown with a pending spinner.
// Works for leads OR projects — you pass the options and the action.

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

export function InlineStatusSelect({
  current,
  options,
  onChange,
}: {
  current: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const v = e.target.value;
          start(() => onChange(v));
        }}
        className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-faint" />}
    </div>
  );
}
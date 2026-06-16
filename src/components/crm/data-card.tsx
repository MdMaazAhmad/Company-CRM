// src/components/crm/data-card.tsx
import { ReactNode } from "react";

// The standard rounded surface used across the app, with an optional
// left-edge color strip (the stage/status accent).
export function DataCard({
  children,
  accent,
  className = "",
}: {
  children: ReactNode;
  accent?: string; // hex color for the left strip
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-5 ${className}`}
      style={accent ? { boxShadow: `inset 3px 0 0 ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

// A labeled figure (used for money: Value / Paid / Balance etc).
export function Stat({
  label,
  value,
  color,
  size = "sm",
}: {
  label: string;
  value: string;
  color?: string;
  size?: "sm" | "lg";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-faint">
        {label}
      </div>
      <div
        className={`mt-0.5 font-heading font-semibold tabular-nums ${
          size === "lg" ? "text-2xl" : "text-sm"
        }`}
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
// src/components/crm/progress-bar.tsx
// Payment / completion progress bar with a percent label.

export function ProgressBar({
    pct,
    done,
    doneLabel = "Complete",
  }: {
    pct: number; // 0–100
    done?: boolean;
    doneLabel?: string;
  }) {
    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-faint">
          <span>{pct}%</span>
          {done && <span className="text-st-converted">{doneLabel}</span>}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, pct))}%`,
              background: done ? "#16A34A" : "#FF6B00",
            }}
          />
        </div>
      </div>
    );
  }
// src/components/crm/page-header.tsx
import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-[3px] text-brand">
          {eyebrow}
        </div>
        <h1 className="font-heading text-3xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
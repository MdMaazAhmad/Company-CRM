import { STATUS_META, type Status } from "@/lib/status";

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as Status] ?? STATUS_META.NEW;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}
    >
      {meta.label}
    </span>
  );
}
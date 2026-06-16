// src/components/crm/empty-state.tsx
export function EmptyState({ message }: { message: string }) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-10 text-center">
        <p className="text-sm text-faint">{message}</p>
      </div>
    );
  }
"use client";

// src/components/crm/status-dialog.tsx
// Opens a dialog to choose a new status, then applies it. Replaces the
// instant inline dropdown where you'd rather confirm the change.

import { ReactNode, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function StatusDialog({
  trigger,
  current,
  options,
  onApply,
  title = "Change status",
}: {
  trigger: ReactNode;
  current: string;
  options: { value: string; label: string; color?: string }[];
  onApply: (value: string) => Promise<void>;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(current); // reset to current each time it opens
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          {options.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setValue(o.value)}
                className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition"
                style={
                  selected
                    ? {
                        borderColor: o.color ?? "#FF6B00",
                        background: `color-mix(in srgb, ${
                          o.color ?? "#FF6B00"
                        } 10%, transparent)`,
                      }
                    : { borderColor: "var(--color-line)" }
                }
              >
                <span className="flex items-center gap-2">
                  {o.color && (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: o.color }}
                    />
                  )}
                  {o.label}
                </span>
                {selected && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: o.color ?? "#FF6B00" }}
                  >
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={pending || value === current}
            onClick={() =>
              start(async () => {
                await onApply(value);
                setOpen(false);
              })
            }
          >
            {pending ? "Saving…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
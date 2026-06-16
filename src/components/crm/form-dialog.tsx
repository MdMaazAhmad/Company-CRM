"use client";

// src/components/crm/form-dialog.tsx
// Wraps the Dialog + form + footer boilerplate. You provide:
//  - the trigger button
//  - the form action (server action)
//  - the fields (children)
//  - the submit label
// It closes itself after a successful submit.

import { ReactNode, useState } from "react";
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

export function FormDialog({
  trigger,
  title,
  action,
  submitLabel,
  children,
  hiddenId,
}: {
  trigger: ReactNode;
  title: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  children: ReactNode;
  hiddenId?: string; // pass for edit forms
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await action(fd);
            setOpen(false);
          }}
        >
          {hiddenId && <input type="hidden" name="id" value={hiddenId} />}
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
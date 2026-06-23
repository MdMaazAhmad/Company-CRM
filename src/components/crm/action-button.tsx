"use client";

import { useTransition, type ReactNode } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * Wraps a button that calls an async action, automatically managing a pending
 * state with useTransition so the button is disabled and shows a label while
 * the action is in flight.
 *
 * Usage:
 *   <ActionButton action={() => deleteItem(id)} pendingLabel="Deleting…">
 *     Delete
 *   </ActionButton>
 */
export function ActionButton({
  action,
  children,
  pendingLabel,
  variant = "default",
  size,
  className,
  disabled,
}: {
  action: () => Promise<void> | void;
  children: ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  className?: string;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || pending}
      onClick={() => start(async () => { await action(); })}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

// src/lib/payment-kind.ts
// Payment kinds + methods, labels and colors — single source of truth.

export const PAYMENT_KINDS = ["ADVANCE", "PARTIAL", "MILESTONE", "FINAL"] as const;
export const PAYMENT_METHODS = ["cash", "upi", "bank", "card"] as const;

export const PAYMENT_KIND_LABELS: Record<string, string> = {
  ADVANCE: "Advance",
  PARTIAL: "Partial",
  MILESTONE: "Milestone",
  FINAL: "Final",
};

export const PAYMENT_KIND_COLORS: Record<string, string> = {
  ADVANCE: "#2563EB",
  PARTIAL: "#FF6B00",
  MILESTONE: "#DB2777",
  FINAL: "#16A34A",
};
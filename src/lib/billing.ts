const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type BillingCycle = {
  periodKey: string;
  periodLabel: string;
  amount: number;
  dueDate: Date;
};

type ProjectBilling = {
  billingType: string;
  monthlyAmount: number | null;
  splitBilling: boolean;
  billingActive: boolean;
  billingStart: Date | string | null;
  billingDay?: number | null;
  createdAt: Date | string;
};

function splitHalves(total: number): [number, number] {
  const first = Math.round(total / 2);
  return [first, total - first];
}

export function cyclesDueFor(project: ProjectBilling, upTo: Date = new Date()): BillingCycle[] {
  if (project.billingType !== "MONTHLY" || !project.billingActive) return [];

  const amount = project.monthlyAmount ?? 0;
  if (amount <= 0) return [];

  const start = new Date(project.billingStart ?? project.createdAt);
  if (Number.isNaN(start.getTime())) return [];

  const day = project.billingDay && project.billingDay > 0 ? project.billingDay : 1;
  const cycles: BillingCycle[] = [];

  let y = start.getFullYear();
  let m = start.getMonth();
  const endY = upTo.getFullYear();
  const endM = upTo.getMonth();

  while (y < endY || (y === endY && m <= endM)) {
    const label = `${MONTHS[m]} ${y}`;
    const month = `${y}-${String(m + 1).padStart(2, "0")}`;

    if (project.splitBilling) {
      const [h1, h2] = splitHalves(amount);
      cycles.push({ periodKey: `${month}-H1`, periodLabel: `${label} (1st half)`, amount: h1, dueDate: new Date(y, m, 1) });
      cycles.push({ periodKey: `${month}-H2`, periodLabel: `${label} (2nd half)`, amount: h2, dueDate: new Date(y, m, 15) });
    } else {
      cycles.push({ periodKey: `${month}-FULL`, periodLabel: label, amount, dueDate: new Date(y, m, day) });
    }

    if (++m > 11) { m = 0; y++; }
  }

  return cycles.filter((c) => c.dueDate.getTime() <= upTo.getTime());
}

export function formatInvoiceNumber(seq: number, when: Date = new Date()): string {
  return `INV-${when.getFullYear()}-${String(seq).padStart(4, "0")}`;
}

export const BILLING_TYPES = ["ONE_TIME", "MONTHLY"] as const;
export const INVOICE_STATUSES = ["UNPAID", "PARTIAL", "PAID", "VOID"] as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partly paid",
  PAID: "Paid",
  VOID: "Void",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  UNPAID: "#FF6B00",
  PARTIAL: "#F59E0B",
  PAID: "#16A34A",
  VOID: "#94A3B8",
};

function normalizeState(s?: string | null): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z]/g, "");
}

export function resolveTaxMode(
  clientState?: string | null,
  orgPlaceOfSupply?: string | null,
  fallback: "INTRA" | "INTER" = "INTRA"
): "INTRA" | "INTER" {
  const client = normalizeState(clientState);
  const org = normalizeState(orgPlaceOfSupply);
  if (!client || !org) return fallback;
  return client === org ? "INTRA" : "INTER";
}

export function toAddressLines(addr?: string | null): string[] {
  return (addr ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
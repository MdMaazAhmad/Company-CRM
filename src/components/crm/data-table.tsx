// src/components/crm/data-table.tsx
import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Wraps the rounded border + Table boilerplate.
// Pass column headers and the body rows.
export function DataTable({
  headers,
  children,
}: {
  headers: { label: ReactNode; className?: string }[];
  children: ReactNode; // <TableRow>s
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h, i) => (
              <TableHead key={i} className={h.className}>
                {h.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
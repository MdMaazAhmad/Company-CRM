import { NextRequest } from "next/server";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireOrg } from "@/lib/session";
import { InvoicePdf, type InvoicePdfData } from "@/lib/invoice-pdf";
import { resolveTaxMode, toAddressLines } from "@/lib/billing";

const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { orgId } = await requireOrg();

  const [invoice, org] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, orgId },
      include: {
        project: {
          select: {
            name: true,
            contact: {
              select: {
                name: true,
                business: true,
                city: true,
                state: true,
                billingAddress: true,
                gstin: true,
              },
            },
          },
        },
        payments: { select: { amount: true } },
      },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        billingAddress: true,
        billingPhone: true,
        billingEmail: true,
        billingWebsite: true,
        gstin: true,
        placeOfSupply: true,
        defaultHsnSac: true,
      },
    }),
  ]);

  if (!invoice || !org) return new Response("Not found", { status: 404 });

  const paid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const contact = invoice.project.contact;

  const clientAddressLines =
    toAddressLines(contact.billingAddress).length > 0
      ? toAddressLines(contact.billingAddress)
      : [contact.city ?? ""].filter(Boolean);

  const mode = resolveTaxMode(
    contact.state,
    org.placeOfSupply,
    invoice.taxMode === "INTER" ? "INTER" : "INTRA"
  );

  const data: InvoicePdfData = {
    org: {
      name: org.name,
      addressLines: toAddressLines(org.billingAddress),
      phone: org.billingPhone ?? undefined,
      email: org.billingEmail ?? undefined,
      website: org.billingWebsite ?? undefined,
      gstin: org.gstin ?? undefined,
      placeOfSupply: org.placeOfSupply ?? undefined,
    },
    client: {
      name: contact.name,
      business: contact.business,
      addressLines: clientAddressLines,
      gstin: contact.gstin,
    },
    invoice: {
      number: invoice.number,
      invoiceDate: fmt(invoice.issuedAt),
      dueDate: fmt(invoice.dueDate),
      terms: "Due on Receipt",
    },
    item: {
      description: `${invoice.project.name}\n${invoice.periodLabel}`,
      hsnSac: invoice.hsnSac ?? org.defaultHsnSac ?? undefined,
      qty: 1,
      rate: invoice.amount,
    },
    tax: { gstRate: invoice.gstRate, mode },
    paidAmount: paid,
  };

  const buffer = await renderToBuffer(
    createElement(InvoicePdf, { data }) as ReactElement<DocumentProps>
  );

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}
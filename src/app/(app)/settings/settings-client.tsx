"use client";

import { useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, FieldRow } from "@/components/crm";
import { updateOrgBilling } from "@/lib/org-actions";

type Org = {
  name: string;
  billingAddress: string | null;
  billingPhone: string | null;
  billingEmail: string | null;
  billingWebsite: string | null;
  gstin: string | null;
  placeOfSupply: string | null;
  defaultHsnSac: string | null;
};

export default function SettingsClient({ org }: { org: Org }) {
  const [pending, start] = useTransition();

  function save(fd: FormData) {
    start(async () => {
      try {
        await updateOrgBilling(fd);
        alert("Saved.");
      } catch (e: any) {
        alert(e?.message ?? "Failed to save.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Setup"
        title="Company details"
        subtitle="These appear on every invoice PDF — your letterhead, GSTIN, and tax defaults."
      />

      <form action={save} className="space-y-6">
        <div className="rounded-2xl border border-line bg-surface p-6 grid gap-4">
          <Field label="Company name" name="name" defaultValue={org.name} required />

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-ink">
              Address <span className="font-normal text-muted">(one line per row)</span>
            </label>
            <textarea
              name="billingAddress"
              rows={3}
              defaultValue={org.billingAddress ?? ""}
              placeholder={"Plot No. C-117, Mangol Puri Industrial Area Phase-1\nNew Delhi 110083, Delhi, India"}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <FieldRow>
            <Field label="Phone" name="billingPhone" defaultValue={org.billingPhone} />
            <Field label="Email" name="billingEmail" type="email" defaultValue={org.billingEmail} />
          </FieldRow>
          <Field label="Website" name="billingWebsite" defaultValue={org.billingWebsite} />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 grid gap-4">
          <div className="text-xs uppercase tracking-wide text-faint">Tax</div>
          <FieldRow>
            <Field label="GSTIN" name="gstin" defaultValue={org.gstin} placeholder="07ABEFA2267J1ZG" />
            <Field label="Place of supply" name="placeOfSupply" defaultValue={org.placeOfSupply} placeholder="Delhi (07)" />
          </FieldRow>
          <Field label="Default HSN / SAC" name="defaultHsnSac" defaultValue={org.defaultHsnSac} placeholder="999612" />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="gap-1.5">
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save details"}
          </Button>
        </div>
      </form>
    </div>
  );
}
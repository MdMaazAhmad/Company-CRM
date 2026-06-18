"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  FormDialog,
  Field,
  SelectField,
  FieldRow,
} from "@/components/crm";
import { inr } from "@/lib/ui";
import { updatePlan } from "@/lib/actions";

type Plan = {
  id: string;
  name: string;
  category: string;
  sellPrice: number;
  breakPrice: number | null;
  regularPrice: number | null;
  delivery: string | null;
  active: boolean;
  sortOrder: number;
  tagline: string | null;
  features: string | null;
  costMin: number | null;
  costMax: number | null;
  target: string | null;
  pitch: string | null;
  objection: string | null;
  upsell: string | null;
  gstRate: number | null;
  hsnSac: string | null;
};
type Category = { id: string; label: string; color: string };

const GST_OPTIONS = [
  { value: "0", label: "0% — exempt" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

function parseFeatures(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function PlanFields({ plan, categories }: { plan?: Plan; categories: Category[] }) {
  const categoryOptions = categories.map((c) => ({ value: c.label, label: c.label }));
  const fallback = plan?.category
    ? [{ value: plan.category, label: plan.category }]
    : [{ value: "", label: "— no categories yet —" }];
  return (
    <div className="grid gap-4 py-2">
      <Field label="Plan name" name="name" defaultValue={plan?.name} required />
      <Field label="Tagline" name="tagline" defaultValue={plan?.tagline} />
      <FieldRow>
        <SelectField
          label="Category"
          name="category"
          defaultValue={plan?.category ?? categories[0]?.label ?? ""}
          options={categoryOptions.length ? categoryOptions : fallback}
        />
        <Field label="Delivery" name="delivery" defaultValue={plan?.delivery} />
      </FieldRow>
      <FieldRow>
        <Field label="Regular (₹)" name="regularPrice" type="number" defaultValue={plan?.regularPrice} />
        <Field label="Sell price (₹)" name="sellPrice" type="number" defaultValue={plan?.sellPrice} required />
        <Field label="Break price (₹)" name="breakPrice" type="number" defaultValue={plan?.breakPrice} />
      </FieldRow>
      <FieldRow>
        <SelectField
          label="GST rate"
          name="gstRate"
          defaultValue={plan?.gstRate != null ? String(plan.gstRate) : "18"}
          options={GST_OPTIONS}
        />
        <Field label="HSN / SAC" name="hsnSac" defaultValue={plan?.hsnSac} placeholder="999612" />
      </FieldRow>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-ink">
          Features <span className="font-normal text-muted">(one per line)</span>
        </label>
        <textarea
          name="features"
          rows={8}
          defaultValue={parseFeatures(plan?.features ?? null).join("\n")}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div className="rounded-lg border border-brand/30 bg-brand-soft/30 p-4 grid gap-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Internal only
          </span>
          <span className="text-xs text-muted">Never shown to clients.</span>
        </div>
        <FieldRow>
          <Field label="Hard cost min (₹)" name="costMin" type="number" defaultValue={plan?.costMin} />
          <Field label="Hard cost max (₹)" name="costMax" type="number" defaultValue={plan?.costMax} />
        </FieldRow>
        <Field label="Target client" name="target" defaultValue={plan?.target} />
        <Field label="Opening pitch" name="pitch" defaultValue={plan?.pitch} />
        <Field label="Key objection + answer" name="objection" defaultValue={plan?.objection} />
        <Field label="Upsell / note" name="upsell" defaultValue={plan?.upsell} />
      </div>
      <div className="flex items-center justify-between">
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={plan?.sortOrder ?? 0} />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={plan?.active ?? true} className="h-4 w-4 accent-brand" />
          Active
        </label>
      </div>
    </div>
  );
}

export default function PlanDetailClient({ plan, categories }: { plan: Plan; categories: Category[] }) {
  const features = parseFeatures(plan.features);
  const profitMin = plan.sellPrice - (plan.costMax ?? 0);
  const profitMax = plan.sellPrice - (plan.costMin ?? 0);
  const hasCost = plan.costMin != null && plan.costMax != null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/manage" className="text-sm text-muted hover:text-ink">← Back to Manage</Link>

      <div className="flex items-start justify-between gap-4">
        <PageHeader eyebrow={`Plan · ${plan.category}`} title={plan.name} subtitle={plan.tagline ?? undefined} />
        <FormDialog
          trigger={<Button className="gap-1.5 shrink-0"><Pencil className="h-4 w-4" /> Edit</Button>}
          title="Edit plan"
          action={updatePlan}
          submitLabel="Save changes"
          hiddenId={plan.id}
        >
          <PlanFields plan={plan} categories={categories} />
        </FormDialog>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Sell price</div>
            <div className="font-heading text-2xl text-ink tabular-nums">{inr(plan.sellPrice)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Regular</div>
            <div className="font-heading text-2xl text-faint tabular-nums line-through">
              {plan.regularPrice ? inr(plan.regularPrice) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Break (floor)</div>
            <div className="font-heading text-2xl text-brand tabular-nums">{inr(plan.breakPrice)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>Delivery: {plan.delivery ?? "—"}</span>
          <span>·</span>
          <span>GST: {plan.gstRate != null ? `${plan.gstRate}%` : "—"}</span>
          <span>·</span>
          <span>HSN/SAC: {plan.hsnSac ?? "—"}</span>
          <span>·</span>
          <span>{plan.active ? "Active" : "Hidden"}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <h3 className="font-heading text-lg font-semibold text-ink mb-4">What's included</h3>
        {features.length === 0 ? (
          <p className="text-sm text-faint">No features listed yet.</p>
        ) : (
          <ul className="space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-brand/30 bg-brand-soft/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            Internal only
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Hard cost</div>
            <div className="font-heading text-xl text-ink tabular-nums">
              {hasCost ? `${inr(plan.costMin)} – ${inr(plan.costMax)}` : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Profit</div>
            <div className="font-heading text-xl text-st-converted tabular-nums">
              {hasCost ? `${inr(profitMin)} – ${inr(profitMax)}` : "—"}
            </div>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          {plan.target && (<div><dt className="text-muted">Target</dt><dd className="text-ink">{plan.target}</dd></div>)}
          {plan.pitch && (<div><dt className="text-muted">Opening pitch</dt><dd className="text-ink">{plan.pitch}</dd></div>)}
          {plan.objection && (<div><dt className="text-muted">Key objection</dt><dd className="text-ink">{plan.objection}</dd></div>)}
          {plan.upsell && (<div><dt className="text-muted">Upsell / note</dt><dd className="text-ink">{plan.upsell}</dd></div>)}
        </dl>
      </div>
    </div>
  );
}
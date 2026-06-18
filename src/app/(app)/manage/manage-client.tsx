"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  EmptyState,
  DataTable,
  ConfirmDelete,
  FormDialog,
  Field,
  SelectField,
  FieldRow,
} from "@/components/crm";
import { inr } from "@/lib/ui";
import {
  createPlan,
  updatePlan,
  deletePlan,
  createSource,
  deleteSource,
  createCategory,
  deleteCategory,
} from "@/lib/actions";

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
type Source = { id: string; label: string };
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

function CategoryFields() {
  return (
    <div className="grid gap-4 py-2">
      <Field label="Category name" name="label" placeholder="e.g. SEO, Branding, Consulting" required />
      <FieldRow>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-ink">Color</label>
          <input
            type="color"
            name="color"
            defaultValue="#FF6B00"
            className="h-10 w-full rounded-lg border border-line bg-surface"
          />
        </div>
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={0} />
      </FieldRow>
    </div>
  );
}

function SourceRow({ source }: { source: Source }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-2.5">
      <span className="text-sm">{source.label}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending} onClick={() => start(() => deleteSource(source.id))}>
        <Trash2 className="h-3.5 w-3.5 text-st-dropped" />
      </Button>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-2.5" style={{ boxShadow: `inset 3px 0 0 ${category.color}` }}>
      <span className="flex items-center gap-2 text-sm">
        <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
        {category.label}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={pending} onClick={() => start(() => deleteCategory(category.id))}>
        <Trash2 className="h-3.5 w-3.5 text-st-dropped" />
      </Button>
    </div>
  );
}

export default function ManageClient({
  plans,
  sources,
  categories,
}: {
  plans: Plan[];
  sources: Source[];
  categories: Category[];
}) {
  const colorOf = (label: string) => categories.find((c) => c.label === label)?.color ?? "#94A3B8";

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader eyebrow="Setup" title="Manage" subtitle="Your plan catalog, categories, and lead sources." />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">Plan catalog</h2>
          <FormDialog
            trigger={<Button className="gap-1.5"><Plus className="h-4 w-4" /> Add plan</Button>}
            title="Add plan"
            action={createPlan}
            submitLabel="Add plan"
          >
            <PlanFields categories={categories} />
          </FormDialog>
        </div>

        {plans.length === 0 ? (
          <EmptyState message="No plans yet. Add your first to reuse pricing on leads and projects." />
        ) : (
          <DataTable
            headers={[
              { label: "Plan" },
              { label: "Category" },
              { label: "Sell", className: "text-right" },
              { label: "Break", className: "text-right" },
              { label: "Delivery" },
              { label: "Status" },
              { label: "", className: "w-[100px]" },
            ]}
          >
            {plans.map((p) => (
              <TableRow key={p.id} className="transition-colors hover:bg-line-soft/60" style={{ boxShadow: `inset 3px 0 0 ${colorOf(p.category)}` }}>
                <TableCell className="font-medium">
                  <Link href={`/manage/plans/${p.id}`} className="hover:text-brand hover:underline">{p.name}</Link>
                </TableCell>
                <TableCell className="text-muted">{p.category}</TableCell>
                <TableCell className="text-right tabular-nums">{inr(p.sellPrice)}</TableCell>
                <TableCell className="text-right tabular-nums text-faint">{inr(p.breakPrice)}</TableCell>
                <TableCell className="text-muted">{p.delivery ?? "—"}</TableCell>
                <TableCell>
                  {p.active ? <span className="text-xs font-medium text-st-converted">Active</span> : <span className="text-xs text-faint">Hidden</span>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <FormDialog
                      trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>}
                      title="Edit plan"
                      action={updatePlan}
                      submitLabel="Save changes"
                      hiddenId={p.id}
                    >
                      <PlanFields plan={p} categories={categories} />
                    </FormDialog>
                    <ConfirmDelete onConfirm={() => deletePlan(p.id)} title="Delete this plan?" description="Existing leads and projects keep their saved prices." />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">Categories</h2>
          <FormDialog
            trigger={<Button variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Add category</Button>}
            title="Add category"
            action={createCategory}
            submitLabel="Add category"
          >
            <CategoryFields />
          </FormDialog>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-faint">No categories yet. Add ones that fit your business — e.g. Marketing, Video, SEO, Consulting.</p>
        ) : (
          <div className="grid max-w-xl gap-2">
            {categories.map((c) => <CategoryRow key={c.id} category={c} />)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Lead sources</h2>
        <form action={async (fd) => { await createSource(fd); }} className="flex gap-2">
          <Input name="label" placeholder="e.g. Referral, Instagram, Walk-in" required className="max-w-xs" />
          <Button type="submit" className="gap-1.5"><Plus className="h-4 w-4" /> Add</Button>
        </form>
        {sources.length === 0 ? (
          <p className="text-sm text-faint">No sources yet.</p>
        ) : (
          <div className="grid max-w-xl gap-2">
            {sources.map((s) => <SourceRow key={s.id} source={s} />)}
          </div>
        )}
      </section>
    </div>
  );
}
"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/card";
import { CATEGORY_META, Category, GroupMember } from "@/lib/types";
import { splitEqually } from "@/lib/balance-calculator";
import { useAddExpense } from "@/lib/queries";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1, "Give this expense a name"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paidBy: z.string().min(1),
  category: z.string().min(1),
  notes: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function AddExpenseSheet({
  open,
  onOpenChange,
  groupId,
  members,
  currentUserId,
  currentUserName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  currentUserName: string;
}) {
  const [splitWith, setSplitWith] = useState<string[]>(members.map((m) => m.user_id));
  const addExpense = useAddExpense(groupId);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paidBy: currentUserId,
      category: "food",
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
    },
  });

  const amount = watch("amount");
  const preview = useMemo(() => {
    if (!amount || splitWith.length === 0) return {};
    return splitEqually(Number(amount), splitWith);
  }, [amount, splitWith]);

  function toggleMember(id: string) {
    setSplitWith((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(values: FormValues) {
    if (splitWith.length === 0) return;
    const shares = splitEqually(values.amount, splitWith);
    await addExpense.mutateAsync({
      title: values.title,
      amount: values.amount,
      paidBy: values.paidBy,
      category: values.category,
      notes: values.notes,
      date: values.date,
      time: values.time,
      shares,
      actorId: currentUserId,
      actorName: currentUserName,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add expense">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-4">
        <Field label="What was it for?" error={errors.title?.message}>
          <input
            {...register("title")}
            placeholder="Dinner at Trishna"
            className="w-full rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3 text-ink outline-none placeholder:text-ink-faint focus:border-brand"
          />
        </Field>

        <Field label="Amount" error={errors.amount?.message}>
          <div className="flex items-center gap-2 rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3">
            <span className="text-ink-faint">₹</span>
            <input
              type="number"
              step="0.01"
              {...register("amount")}
              placeholder="0.00"
              className="w-full bg-transparent font-amount text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        </Field>

        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
              <label key={c}>
                <input type="radio" value={c} {...register("category")} className="peer sr-only" />
                <span className="cursor-pointer rounded-full border border-surface-border px-3 py-1.5 text-xs text-ink-muted peer-checked:border-brand peer-checked:bg-brand/15 peer-checked:text-brand">
                  {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Paid by">
          <select
            {...register("paidBy")}
            className="w-full rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3 text-ink outline-none focus:border-brand"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profile?.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Split between (${splitWith.length})`}>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const active = splitWith.includes(m.user_id);
              return (
                <button
                  type="button"
                  key={m.user_id}
                  onClick={() => toggleMember(m.user_id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs transition-colors",
                    active ? "border-brand bg-brand/10 text-ink" : "border-surface-border text-ink-faint"
                  )}
                >
                  <Avatar name={m.profile?.name ?? "?"} src={m.profile?.avatar_url} size={22} />
                  {m.profile?.name}
                  {active && preview[m.user_id] !== undefined && (
                    <span className="font-amount text-ink-muted">
                      ₹{preview[m.user_id].toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Notes (optional)">
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="Add a note…"
            className="w-full resize-none rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || splitWith.length === 0}>
          {isSubmitting ? "Adding…" : "Add expense"}
        </Button>
      </form>
    </BottomSheet>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-owe">{error}</p>}
    </div>
  );
}

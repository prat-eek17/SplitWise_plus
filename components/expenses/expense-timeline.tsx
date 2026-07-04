"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Expense, CATEGORY_META } from "@/lib/types";
import { Avatar } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useDeleteExpense } from "@/lib/queries";

export function ExpenseTimeline({
  expenses,
  currentUserId,
  currentUserName,
}: {
  expenses: Expense[];
  currentUserId: string;
  currentUserName: string;
}) {
  const grouped = groupByDate(expenses);
  const deleteExpense = useDeleteExpense(expenses[0]?.group_id ?? "");

  if (expenses.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-3xl">🧾</p>
        <p className="mt-3 text-sm text-ink-muted">No expenses yet — add the first one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            {formatDateLabel(date)}
          </p>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onDelete={() =>
                    deleteExpense.mutate({
                      expenseId: expense.id,
                      actorId: currentUserId,
                      actorName: currentUserName,
                      title: expense.title,
                    })
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpenseCard({ expense, onDelete }: { expense: Expense; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[expense.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-xl2 border border-surface-border bg-surface"
    >
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-3.5 text-left">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 bg-surface-raised text-lg">
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{expense.title}</p>
          <p className="text-xs text-ink-faint">
            {expense.paid_by_profile?.name ?? "Someone"} paid · {expense.expense_time?.slice(0, 5)}
          </p>
        </div>
        <p className="font-amount font-display text-sm font-semibold text-ink">
          {formatCurrency(expense.amount)}
        </p>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-surface-border px-3.5 pb-3.5"
          >
            {expense.notes && <p className="mt-3 text-sm text-ink-muted">{expense.notes}</p>}

            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-faint">Split between</p>
            <div className="mt-2 space-y-1.5">
              {expense.participants?.map((p) => (
                <div key={p.user_id} className="flex items-center gap-2">
                  <Avatar name={p.profile?.name ?? "?"} src={p.profile?.avatar_url} size={22} />
                  <span className="flex-1 text-sm text-ink-muted">{p.profile?.name}</span>
                  <span className="font-amount text-sm text-ink">{formatCurrency(p.share_amount)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onDelete}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-owe"
            >
              <Trash2 size={13} /> Delete expense
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function groupByDate(expenses: Expense[]): Record<string, Expense[]> {
  return expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    (acc[e.expense_date] ??= []).push(e);
    return acc;
  }, {});
}

function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

"use client";

import { useMemo } from "react";
import { useMyGroups, useGroupExpenses } from "@/lib/queries";
import { useAppStore, filterExpenses } from "@/lib/store";
import { SearchFilterBar } from "@/components/expenses/search-filter-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CATEGORY_META } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function SearchPage() {
  const { data: groups = [] } = useMyGroups();
  const { filters } = useAppStore();

  const filteredGroups = useMemo(
    () =>
      filters.query
        ? groups.filter((g) => g.name.toLowerCase().includes(filters.query.toLowerCase()))
        : groups,
    [groups, filters.query]
  );

  return (
    <main className="min-h-screen pb-32 pt-safe">
      <div className="mx-auto max-w-lg px-5 pt-6">
        <h1 className="font-display text-xl font-semibold text-ink">Search</h1>
        <div className="mt-4">
          <SearchFilterBar />
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Groups</p>
            {filteredGroups.length === 0 && (
              <p className="text-sm text-ink-faint">No matching groups.</p>
            )}
            <div className="space-y-2">
              {filteredGroups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="flex items-center gap-3 rounded-xl2 border border-surface-border bg-surface p-3.5"
                >
                  <span className="text-xl">{g.emoji}</span>
                  <span className="text-sm text-ink">{g.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {groups.map((g) => (
            <GroupExpenseResults key={g.id} groupId={g.id} groupName={g.name} />
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}

function GroupExpenseResults({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { data: expenses = [] } = useGroupExpenses(groupId);
  const { filters } = useAppStore();
  const matches = filterExpenses(expenses, filters);

  if (!filters.query && filters.category === "all" && filters.memberId === "all") return null;
  if (matches.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">{groupName}</p>
      <div className="space-y-2">
        {matches.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl2 border border-surface-border bg-surface p-3.5">
            <span className="text-lg">{CATEGORY_META[e.category].emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">{e.title}</p>
              <p className="text-xs text-ink-faint">{e.expense_date}</p>
            </div>
            <p className="font-amount text-sm font-medium text-ink">{formatCurrency(e.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

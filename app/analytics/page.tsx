"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { useMyGroups, useGroupExpenses, useGroupMembers } from "@/lib/queries";
import { CATEGORY_META, Category } from "@/lib/types";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#7C6CFF", "#34D399", "#FBBF24", "#FB7185", "#60A5FA", "#F472B6", "#94A3B8"];

export default function AnalyticsPage() {
  const { data: groups = [] } = useMyGroups();

  return (
    <main className="min-h-screen pb-32 pt-safe">
      <div className="mx-auto max-w-lg space-y-6 px-5 pt-6">
        <h1 className="font-display text-xl font-semibold text-ink">Insights</h1>
        {groups.length === 0 && (
          <p className="text-sm text-ink-faint">Join or create a group to see analytics.</p>
        )}
        {groups.map((g) => (
          <GroupAnalytics key={g.id} groupId={g.id} groupName={g.name} />
        ))}
      </div>
      <BottomNav />
    </main>
  );
}

function GroupAnalytics({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { data: expenses = [] } = useGroupExpenses(groupId);
  const { data: members = [] } = useGroupMembers(groupId);

  const categoryData = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const e of expenses) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    return Array.from(totals.entries()).map(([category, value]) => ({
      name: `${CATEGORY_META[category].emoji} ${CATEGORY_META[category].label}`,
      value,
    }));
  }, [expenses]);

  const memberContributions = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) totals.set(e.paid_by, (totals.get(e.paid_by) ?? 0) + e.amount);
    return members.map((m) => ({
      name: m.profile?.name?.split(" ")[0] ?? "?",
      value: totals.get(m.user_id) ?? 0,
    }));
  }, [expenses, members]);

  const topSpender = memberContributions.reduce(
    (top, m) => (m.value > (top?.value ?? -1) ? m : top),
    null as { name: string; value: number } | null
  );

  if (expenses.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="font-display text-sm font-semibold text-ink">{groupName}</p>

      {topSpender && (
        <p className="mt-1 text-xs text-ink-muted">
          Highest spender: <span className="text-ink">{topSpender.name}</span> ·{" "}
          {formatCurrency(topSpender.value)}
        </p>
      )}

      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={64} paddingAngle={3}>
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1B1E27", border: "1px solid #262A35", borderRadius: 12 }}
              formatter={(v: number) => formatCurrency(v)}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {categoryData.map((c, i) => (
          <span key={c.name} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {c.name}
          </span>
        ))}
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-ink-faint">
        Member contributions
      </p>
      <div className="mt-2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={memberContributions}>
            <XAxis dataKey="name" stroke="#8B90A0" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1B1E27", border: "1px solid #262A35", borderRadius: 12 }}
              formatter={(v: number) => formatCurrency(v)}
              cursor={{ fill: "rgba(124,108,255,0.08)" }}
            />
            <Bar dataKey="value" fill="#7C6CFF" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

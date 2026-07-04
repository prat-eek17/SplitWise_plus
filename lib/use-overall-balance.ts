"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "./supabase/client";
import { calculateBalances } from "./balance-calculator";
import { Expense, Settlement } from "./types";

const supabase = createClient();

/**
 * Aggregates "you owe" / "you are owed" across every group the user is in,
 * plus this calendar month's total spend, for the Dashboard hero card.
 * This intentionally re-derives balances from raw expenses (same engine
 * as the group page) rather than trusting a cached total, so the two
 * screens can never drift out of sync.
 */
export function useOverallBalance(userId: string | undefined) {
  return useQuery({
    queryKey: ["overall-balance", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: memberships, error: mErr } = await supabase
        .from("group_members")
        .select("group_id");
      if (mErr) throw mErr;
      const groupIds = (memberships ?? []).map((m) => m.group_id);
      if (groupIds.length === 0) {
        return { youOwe: 0, youAreOwed: 0, monthlySpend: 0 };
      }

      const { data: expenses, error: eErr } = await supabase
        .from("expenses")
        .select("*, participants:expense_participants(*)")
        .in("group_id", groupIds);
      if (eErr) throw eErr;

      const { data: settlements, error: sErr } = await supabase
        .from("settlements")
        .select("*")
        .in("group_id", groupIds);
      if (sErr) throw sErr;

      let youOwe = 0;
      let youAreOwed = 0;

      for (const groupId of groupIds) {
        const groupExpenses = (expenses as unknown as Expense[]).filter(
          (e) => e.group_id === groupId
        );
        const groupSettlements = (settlements as unknown as Settlement[]).filter(
          (s) => s.group_id === groupId
        );
        const memberIds = Array.from(
          new Set(groupExpenses.flatMap((e) => (e.participants ?? []).map((p) => p.user_id)))
        );
        const balances = calculateBalances(groupExpenses, groupSettlements, memberIds);
        const mine = balances.find((b) => b.userId === userId)?.net ?? 0;
        if (mine > 0) youAreOwed += mine;
        else youOwe += -mine;
      }

      const now = new Date();
      const monthlySpend = (expenses as unknown as Expense[])
        .filter((e) => {
          const d = new Date(e.expense_date);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear() &&
            (e.participants ?? []).some((p) => p.user_id === userId)
          );
        })
        .reduce((sum, e) => {
          const share = e.participants?.find((p) => p.user_id === userId)?.share_amount ?? 0;
          return sum + share;
        }, 0);

      return {
        youOwe: Math.round(youOwe * 100) / 100,
        youAreOwed: Math.round(youAreOwed * 100) / 100,
        monthlySpend: Math.round(monthlySpend * 100) / 100,
      };
    },
  });
}

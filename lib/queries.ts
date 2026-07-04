"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createClient } from "./supabase/client";
import { Expense, Settlement, ActivityItem, GroupMember, Group } from "./types";

const supabase = createClient();

// ---------------------------------------------------------------------------
// Groups the current user belongs to (used on the Dashboard)
// ---------------------------------------------------------------------------
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ["group", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<Group> => {
      const { data, error } = await supabase.from("groups").select("*").eq("id", groupId).single();
      if (error) throw error;
      return data as Group;
    },
  });
}

export function useMyGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await supabase
        .from("group_members")
        .select("groups(*)")
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => row.groups).filter(Boolean);
    },
  });
}

// ---------------------------------------------------------------------------
// Everything needed to render a single group: members, expenses (with
// participants + payer profile), and settlements.
// ---------------------------------------------------------------------------
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: ["group-members", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await supabase
        .from("group_members")
        .select("*, profile:profiles(*)")
        .eq("group_id", groupId);
      if (error) throw error;
      return data as unknown as GroupMember[];
    },
  });
}

export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: ["expenses", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          "*, paid_by_profile:profiles!expenses_paid_by_fkey(*), participants:expense_participants(*, profile:profiles(*))"
        )
        .eq("group_id", groupId)
        .order("expense_date", { ascending: false })
        .order("expense_time", { ascending: false });
      if (error) throw error;
      return data as unknown as Expense[];
    },
  });
}

export function useGroupSettlements(groupId: string) {
  return useQuery({
    queryKey: ["settlements", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<Settlement[]> => {
      const { data, error } = await supabase
        .from("settlements")
        .select("*, from_profile:profiles!settlements_from_user_fkey(*), to_profile:profiles!settlements_to_user_fkey(*)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Settlement[];
    },
  });
}

export function useGroupActivity(groupId: string) {
  return useQuery({
    queryKey: ["activity", groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<ActivityItem[]> => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*, actor:profiles(*)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as ActivityItem[];
    },
  });
}

// ---------------------------------------------------------------------------
// Realtime: subscribe once per group and invalidate the relevant query on
// any insert/update/delete so every member's screen updates instantly.
// ---------------------------------------------------------------------------
export function useRealtimeGroup(groupId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` },
        () => queryClient.invalidateQueries({ queryKey: ["expenses", groupId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements", filter: `group_id=eq.${groupId}` },
        () => queryClient.invalidateQueries({ queryKey: ["settlements", groupId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activity_log", filter: `group_id=eq.${groupId}` },
        () => queryClient.invalidateQueries({ queryKey: ["activity", groupId] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        () => queryClient.invalidateQueries({ queryKey: ["group-members", groupId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, queryClient]);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useAddExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      amount: number;
      paidBy: string;
      category: string;
      notes?: string;
      date: string;
      time: string;
      shares: Record<string, number>;
      actorId: string;
      actorName: string;
    }) => {
      const { data: expense, error } = await supabase
        .from("expenses")
        .insert({
          group_id: groupId,
          title: input.title,
          amount: input.amount,
          paid_by: input.paidBy,
          category: input.category,
          notes: input.notes ?? null,
          expense_date: input.date,
          expense_time: input.time,
          created_by: input.actorId,
        })
        .select()
        .single();
      if (error) throw error;

      const rows = Object.entries(input.shares).map(([user_id, share_amount]) => ({
        expense_id: expense.id,
        user_id,
        share_amount,
      }));
      const { error: partErr } = await supabase.from("expense_participants").insert(rows);
      if (partErr) throw partErr;

      await supabase.from("activity_log").insert({
        group_id: groupId,
        actor_id: input.actorId,
        type: "expense_added",
        message: `${input.actorName} added "${input.title}"`,
        metadata: { expense_id: expense.id, amount: input.amount },
      });

      return expense;
    },
    // Optimistic UI: the expense timeline feels instant even before the
    // network round-trip completes.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["expenses", groupId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["activity", groupId] });
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      expenseId,
      actorId,
      actorName,
      title,
    }: {
      expenseId: string;
      actorId: string;
      actorName: string;
      title: string;
    }) => {
      const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
      if (error) throw error;
      await supabase.from("activity_log").insert({
        group_id: groupId,
        actor_id: actorId,
        type: "expense_deleted",
        message: `${actorName} deleted "${title}"`,
        metadata: { expense_id: expenseId },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["activity", groupId] });
    },
  });
}

export function useCompleteSettlement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      settlementId,
      actorId,
      actorName,
      amount,
    }: {
      settlementId: string;
      actorId: string;
      actorName: string;
      amount: number;
    }) => {
      const { error } = await supabase
        .from("settlements")
        .update({ status: "completed", settled_at: new Date().toISOString() })
        .eq("id", settlementId);
      if (error) throw error;
      await supabase.from("activity_log").insert({
        group_id: groupId,
        actor_id: actorId,
        type: "settlement_completed",
        message: `${actorName} settled ₹${amount.toFixed(2)}`,
        metadata: { settlement_id: settlementId, amount },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["activity", groupId] });
    },
  });
}

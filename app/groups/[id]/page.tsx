"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useProfile } from "@/lib/use-profile";
import {
  useGroupMembers,
  useGroupExpenses,
  useGroupSettlements,
  useGroupActivity,
  useRealtimeGroup,
  useCompleteSettlement,
  useGroup,
} from "@/lib/queries";
import { calculateBalances, suggestSettlements, totalGroupSpend } from "@/lib/balance-calculator";
import { filterExpenses, useAppStore } from "@/lib/store";
import { GroupStats } from "@/components/groups/group-stats";
import { GroupTabs, GroupTab } from "@/components/groups/group-tabs";
import { ExpenseTimeline } from "@/components/expenses/expense-timeline";
import { SearchFilterBar } from "@/components/expenses/search-filter-bar";
import { SettlementFlow } from "@/components/groups/settlement-flow";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { AddExpenseSheet } from "@/components/expenses/add-expense-sheet";
import { InviteSheet } from "@/components/groups/invite-sheet";
import { FAB } from "@/components/layout/fab";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SettlementSuggestion } from "@/lib/types";

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const { data: profile } = useProfile();
  const { data: members = [] } = useGroupMembers(groupId);
  const { data: expenses = [] } = useGroupExpenses(groupId);
  const { data: settlements = [] } = useGroupSettlements(groupId);
  const { data: activity = [] } = useGroupActivity(groupId);
  useRealtimeGroup(groupId);

  const [tab, setTab] = useState<GroupTab>("Timeline");
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const { filters } = useAppStore();
  const completeSettlement = useCompleteSettlement(groupId);

  const memberIds = members.map((m) => m.user_id);
  const balances = useMemo(
    () => calculateBalances(expenses, settlements, memberIds),
    [expenses, settlements, memberIds]
  );
  const myNet = balances.find((b) => b.userId === profile?.id)?.net ?? 0;
  const suggestions = useMemo(() => suggestSettlements(balances), [balances]);
  const totalSpend = totalGroupSpend(expenses);
  const filteredExpenses = filterExpenses(expenses, filters);

  async function handleSettle(s: SettlementSuggestion) {
    const key = `${s.fromUserId}-${s.toUserId}`;
    setSettlingId(key);
    // Record a completed settlement directly (simplification suggestions
    // are computed, not stored, until someone acts on one).
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase
      .from("settlements")
      .insert({
        group_id: groupId,
        from_user: s.fromUserId,
        to_user: s.toUserId,
        amount: s.amount,
        status: "completed",
        settled_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (data && profile) {
      completeSettlement.mutate({
        settlementId: data.id,
        actorId: profile.id,
        actorName: profile.name,
        amount: s.amount,
      });
    }
    setSettlingId(null);
  }

  return (
    <main className="min-h-screen pb-32 pt-safe">
      <div className="mx-auto max-w-lg px-5 pt-6">
        <GroupHeaderStats
          groupId={groupId}
          totalSpend={totalSpend}
          myNet={myNet}
          members={members}
        />

        <button
          onClick={() => setInviteOpen(true)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl2 border border-dashed border-surface-border py-2.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <UserPlus size={14} /> Invite members
        </button>

        <div className="mt-5">
          <GroupTabs active={tab} onChange={setTab} />
        </div>

        <div className="mt-5">
          {tab === "Timeline" && (
            <>
              <SearchFilterBar members={members} />
              <div className="mt-4">
                {profile && (
                  <ExpenseTimeline
                    expenses={filteredExpenses}
                    currentUserId={profile.id}
                    currentUserName={profile.name}
                  />
                )}
              </div>
            </>
          )}

          {tab === "Settle up" && (
            <SettlementFlow
              suggestions={suggestions}
              members={members}
              onSettle={handleSettle}
              settlingId={settlingId}
            />
          )}

          {tab === "Activity" && <ActivityFeed items={activity} />}
        </div>
      </div>

      {profile && members.length > 0 && (
        <>
          <FAB onClick={() => setAddOpen(true)} />
          <AddExpenseSheet
            open={addOpen}
            onOpenChange={setAddOpen}
            groupId={groupId}
            members={members}
            currentUserId={profile.id}
            currentUserName={profile.name}
          />
          <InviteSheet
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            groupId={groupId}
            userId={profile.id}
          />
        </>
      )}
      <BottomNav />
    </main>
  );
}

// Fetches the group row itself (name/emoji) separately so the stats card
// never blocks on the members query above.
function GroupHeaderStats({
  groupId,
  totalSpend,
  myNet,
  members,
}: {
  groupId: string;
  totalSpend: number;
  myNet: number;
  members: ReturnType<typeof useGroupMembers>["data"];
}) {
  const { data: group } = useGroup(groupId);

  return (
    <GroupStats
      emoji={group?.emoji ?? "💸"}
      name={group?.name ?? "Loading…"}
      totalSpend={totalSpend}
      myNet={myNet}
      members={members ?? []}
    />
  );
}

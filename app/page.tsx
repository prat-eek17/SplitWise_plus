"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useProfile } from "@/lib/use-profile";
import { useOverallBalance } from "@/lib/use-overall-balance";
import { useMyGroups } from "@/lib/queries";
import { BalanceHero } from "@/components/dashboard/balance-hero";
import { GroupCard } from "@/components/dashboard/group-card";
import { CreateGroupSheet } from "@/components/dashboard/create-group-sheet";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: groups, isLoading: groupsLoading } = useMyGroups();
  const { data: balance } = useOverallBalance(profile?.id);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="min-h-screen pb-32 pt-safe">
      <div className="mx-auto max-w-lg px-5 pt-6">
        {profile && (
          <BalanceHero
            name={profile.name}
            youOwe={balance?.youOwe ?? 0}
            youAreOwed={balance?.youAreOwed ?? 0}
            monthlySpend={balance?.monthlySpend ?? 0}
          />
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Your groups</h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1 text-sm font-medium text-brand"
          >
            <Plus size={16} /> New
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {groupsLoading && <SkeletonGroups />}
          {!groupsLoading && groups?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl2 border border-dashed border-surface-border p-8 text-center"
            >
              <p className="text-2xl">👋</p>
              <p className="mt-2 text-sm text-ink-muted">
                No groups yet. Create one to start splitting expenses.
              </p>
            </motion.div>
          )}
          {groups?.map((g, i) => (
            <GroupCard key={g.id} group={g} index={i} />
          ))}
        </div>
      </div>

      {profile && (
        <CreateGroupSheet open={createOpen} onOpenChange={setCreateOpen} userId={profile.id} />
      )}
      <BottomNav />
    </main>
  );
}

function SkeletonGroups() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-xl2 bg-surface" />
      ))}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { GroupMember } from "@/lib/types";
import { SettlementSuggestion } from "@/lib/types";
import { Avatar } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

/**
 * The app's signature visual: instead of a plain "X owes Y ₹420" list row,
 * each settlement renders as a horizontal bar with a slow-moving gradient —
 * money visibly "in flow" between the two avatars anchoring each end.
 */
export function SettlementFlow({
  suggestions,
  members,
  onSettle,
  settlingId,
}: {
  suggestions: SettlementSuggestion[];
  members: GroupMember[];
  onSettle: (s: SettlementSuggestion) => void;
  settlingId: string | null;
}) {
  const findMember = (id: string) => members.find((m) => m.user_id === id)?.profile;

  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl2 border border-owed/20 bg-owed-soft p-6 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 text-sm text-owed">Everyone's settled up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s, i) => {
        const from = findMember(s.fromUserId);
        const to = findMember(s.toUserId);
        const key = `${s.fromUserId}-${s.toUserId}`;
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="overflow-hidden rounded-xl2 border border-surface-border bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar name={from?.name ?? "?"} src={from?.avatar_url} size={36} />
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
                <div className="flow-bar absolute inset-0 animate-flow-bar" />
              </div>
              <ArrowRight size={16} className="text-ink-faint" />
              <Avatar name={to?.name ?? "?"} src={to?.avatar_url} size={36} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-ink-muted">
                <span className="font-medium text-ink">{from?.name}</span> owes{" "}
                <span className="font-medium text-ink">{to?.name}</span>
              </p>
              <p className="font-amount font-display text-base font-semibold text-ink">
                {formatCurrency(s.amount)}
              </p>
            </div>

            <button
              onClick={() => onSettle(s)}
              disabled={settlingId === key}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl2 bg-owed/10 py-2.5 text-sm font-medium text-owed transition-colors hover:bg-owed/20 disabled:opacity-50"
            >
              <Check size={15} />
              {settlingId === key ? "Marking settled…" : "Mark as settled"}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

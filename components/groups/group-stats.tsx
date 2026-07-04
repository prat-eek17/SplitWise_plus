"use client";

import { motion } from "framer-motion";
import { GroupMember } from "@/lib/types";
import { Avatar } from "@/components/ui/card";
import { AnimatedAmount } from "@/components/ui/animated-amount";

export function GroupStats({
  emoji,
  name,
  totalSpend,
  myNet,
  members,
}: {
  emoji: string;
  name: string;
  totalSpend: number;
  myNet: number;
  members: GroupMember[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl3 border border-surface-border bg-gradient-to-br from-surface-raised to-surface p-6 shadow-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl2 bg-brand/15 text-2xl">
          {emoji}
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">{name}</h1>
          <div className="mt-1 flex -space-x-2">
            {members.slice(0, 6).map((m) => (
              <Avatar
                key={m.user_id}
                name={m.profile?.name ?? "?"}
                src={m.profile?.avatar_url}
                size={22}
                className="ring-2 ring-surface"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl2 bg-surface/60 p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-ink-faint">Total spend</p>
          <p className="mt-1 font-amount font-display text-lg font-semibold text-ink">
            <AnimatedAmount value={totalSpend} />
          </p>
        </div>
        <div className="rounded-xl2 bg-surface/60 p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-ink-faint">Your balance</p>
          <p className={`mt-1 font-amount font-display text-lg font-semibold ${myNet >= 0 ? "text-owed" : "text-owe"}`}>
            <AnimatedAmount value={myNet} />
          </p>
        </div>
      </div>
    </motion.div>
  );
}

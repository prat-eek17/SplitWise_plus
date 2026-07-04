"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Receipt, Pencil, Trash2, UserPlus, UserMinus, HandCoins, type LucideIcon } from "lucide-react";
import { ActivityItem, ActivityType } from "@/lib/types";
import { Avatar } from "@/components/ui/card";

const ICONS: Record<ActivityType, LucideIcon> = {
  expense_added: Receipt,
  expense_edited: Pencil,
  expense_deleted: Trash2,
  member_joined: UserPlus,
  member_left: UserMinus,
  settlement_completed: HandCoins,
};

const TONES: Record<ActivityType, string> = {
  expense_added: "text-brand bg-brand-soft",
  expense_edited: "text-pending bg-pending-soft",
  expense_deleted: "text-owe bg-owe-soft",
  member_joined: "text-owed bg-owed-soft",
  member_left: "text-ink-muted bg-surface-raised",
  settlement_completed: "text-owed bg-owed-soft",
};

export function ActivityFeed({ items, emptyLabel = "No activity yet" }: { items: ActivityItem[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-faint">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {items.map((item, i) => {
          const Icon = ICONS[item.type];
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.03 }}
              className="flex items-center gap-3 rounded-xl2 px-2 py-2.5 hover:bg-surface-raised/50"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONES[item.type]}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{item.message}</p>
                <p className="text-xs text-ink-faint">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
              {item.actor && <Avatar name={item.actor.name} src={item.actor.avatar_url} size={28} />}
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
